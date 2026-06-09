const express = require("express");
const mongoose = require("mongoose");
const Groq = require("groq-sdk");
const { Document } = require("@langchain/core/documents");
const Product = require("../models/Product");
const Order = require("../models/Order");

const router = express.Router();

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const round2 = (num) => Math.round(num * 100) / 100;
const roundInt = (num) => Math.max(0, Math.round(num));

const getProductsCollection = async (req) => {
  const chromaClient = req.app.locals.chromaClient;
  const embeddingFunction = req.app.locals.embeddingFunction;

  if (!chromaClient) {
    throw new Error("Chroma client not found");
  }

  if (req.app.locals.productsCollection) {
    return req.app.locals.productsCollection;
  }

  const collection = await chromaClient.getOrCreateCollection({
    name: "products",
    embeddingFunction,
  });

  req.app.locals.productsCollection = collection;
  return collection;
};

const getInventoryInsightsCollection = async (req) => {
  const chromaClient = req.app.locals.chromaClient;
  const embeddingFunction = req.app.locals.embeddingFunction;

  if (!chromaClient) {
    throw new Error("Chroma client not found");
  }

  if (req.app.locals.inventoryInsightsCollection) {
    return req.app.locals.inventoryInsightsCollection;
  }

  const collection = await chromaClient.getOrCreateCollection({
    name: "inventory_insights",
    embeddingFunction,
  });

  req.app.locals.inventoryInsightsCollection = collection;
  return collection;
};

const parseIsoDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDaysDiff = (from, to) => {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};

const getDateDaysAgo = (days) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
};

const buildDailyBuckets = (days = 30) => {
  const start = getDateDaysAgo(days - 1);
  const buckets = [];

  for (let i = 0; i < days; i += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    buckets.push({
      day: current.toISOString().slice(0, 10),
      units: 0,
      orders: 0,
      revenue: 0,
    });
  }

  return buckets;
};

const indexBuckets = (buckets) => {
  return buckets.reduce((acc, item, idx) => {
    acc[item.day] = idx;
    return acc;
  }, {});
};

const generateInventoryInsightDocument = ({
  product,
  metrics,
  recommendation,
  reasoning,
}) => {
  return `
Inventory Insight for ${product.name}
Product ID: ${product._id}
Brand: ${product.brand || ""}
Category: ${product.category || ""}
Subcategory: ${product.subCategory || ""}
SKU: ${product.sku || ""}
Current Stock: ${product.availabilityCount || 0}
Current Threshold: ${product.minimumThresholdCount || 0}
Current Status: ${product.status || ""}
Units Sold Last 7 Days: ${metrics.unitsLast7Days}
Units Sold Last 14 Days: ${metrics.unitsLast14Days}
Units Sold Last 30 Days: ${metrics.unitsLast30Days}
Average Daily Demand 7 Days: ${metrics.avgDaily7}
Average Daily Demand 14 Days: ${metrics.avgDaily14}
Average Daily Demand 30 Days: ${metrics.avgDaily30}
Predicted Next 7 Days: ${metrics.predictedNext7Days}
Predicted Next 14 Days: ${metrics.predictedNext14Days}
Current Threshold Recommendation: ${recommendation.action}
Recommended Threshold: ${recommendation.recommendedThreshold}
Risk Level: ${recommendation.riskLevel}
Reasoning: ${reasoning}
  `.trim();
};

const getProductFromMongo = async (productId) => {
  return Product.findById(productId);
};

const getProductFromChroma = async (req, productId) => {
  const productsCollection = await getProductsCollection(req);

  const result = await productsCollection.get({
    ids: [String(productId)],
    include: ["documents", "metadatas"],
  });

  if (!result?.ids?.length) return null;

  const metadata = result.metadatas?.[0] || {};
  const document = result.documents?.[0] || "";

  return {
    id: result.ids[0],
    document,
    metadata,
  };
};

