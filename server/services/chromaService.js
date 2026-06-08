const { ChromaClient } = require("chromadb");
const Product = require("../models/Product");

const chromaClient = new ChromaClient({
  host: process.env.CHROMA_HOST || "localhost",
  port: Number(process.env.CHROMA_PORT) || 8000,
  ssl: String(process.env.CHROMA_SSL || "false").toLowerCase() === "true",
});

const getProductCollection = async () => {
  const collectionName = process.env.CHROMA_COLLECTION_NAME || "products";

  const collection = await chromaClient.getOrCreateCollection({
    name: collectionName,
  });

  return collection;
};

const buildProductChromaDocument = (product) => {
  return [
    `Product Name: ${product.name || ""}`,
    `Brand: ${product.brand || ""}`,
    `Category: ${product.category || ""}`,
    `SubCategory: ${product.subCategory || ""}`,
    `Description: ${product.description || ""}`,
    `Short Description: ${product.shortDescription || ""}`,
    `Price: ${product.price ?? ""}`,
    `Discount Price: ${product.discountPrice ?? ""}`,
    `Currency: ${product.currency || "INR"}`,
    `SKU: ${product.sku || ""}`,
    `Availability Count: ${product.availabilityCount ?? ""}`,
    `Minimum Threshold Count: ${product.minimumThresholdCount ?? ""}`,
    `Order Count: ${product.orderCount ?? ""}`,
    `Rating Average: ${product.ratingAverage ?? product.averageRating ?? 0}`,
    `Rating Count: ${product.ratingCount ?? product.reviewCount ?? 0}`,
    `Tags: ${Array.isArray(product.tags) ? product.tags.join(", ") : ""}`,
    `Status: ${product.status || ""}`,
    `Is Active: ${product.isActive ? "true" : "false"}`,
    `Is Featured: ${product.isFeatured ? "true" : "false"}`,
  ]
    .filter(Boolean)
    .join("\n");
};

const buildProductChromaMetadata = (product) => {
  return {
    productId: String(product._id),
    name: product.name || "",
    slug: product.slug || "",
    brand: product.brand || "",
    category: product.category || "",
    subCategory: product.subCategory || "",
    imageUrl: product.imageUrl || "",
    currency: product.currency || "INR",
    sku: product.sku || "",
    status: product.status || "",
    shortDescription: product.shortDescription || "",
    price: Number(product.price ?? 0),
    discountPrice: Number(product.discountPrice ?? 0),
    availabilityCount: Number(product.availabilityCount ?? 0),
    minimumThresholdCount: Number(product.minimumThresholdCount ?? 0),
    orderCount: Number(product.orderCount ?? 0),
    ratingAverage: Number(product.ratingAverage ?? product.averageRating ?? 0),
    ratingCount: Number(product.ratingCount ?? product.reviewCount ?? 0),
    isActive: Boolean(product.isActive),
    isFeatured: Boolean(product.isFeatured),
    tags: Array.isArray(product.tags) ? product.tags : [],
  };
};

const upsertProductToChroma = async (productOrId) => {
  let product = productOrId;

  if (!productOrId) {
    throw new Error("Product is required for Chroma upsert.");
  }

  if (typeof productOrId === "string") {
    product = await Product.findById(productOrId).lean();
  } else if (typeof productOrId?.toObject === "function") {
    product = productOrId.toObject();
  }

  if (!product || !product._id) {
    throw new Error("Valid product not found for Chroma upsert.");
  }

  const collection = await getProductCollection();

  const id = String(product._id);
  const document = buildProductChromaDocument(product);
  const metadata = buildProductChromaMetadata(product);

  await collection.upsert({
    ids: [id],
    documents: [document],
    metadatas: [metadata],
  });

  return { id, document, metadata };
};

const deleteProductFromChroma = async (productId) => {
  if (!productId) {
    throw new Error("productId is required to delete from Chroma.");
  }

  const collection = await getProductCollection();

  await collection.delete({
    ids: [String(productId)],
  });

  return { deletedId: String(productId) };
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

  return documents.map((doc, index) => ({
    id: ids[index],
    document: doc,
    metadata: metadatas[index] || {},
    distance: distances[index],
  }));
};

module.exports = {
  getProductCollection,
  searchProductsFromChroma,
  buildProductChromaDocument,
  buildProductChromaMetadata,
  upsertProductToChroma,
  deleteProductFromChroma,
};