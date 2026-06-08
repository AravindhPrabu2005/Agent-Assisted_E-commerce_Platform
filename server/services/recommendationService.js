const { ChromaClient } = require("chromadb");
const { ChatGroq } = require("@langchain/groq");
const { StateGraph, END } = require("@langchain/langgraph");

const chromaClient = new ChromaClient({
  host: process.env.CHROMA_HOST || "localhost",
  port: Number(process.env.CHROMA_PORT) || 8000,
  ssl: false,
});

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  temperature: 0.2,
});

const recommendationState = {
  userId: "",
  recentOrders: [],
  orderSummary: null,
  candidateIntents: [],
  recommendedProducts: [],
  debug: {
    orderAgentRaw: "",
    catalogAgentRaw: "",
    searchMatches: [],
  },
};

const safeJsonParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    const objectMatch = String(value).match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {}
    }
    const arrayMatch = String(value).match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {}
    }
    return null;
  }
};

const normalizeProduct = (product) => ({
  _id: product.productId || product.id || product._id || "",
  productId: product.productId || product.id || product._id || "",
  name: product.name || "",
  brand: product.brand || "",
  category: product.category || "",
  subCategory: product.subCategory || "",
  imageUrl: product.imageUrl || "",
  price: Number(product.price || 0),
  discountPrice: Number(product.discountPrice || 0),
  shortDescription: product.shortDescription || product.document || "",
  ratingAverage: Number(product.ratingAverage || 0),
  ratingCount: Number(product.ratingCount || 0),
  availabilityCount: Number(product.availabilityCount || 0),
  isFeatured: Boolean(product.isFeatured),
  isActive: product.isActive !== false,
  matchedIntent: product.matchedIntent || "",
  recommendationReason: product.recommendationReason || "",
});

const getOrdersCollection = async () => {
  return chromaClient.getOrCreateCollection({ name: "orders" });
};

const getProductsCollection = async () => {
  return chromaClient.getOrCreateCollection({ name: "products" });
};

const fetchRecentOrdersNode = async (state) => {
  const ordersCollection = await getOrdersCollection();

  const result = await ordersCollection.get({
    where: { userId: String(state.userId) },
    include: ["documents", "metadatas"],
  });

  const orders = (result?.ids || []).map((id, index) => ({
    id,
    document: result.documents?.[index] || "",
    metadata: result.metadatas?.[index] || {},
  }));

  orders.sort((a, b) => {
    const da = new Date(a.metadata?.createdAt || 0).getTime();
    const db = new Date(b.metadata?.createdAt || 0).getTime();
    return db - da;
  });

  return {
    ...state,
    recentOrders: orders.slice(0, 2),
  };
};

const orderInsightAgentNode = async (state) => {
  if (!state.recentOrders.length) {
    return {
      ...state,
      orderSummary: {
        purchased_products: [],
        purchase_context: "No recent orders found",
        recommendation_focus: "general discovery",
      },
      candidateIntents: [],
      debug: {
        ...state.debug,
        orderAgentRaw: "",
      },
    };
  }

  const orderText = state.recentOrders
    .map((order, index) => `Order ${index + 1}: ${order.document}`)
    .join("\n\n");

  const prompt = `
You are Agent 1: Order Insight Agent for an ecommerce recommendation system.

Your job:
1. Read the user's latest orders.
2. Understand what they actually bought.
3. Infer realistic complementary product needs.
4. Do NOT recommend unrelated items.
5. Do NOT repeat the exact purchased products.
6. Focus on high-probability cross-sell accessories and companion items.

Return strict JSON only in this exact shape:
{
  "purchased_products": ["..."],
  "purchase_context": "short explanation",
  "recommendation_focus": "short explanation",
  "candidate_intents": ["intent 1", "intent 2", "intent 3", "intent 4", "intent 5", "intent 6"]
}

Rules:
- Intents must be short ecommerce search phrases.
- Prefer accessories, add-ons, and adjacent utility products.
- If the user bought a laptop, think mouse, keyboard, sleeve, stand, hub, backpack, cooling pad, monitor, webcam.
- If the user bought a phone, think case, screen protector, charger, cable, earbuds, power bank.
- If multiple recent orders exist, combine both contexts intelligently.
- Never output markdown.
- Never output anything except JSON.

User recent orders:
${orderText}
`;

  const response = await llm.invoke(prompt);
  const raw =
    typeof response.content === "string"
      ? response.content
      : Array.isArray(response.content)
      ? response.content.map((part) => part?.text || "").join("")
      : "";

  const parsed = safeJsonParse(raw);

  if (
    !parsed ||
    !Array.isArray(parsed.candidate_intents) ||
    !parsed.candidate_intents.length
  ) {
    throw new Error("Order Insight Agent failed to produce valid recommendation intents.");
  }

  return {
    ...state,
    orderSummary: {
      purchased_products: Array.isArray(parsed.purchased_products)
        ? parsed.purchased_products
        : [],
      purchase_context: parsed.purchase_context || "",
      recommendation_focus: parsed.recommendation_focus || "",
    },
    candidateIntents: parsed.candidate_intents
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 6),
    debug: {
      ...state.debug,
      orderAgentRaw: raw,
    },
  };
};