const getOrderSignalsFromMongo = async (productId, adminId = null) => {
  const match = {
    "items.productId": new mongoose.Types.ObjectId(productId),
  };

  if (adminId) {
    match["items.productId"] = new mongoose.Types.ObjectId(productId);
  }

  const orders = await Order.find(match)
    .select("items pricing createdAt orderStatus payment")
    .sort({ createdAt: -1 })
    .lean();

  return orders;
};

const normalizeOrdersToLangChainDocuments = (orders, productId) => {
  const productIdStr = String(productId);

  return orders.map((order) => {
    const matchedItems = (order.items || []).filter(
      (item) => String(item.productId) === productIdStr
    );

    return new Document({
      pageContent: [
        `Order ${order._id}`,
        `Created ${order.createdAt ? new Date(order.createdAt).toISOString() : ""}`,
        `Order Status ${order.orderStatus || ""}`,
        `Payment Status ${order.payment?.status || ""}`,
        `Items ${matchedItems
          .map(
            (item) =>
              `${item.name || ""} quantity ${item.quantity || 0} line total ${
                item.lineTotal || 0
              }`
          )
          .join(". ")}`,
      ]
        .join(". ")
        .trim(),
      metadata: {
        orderId: String(order._id),
        createdAt: order.createdAt
          ? new Date(order.createdAt).toISOString()
          : null,
        items: matchedItems.map((item) => ({
          productId: String(item.productId),
          quantity: Number(item.quantity || 0),
          lineTotal: Number(item.lineTotal || 0),
          unitPrice: Number(item.unitPrice || 0),
          name: item.name || "",
          brand: item.brand || "",
          sku: item.sku || "",
        })),
      },
    });
  });
};

