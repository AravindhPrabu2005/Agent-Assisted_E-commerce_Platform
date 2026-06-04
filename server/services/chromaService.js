const { ChromaClient } = require("chromadb");

const chromaClient = new ChromaClient({
  path: process.env.CHROMA_URL,
});

const getProductCollection = async () => {
  const collectionName = process.env.CHROMA_COLLECTION_NAME || "products";
  const collection = await chromaClient.getOrCreateCollection({
    name: collectionName,
  });
  return collection;
};

const searchProductsFromChroma = async (query, nResults = 6) => {
  const collection = await getProductCollection();

  const results = await collection.query({
    queryTexts: [query],
    nResults,
  });

  const documents = results?.documents?.[0] || [];
  const metadatas = results?.metadatas?.[0] || [];
  const distances = results?.distances?.[0] || [];
  const ids = results?.ids?.[0] || [];

  const matches = documents.map((doc, index) => ({
    id: ids[index],
    document: doc,
    metadata: metadatas[index] || {},
    distance: distances[index],
  }));

  return matches;
};

module.exports = {
  searchProductsFromChroma,
};