const catalogSearchNode = async (state) => {
  const productsCollection = await getProductsCollection();
  const allMatches = [];
  const pooledCandidates = [];
  const seen = new Set();

  for (const intent of state.candidateIntents || []) {
    const result = await productsCollection.query({
      queryTexts: [intent],
      nResults: 8,
    });

    const ids = result?.ids?.[0] || [];
    const documents = result?.documents?.[0] || [];
    const metadatas = result?.metadatas?.[0] || [];

    const intentMatches = [];

    for (let i = 0; i < ids.length; i++) {
      const meta = metadatas[i] || {};
      const doc = documents[i] || "";
      const productId = String(meta.productId || ids[i]);
      const name = String(meta.name || "");

      intentMatches.push({
        id: ids[i],
        productId,
        name,
        brand: meta.brand || "",
        category: meta.category || "",
        subCategory: meta.subCategory || "",
        availabilityCount: Number(meta.availabilityCount || 0),
        isActive: meta.isActive !== false,
      });

      if (seen.has(productId)) continue;
      seen.add(productId);

      pooledCandidates.push({
        id: ids[i],
        productId,
        name,
        brand: meta.brand || "",
        category: meta.category || "",
        subCategory: meta.subCategory || "",
        imageUrl: meta.imageUrl || "",
        price: Number(meta.price || 0),
        discountPrice: Number(meta.discountPrice || 0),
        shortDescription: meta.shortDescription || doc,
        ratingAverage: Number(meta.ratingAverage || 0),
        ratingCount: Number(meta.ratingCount || 0),
        availabilityCount: Number(meta.availabilityCount || 0),
        isFeatured: Boolean(meta.isFeatured),
        isActive: meta.isActive !== false,
        matchedIntent: intent,
        document: doc,
      });
    }

    allMatches.push({
      intent,
      matches: intentMatches,
    });
  }

  return {
    ...state,
    recommendedProducts: pooledCandidates,
    debug: {
      ...state.debug,
      searchMatches: allMatches,
    },
  };
};

const catalogRecommendationAgentNode = async (state) => {
  const recentOrderText = (state.recentOrders || [])
    .map((order) => String(order.document || "").toLowerCase())
    .join(" ");

  const candidateProducts = (state.recommendedProducts || []).filter(
    (item) =>
      item.isActive !== false &&
      Number(item.availabilityCount || 0) > 0 &&
      item.name &&
      !recentOrderText.includes(String(item.name || "").toLowerCase())
  );

  if (!candidateProducts.length) {
    return {
      ...state,
      recommendedProducts: [],
      debug: {
        ...state.debug,
        catalogAgentRaw: "",
      },
    };
  }

  const compactProducts = candidateProducts.map((item) => ({
    productId: item.productId,
    name: item.name,
    brand: item.brand,
    category: item.category,
    subCategory: item.subCategory,
    price: item.price,
    discountPrice: item.discountPrice,
    availabilityCount: item.availabilityCount,
    matchedIntent: item.matchedIntent,
    shortDescription: item.shortDescription,
  }));

  const prompt = `
You are Agent 2: Catalog Recommendation Agent for an ecommerce homepage.

You receive:
1. A summary of what the user recently bought.
2. Candidate recommendation intents generated by Agent 1.
3. Candidate catalog products retrieved from a vector database.

Your job:
- Select the best 4 to 8 products from the provided catalog candidates.
- Pick only products that are strongly relevant to the recent purchases.
- Avoid unrelated items.
- Avoid repeating the exact purchased item.
- Prefer practical, complementary, high-likelihood cross-sell products.

Return strict JSON only in this exact shape:
{
  "title": "Recommended for your setup",
  "selected_product_ids": ["id1", "id2", "id3", "id4"],
  "reasons": [
    { "productId": "id1", "reason": "short reason" },
    { "productId": "id2", "reason": "short reason" }
  ]
}

Rules:
- Use only product ids from the given catalog candidates.
- Do not invent ids.
- Choose at least 4 if enough valid options exist.
- Choose at most 8.
- Title should be concise and user-friendly.
- Never output markdown.
- Never output anything except JSON.

Recent order understanding:
${JSON.stringify(state.orderSummary || {}, null, 2)}

Candidate intents:
${JSON.stringify(state.candidateIntents || [], null, 2)}

Catalog candidates:
${JSON.stringify(compactProducts, null, 2)}
`;

  const response = await llm.invoke(prompt);
  const raw =
    typeof response.content === "string"
      ? response.content
      : Array.isArray(response.content)
      ? response.content.map((part) => part?.text || "").join("")
      : "";

  const parsed = safeJsonParse(raw);

  if (
    !parsed ||
    !Array.isArray(parsed.selected_product_ids) ||
    !parsed.selected_product_ids.length
  ) {
    throw new Error("Catalog Recommendation Agent failed to select products.");
  }

  const reasonMap = new Map(
    Array.isArray(parsed.reasons)
      ? parsed.reasons.map((item) => [String(item.productId), item.reason || "Recommended for you"])
      : []
  );

  const selected = parsed.selected_product_ids
    .map((id) => String(id))
    .map((id) => candidateProducts.find((item) => String(item.productId) === id))
    .filter(Boolean)
    .map((item) =>
      normalizeProduct({
        ...item,
        recommendationReason: reasonMap.get(String(item.productId)) || "Recommended for you",
      })
    )
    .slice(0, 8);

  return {
    ...state,
    finalTitle: parsed.title || "Recommended for you",
    recommendedProducts: selected,
    debug: {
      ...state.debug,
      catalogAgentRaw: raw,
    },
  };
};