const buildDemandMetricsFromOrders = (orderDocuments, productId) => {
  const productIdStr = String(productId);
  const buckets = buildDailyBuckets(30);
  const bucketIndex = indexBuckets(buckets);
  const today = new Date();

  for (const orderDoc of orderDocuments) {
    const meta = orderDoc.metadata || {};
    const createdAt = parseIsoDate(meta.createdAt);
    if (!createdAt) continue;

    const dayKey = createdAt.toISOString().slice(0, 10);
    if (bucketIndex[dayKey] === undefined) continue;

    const items = Array.isArray(meta.items) ? meta.items : [];

    let matchedQuantity = 0;
    let matchedRevenue = 0;

    for (const item of items) {
      if (String(item.productId) === productIdStr) {
        matchedQuantity += Number(item.quantity || 0);
        matchedRevenue += Number(item.lineTotal || 0);
      }
    }

    if (matchedQuantity <= 0) continue;

    const idx = bucketIndex[dayKey];
    buckets[idx].units += matchedQuantity;
    buckets[idx].orders += 1;
    buckets[idx].revenue += matchedRevenue;
  }

  const sumUnits = (arr) =>
    arr.reduce((sum, item) => sum + Number(item.units || 0), 0);
  const sumRevenue = (arr) =>
    arr.reduce((sum, item) => sum + Number(item.revenue || 0), 0);

  const last7 = buckets.slice(-7);
  const last14 = buckets.slice(-14);
  const last30 = buckets.slice(-30);

  const unitsLast7Days = sumUnits(last7);
  const unitsLast14Days = sumUnits(last14);
  const unitsLast30Days = sumUnits(last30);

  const revenueLast30Days = round2(sumRevenue(last30));

  const avgDaily7 = round2(unitsLast7Days / 7);
  const avgDaily14 = round2(unitsLast14Days / 14);
  const avgDaily30 = round2(unitsLast30Days / 30);

  const weightedDailyDemand = round2(
    avgDaily7 * 0.5 + avgDaily14 * 0.3 + avgDaily30 * 0.2
  );

  const predictedNext7Days = roundInt(weightedDailyDemand * 7);
  const predictedNext14Days = roundInt(weightedDailyDemand * 14);
  const activeDaysLast30Days = last30.filter(
    (item) => Number(item.units || 0) > 0
  ).length;

  const lastOrderMeta = [...orderDocuments]
    .map((item) => item.metadata || {})
    .filter((meta) => meta.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  const lastOrderDate = lastOrderMeta?.createdAt
    ? new Date(lastOrderMeta.createdAt)
    : null;
  const daysSinceLastOrder = lastOrderDate
    ? getDaysDiff(lastOrderDate, today)
    : null;

  return {
    recentDailyDemand: buckets,
    unitsLast7Days,
    unitsLast14Days,
    unitsLast30Days,
    revenueLast30Days,
    avgDaily7,
    avgDaily14,
    avgDaily30,
    weightedDailyDemand,
    predictedNext7Days,
    predictedNext14Days,
    activeDaysLast30Days,
    daysSinceLastOrder,
    totalOrdersMatched: orderDocuments.length,
  };
};

const buildThresholdRecommendation = (product, metrics) => {
  const currentStock = Number(product.availabilityCount || 0);
  const currentThreshold = Number(product.minimumThresholdCount || 0);

  const baseThreshold = Math.max(
    2,
    roundInt(metrics.avgDaily7 * 3),
    roundInt(metrics.avgDaily30 * 5)
  );

  const demandBuffer = roundInt(metrics.predictedNext7Days * 0.35);
  const recommendedThreshold = Math.max(2, baseThreshold + demandBuffer);

  let action = "keep";
  if (recommendedThreshold > currentThreshold + 2) action = "increase";
  if (recommendedThreshold < currentThreshold - 2) action = "decrease";

  let riskLevel = "low";
  if (
    currentStock <= currentThreshold ||
    currentStock <= metrics.predictedNext7Days
  ) {
    riskLevel = "high";
  } else if (
    currentStock <= currentThreshold * 1.5 ||
    currentStock <= metrics.predictedNext14Days
  ) {
    riskLevel = "medium";
  }

  return {
    action,
    currentThreshold,
    recommendedThreshold,
    suggestedChange: recommendedThreshold - currentThreshold,
    currentStock,
    riskLevel,
    predictedNext7Days: metrics.predictedNext7Days,
    predictedNext14Days: metrics.predictedNext14Days,
  };
};

const buildFallbackReasoning = (product, metrics, recommendation) => {
  return [
    `${product.name} sold ${metrics.unitsLast7Days} units in the last 7 days and ${metrics.unitsLast30Days} units in the last 30 days.`,
    `The short-term weighted daily demand is ${metrics.weightedDailyDemand}, with expected demand of ${metrics.predictedNext7Days} units in the next 7 days.`,
    `Current stock is ${product.availabilityCount} and current threshold is ${product.minimumThresholdCount}.`,
    `The recommended threshold is ${recommendation.recommendedThreshold}, so the threshold should ${
      recommendation.action === "keep"
        ? "be kept as is"
        : `be ${recommendation.action}d`
    }.`,
    `Risk level is ${recommendation.riskLevel}.`,
  ].join(" ");
};

const generateGroqReasoning = async (product, metrics, recommendation) => {
  if (!groq) {
    return buildFallbackReasoning(product, metrics, recommendation);
  }

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an inventory demand planning assistant. Explain the recommendation in simple business language under 120 words. Focus on demand trend, stock risk, and whether threshold should increase, decrease, or stay the same.",
        },
        {
          role: "user",
          content: JSON.stringify({
            product: {
              id: String(product._id),
              name: product.name,
              brand: product.brand || "",
              category: product.category || "",
              sku: product.sku || "",
              availabilityCount: Number(product.availabilityCount || 0),
              minimumThresholdCount: Number(product.minimumThresholdCount || 0),
              status: product.status || "",
            },
            metrics,
            recommendation,
          }),
        },
      ],
    });

    return (
      completion?.choices?.[0]?.message?.content?.trim() ||
      buildFallbackReasoning(product, metrics, recommendation)
    );
  } catch (error) {
    console.error("Groq inventory reasoning error:", error);
    return buildFallbackReasoning(product, metrics, recommendation);
  }
};

