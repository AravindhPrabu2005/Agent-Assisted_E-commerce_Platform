const express = require("express");
const router = express.Router();
const {
  getHomeRecommendations,
  debugHomeRecommendations,
} = require("../services/recommendationService");

router.get("/recommendations/home/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await getHomeRecommendations(userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Home recommendation error:", error);
    return res.status(500).json({
      message: "Failed to load recommendations.",
      error: error.message,
    });
  }
});

router.get("/recommendations/debug/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await debugHomeRecommendations(userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Recommendation debug error:", error);
    return res.status(500).json({
      message: "Failed to debug recommendations.",
      error: error.message,
    });
  }
});

router.get("/recommendations/debug/chroma/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const chromaClient = req.app.locals.chromaClient;
    const embeddingFunction = req.app.locals.embeddingFunction;

    const ordersCollection =
      req.app.locals.ordersCollection ||
      (await chromaClient.getOrCreateCollection({
        name: "orders",
        embeddingFunction,
      }));

    const productsCollection =
      req.app.locals.productsCollection ||
      (await chromaClient.getOrCreateCollection({
        name: "products",
        embeddingFunction,
      }));

    req.app.locals.ordersCollection = ordersCollection;
    req.app.locals.productsCollection = productsCollection;

    const allOrders = await ordersCollection.get({
      include: ["documents", "metadatas"],
    });

    const userOrders = await ordersCollection.get({
      where: { userId: String(userId) },
      include: ["documents", "metadatas"],
    });

    const allProducts = await productsCollection.get({
      include: ["documents", "metadatas"],
    });

    return res.status(200).json({
      userId: String(userId),
      orderCollectionCount: Array.isArray(allOrders?.ids) ? allOrders.ids.length : 0,
      userOrderCount: Array.isArray(userOrders?.ids) ? userOrders.ids.length : 0,
      productCollectionCount: Array.isArray(allProducts?.ids) ? allProducts.ids.length : 0,
      userOrders: (userOrders?.ids || []).map((id, index) => ({
        id,
        document: userOrders.documents?.[index] || "",
        metadata: userOrders.metadatas?.[index] || {},
      })),
      sampleProducts: (allProducts?.ids || []).slice(0, 20).map((id, index) => ({
        id,
        document: allProducts.documents?.[index] || "",
        metadata: allProducts.metadatas?.[index] || {},
      })),
    });
  } catch (error) {
    console.error("Chroma debug error:", error);
    return res.status(500).json({
      message: "Failed to inspect Chroma collections.",
      error: error.message,
    });
  }
});

module.exports = router;