const fallbackPopularNode = async (state) => {
  const productsCollection = await getProductsCollection();

  const result = await productsCollection.get({
    include: ["documents", "metadatas"],
  });

  const products = (result?.ids || [])
    .map((id, index) => {
      const meta = result.metadatas?.[index] || {};
      const doc = result.documents?.[index] || "";

      return normalizeProduct({
        id,
        productId: meta.productId || id,
        name: meta.name || "",
        brand: meta.brand || "",
        category: meta.category || "",
        subCategory: meta.subCategory || "",
        imageUrl: meta.imageUrl || "",
        price: meta.price || 0,
        discountPrice: meta.discountPrice || 0,
        shortDescription: meta.shortDescription || doc,
        ratingAverage: meta.ratingAverage || 0,
        ratingCount: meta.ratingCount || 0,
        availabilityCount: meta.availabilityCount || 0,
        isFeatured: meta.isFeatured || false,
        isActive: meta.isActive !== false,
        recommendationReason: "Popular product from the catalog",
      });
    })
    .filter((item) => item.isActive && item.availabilityCount > 0)
    .sort((a, b) => {
      const aScore = (a.isFeatured ? 10 : 0) + a.ratingAverage + a.ratingCount * 0.01;
      const bScore = (b.isFeatured ? 10 : 0) + b.ratingAverage + b.ratingCount * 0.01;
      return bScore - aScore;
    })
    .slice(0, 8);

  return {
    ...state,
    finalTitle: "Popular products",
    recommendedProducts: products,
  };
};

const shouldUseFallback = (state) => {
  if (!state.recentOrders.length) return "fallbackPopular";
  return "orderInsightAgent";
};

const shouldFinalize = (state) => {
  if (!state.recommendedProducts || !state.recommendedProducts.length) {
    return "fallbackPopular";
  }
  return "catalogRecommendationAgent";
};

const graph = new StateGraph({
  channels: {
    userId: null,
    recentOrders: null,
    orderSummary: null,
    candidateIntents: null,
    recommendedProducts: null,
    finalTitle: null,
    debug: null,
  },
});

graph.addNode("fetchRecentOrders", fetchRecentOrdersNode);
graph.addNode("orderInsightAgent", orderInsightAgentNode);
graph.addNode("catalogSearch", catalogSearchNode);
graph.addNode("catalogRecommendationAgent", catalogRecommendationAgentNode);
graph.addNode("fallbackPopular", fallbackPopularNode);

graph.setEntryPoint("fetchRecentOrders");
graph.addConditionalEdges("fetchRecentOrders", shouldUseFallback, {
  orderInsightAgent: "orderInsightAgent",
  fallbackPopular: "fallbackPopular",
});
graph.addEdge("orderInsightAgent", "catalogSearch");
graph.addConditionalEdges("catalogSearch", shouldFinalize, {
  catalogRecommendationAgent: "catalogRecommendationAgent",
  fallbackPopular: "fallbackPopular",
});
graph.addEdge("catalogRecommendationAgent", END);
graph.addEdge("fallbackPopular", END);

const recommendationApp = graph.compile();

const runRecommendationGraph = async (userId) => {
  return recommendationApp.invoke({
    userId: String(userId),
    recentOrders: [],
    orderSummary: null,
    candidateIntents: [],
    recommendedProducts: [],
    finalTitle: "Recommended for you",
    debug: {
      orderAgentRaw: "",
      catalogAgentRaw: "",
      searchMatches: [],
    },
  });
};

const getHomeRecommendations = async (userId) => {
  const result = await runRecommendationGraph(userId);

  return {
    title: result.finalTitle || "Recommended for you",
    products: Array.isArray(result.recommendedProducts) ? result.recommendedProducts : [],
  };
};

const debugHomeRecommendations = async (userId) => {
  const result = await runRecommendationGraph(userId);

  return {
    userId: String(userId),
    recentOrders: result.recentOrders || [],
    orderSummary: result.orderSummary || null,
    candidateIntents: result.candidateIntents || [],
    recommendedProducts: result.recommendedProducts || [],
    finalTitle: result.finalTitle || "Recommended for you",
    debug: result.debug || {},
  };
};

module.exports = {
  getHomeRecommendations,
  debugHomeRecommendations,
};