const syncInsightToChroma = async (
  req,
  product,
  metrics,
  recommendation,
  reasoning
) => {
  const collection = await getInventoryInsightsCollection(req);

  await collection.upsert({
    ids: [`inventory-${product._id.toString()}`],
    documents: [
      generateInventoryInsightDocument({
        product,
        metrics,
        recommendation,
        reasoning,
      }),
    ],
    metadatas: [
      {
        insightType: "inventory_prediction",
        productId: String(product._id),
        adminId: String(product.adminId),
        name: product.name,
        brand: product.brand || "",
        category: product.category || "",
        subCategory: product.subCategory || "",
        sku: product.sku || "",
        currentStock: Number(product.availabilityCount || 0),
        currentThreshold: Number(product.minimumThresholdCount || 0),
        recommendedThreshold: Number(recommendation.recommendedThreshold || 0),
        thresholdAction: recommendation.action,
        riskLevel: recommendation.riskLevel,
        predictedNext7Days: Number(metrics.predictedNext7Days || 0),
        predictedNext14Days: Number(metrics.predictedNext14Days || 0),
        unitsLast7Days: Number(metrics.unitsLast7Days || 0),
        unitsLast30Days: Number(metrics.unitsLast30Days || 0),
        avgDaily7: Number(metrics.avgDaily7 || 0),
        avgDaily30: Number(metrics.avgDaily30 || 0),
        totalOrdersMatched: Number(metrics.totalOrdersMatched || 0),
        status: product.status || "",
        updatedAt: new Date().toISOString(),
      },
    ],
  });
};

const buildInventoryInsight = async (req, productId) => {
  const product = await getProductFromMongo(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  const chromaProduct = await getProductFromChroma(req, productId);
  const mongoOrders = await getOrderSignalsFromMongo(productId);
  const orderDocuments = normalizeOrdersToLangChainDocuments(
    mongoOrders,
    productId
  );
  const metrics = buildDemandMetricsFromOrders(orderDocuments, productId);
  const recommendation = buildThresholdRecommendation(product, metrics);
  const reasoning = await generateGroqReasoning(product, metrics, recommendation);

  await syncInsightToChroma(req, product, metrics, recommendation, reasoning);

  return {
    product: {
      _id: product._id,
      adminId: product.adminId,
      name: product.name,
      brand: product.brand || "",
      category: product.category || "",
      subCategory: product.subCategory || "",
      sku: product.sku || "",
      availabilityCount: Number(product.availabilityCount || 0),
      minimumThresholdCount: Number(product.minimumThresholdCount || 0),
      orderCount: Number(product.orderCount || 0),
      status: product.status || "",
      chromaMetadata: chromaProduct?.metadata || {},
    },
    metrics,
    recommendation,
    reasoning,
  };
};

router.get("/inventory-agent/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const insight = await buildInventoryInsight(req, productId);

    return res.json({
      success: true,
      insight,
    });
  } catch (error) {
    console.error("Inventory agent error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate inventory insight.",
    });
  }
});

router.get("/admin/inventory-agent/:adminId", async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: "Invalid admin id" });
    }

    const products = await Product.find({ adminId, isActive: true }).sort({
      createdAt: -1,
    });

    const insights = await Promise.all(
      products.map((product) => buildInventoryInsight(req, product._id))
    );

    const riskPriority = { high: 3, medium: 2, low: 1 };

    insights.sort((a, b) => {
      return (
        (riskPriority[b.recommendation.riskLevel] || 0) -
          (riskPriority[a.recommendation.riskLevel] || 0) ||
        b.recommendation.predictedNext7Days - a.recommendation.predictedNext7Days
      );
    });

    return res.json({
      success: true,
      totalProducts: insights.length,
      insights,
    });
  } catch (error) {
    console.error("Admin inventory agent error:", error);
    return res.status(500).json({
      error: "Failed to generate admin inventory insights.",
    });
  }
});

router.post("/admin/inventory-agent/:productId/apply-threshold", async (req, res) => {
  try {
    const { productId } = req.params;
    const { adminId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: "Invalid admin id" });
    }

    const product = await Product.findOne({ _id: productId, adminId });

    if (!product) {
      return res.status(404).json({ error: "Product not found for this admin." });
    }

    const insight = await buildInventoryInsight(req, productId);

    product.minimumThresholdCount = Number(
      insight.recommendation.recommendedThreshold || product.minimumThresholdCount
    );

    if (Number(product.availabilityCount || 0) === 0) {
      product.status = "out_of_stock";
    } else if (product.status === "out_of_stock") {
      product.status = "published";
    }

    const updatedProduct = await product.save();

    try {
      const productsCollection = await getProductsCollection(req);

      await productsCollection.upsert({
        ids: [String(updatedProduct._id)],
        documents: [
          `
Product Name: ${updatedProduct.name}
Description: ${updatedProduct.description}
Short Description: ${updatedProduct.shortDescription || ""}
Brand: ${updatedProduct.brand || ""}
Category: ${updatedProduct.category || ""}
Subcategory: ${updatedProduct.subCategory || ""}
Tags: ${Array.isArray(updatedProduct.tags) ? updatedProduct.tags.join(", ") : ""}
Price: ${updatedProduct.price}
Discount Price: ${updatedProduct.discountPrice || 0}
Currency: ${updatedProduct.currency || "INR"}
SKU: ${updatedProduct.sku || ""}
Status: ${updatedProduct.status}
Availability Count: ${updatedProduct.availabilityCount}
Minimum Threshold Count: ${updatedProduct.minimumThresholdCount}
Order Count: ${updatedProduct.orderCount || 0}
          `.trim(),
        ],
        metadatas: [
          {
            productId: String(updatedProduct._id),
            adminId: String(updatedProduct.adminId),
            name: updatedProduct.name,
            category: updatedProduct.category || "",
            subCategory: updatedProduct.subCategory || "",
            brand: updatedProduct.brand || "",
            price: Number(updatedProduct.price || 0),
            discountPrice: Number(updatedProduct.discountPrice || 0),
            availabilityCount: Number(updatedProduct.availabilityCount || 0),
            minimumThresholdCount: Number(updatedProduct.minimumThresholdCount || 0),
            orderCount: Number(updatedProduct.orderCount || 0),
            imageUrl: updatedProduct.imageUrl || "",
            status: updatedProduct.status || "",
            isFeatured: Boolean(updatedProduct.isFeatured),
            sku: updatedProduct.sku || "",
            currency: updatedProduct.currency || "INR",
            tags: Array.isArray(updatedProduct.tags)
              ? updatedProduct.tags.join(", ")
              : "",
          },
        ],
      });
    } catch (chromaError) {
      console.error("Chroma product sync error:", chromaError);
    }

    return res.json({
      success: true,
      message: "Recommended threshold applied successfully.",
      product: updatedProduct,
      recommendation: insight.recommendation,
      reasoning: insight.reasoning,
    });
  } catch (error) {
    console.error("Apply threshold error:", error);
    return res.status(500).json({
      error: "Failed to apply recommended threshold.",
    });
  }
});

router.get("/inventory-agent/search/:adminId", async (req, res) => {
  try {
    const { adminId } = req.params;
    const { q } = req.query;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: "Invalid admin id" });
    }

    if (!q || !String(q).trim()) {
      return res.status(400).json({ error: "Query is required" });
    }

    const collection = await getInventoryInsightsCollection(req);

    const result = await collection.query({
      queryTexts: [String(q)],
      nResults: 10,
      where: {
        adminId: String(adminId),
      },
    });

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Inventory insight search error:", error);
    return res.status(500).json({
      error: "Failed to search inventory insights.",
    });
  }
});

module.exports = router;