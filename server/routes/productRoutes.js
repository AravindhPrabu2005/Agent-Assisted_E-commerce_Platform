const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();

const generateProductDocument = (product) => {
  return `
Product Name: ${product.name}
Description: ${product.description}
Short Description: ${product.shortDescription || ""}
Brand: ${product.brand || ""}
Category: ${product.category}
Subcategory: ${product.subCategory || ""}
Tags: ${Array.isArray(product.tags) ? product.tags.join(", ") : ""}
Price: ${product.price}
Discount Price: ${product.discountPrice || 0}
Currency: ${product.currency || "INR"}
SKU: ${product.sku || ""}
Status: ${product.status}
Availability Count: ${product.availabilityCount}
Minimum Threshold Count: ${product.minimumThresholdCount}
Order Count: ${product.orderCount || 0}
`.trim();
};

const normalizeTags = (tags) => {
  return Array.isArray(tags)
    ? tags
    : typeof tags === "string" && tags.length
    ? tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
};

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
};

const syncProductToChroma = async (req, product, normalizedTags) => {
  const chromaClient = req.app.locals.chromaClient;

  if (!chromaClient) {
    throw new Error("Chroma client not found in app.locals");
  }

  const productCollection = await chromaClient.getOrCreateCollection({
    name: "products",
  });

  await productCollection.upsert({
    ids: [product._id.toString()],
    documents: [generateProductDocument(product)],
    metadatas: [
      {
        productId: product._id.toString(),
        adminId: product.adminId.toString(),
        name: product.name,
        category: product.category || "",
        subCategory: product.subCategory || "",
        brand: product.brand || "",
        price: Number(product.price || 0),
        discountPrice: Number(product.discountPrice || 0),
        availabilityCount: Number(product.availabilityCount || 0),
        minimumThresholdCount: Number(product.minimumThresholdCount || 0),
        orderCount: Number(product.orderCount || 0),
        imageUrl: product.imageUrl || "",
        status: product.status || "",
        isFeatured: Boolean(product.isFeatured),
        sku: product.sku || "",
        currency: product.currency || "INR",
        tags: normalizedTags.join(", "),
      },
    ],
  });
};

const deleteProductFromChroma = async (req, productId) => {
  const chromaClient = req.app.locals.chromaClient;

  if (!chromaClient) {
    throw new Error("Chroma client not found in app.locals");
  }

  const productCollection = await chromaClient.getOrCreateCollection({
    name: "products",
  });

  await productCollection.delete({
    ids: [productId.toString()],
  });
};

router.post("/products", async (req, res) => {
  try {
    const {
      adminId,
      name,
      description,
      shortDescription,
      brand,
      category,
      subCategory,
      imageUrl,
      price,
      discountPrice,
      currency,
      sku,
      availabilityCount,
      minimumThresholdCount,
      tags,
      isFeatured,
      status,
    } = req.body;

    if (
      !adminId ||
      !name ||
      !description ||
      !category ||
      !imageUrl ||
      price === undefined ||
      availabilityCount === undefined ||
      minimumThresholdCount === undefined
    ) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    const normalizedTags = normalizeTags(tags);

    const newProduct = new Product({
      adminId,
      name,
      slug: generateSlug(name),
      description,
      shortDescription,
      brand,
      category,
      subCategory,
      imageUrl,
      price: Number(price),
      discountPrice: Number(discountPrice || 0),
      currency,
      sku,
      availabilityCount: Number(availabilityCount),
      minimumThresholdCount: Number(minimumThresholdCount),
      tags: normalizedTags,
      isFeatured: Boolean(isFeatured),
      status: status || "draft",
    });

    const savedProduct = await newProduct.save();

    try {
      await syncProductToChroma(req, savedProduct, normalizedTags);

      return res.status(201).json({
        message: "Product created successfully in MongoDB and ChromaDB",
        product: savedProduct,
        chromaStored: true,
      });
    } catch (chromaError) {
      console.error("Chroma insert/upsert error:", chromaError);
      return res.status(500).json({
        error: "Product saved in MongoDB, but failed to save in ChromaDB",
        product: savedProduct,
        chromaStored: false,
        chromaMessage: chromaError.message,
      });
    }
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    console.error("Fetch products error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/products/:adminId", async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: "Invalid admin id" });
    }

    const products = await Product.find({ adminId }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    console.error("Fetch admin products error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Fetch product by id error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      adminId,
      name,
      description,
      shortDescription,
      brand,
      category,
      subCategory,
      imageUrl,
      price,
      discountPrice,
      currency,
      sku,
      availabilityCount,
      minimumThresholdCount,
      tags,
      isFeatured,
      status,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: "Invalid admin id" });
    }

    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (existingProduct.adminId.toString() !== adminId) {
      return res.status(403).json({ error: "You can edit only your own products" });
    }

    const normalizedTags = normalizeTags(tags);

    existingProduct.name = name ?? existingProduct.name;
    existingProduct.slug = name ? generateSlug(name) : existingProduct.slug;
    existingProduct.description = description ?? existingProduct.description;
    existingProduct.shortDescription =
      shortDescription ?? existingProduct.shortDescription;
    existingProduct.brand = brand ?? existingProduct.brand;
    existingProduct.category = category ?? existingProduct.category;
    existingProduct.subCategory = subCategory ?? existingProduct.subCategory;
    existingProduct.imageUrl = imageUrl ?? existingProduct.imageUrl;
    existingProduct.price =
      price !== undefined ? Number(price) : existingProduct.price;
    existingProduct.discountPrice =
      discountPrice !== undefined
        ? Number(discountPrice)
        : existingProduct.discountPrice;
    existingProduct.currency = currency ?? existingProduct.currency;
    existingProduct.sku = sku ?? existingProduct.sku;
    existingProduct.availabilityCount =
      availabilityCount !== undefined
        ? Number(availabilityCount)
        : existingProduct.availabilityCount;
    existingProduct.minimumThresholdCount =
      minimumThresholdCount !== undefined
        ? Number(minimumThresholdCount)
        : existingProduct.minimumThresholdCount;
    existingProduct.tags = tags !== undefined ? normalizedTags : existingProduct.tags;
    existingProduct.isFeatured =
      isFeatured !== undefined ? Boolean(isFeatured) : existingProduct.isFeatured;
    existingProduct.status = status ?? existingProduct.status;

    const updatedProduct = await existingProduct.save();

    try {
      await syncProductToChroma(req, updatedProduct, updatedProduct.tags || []);

      return res.status(200).json({
        message: "Product updated successfully",
        product: updatedProduct,
        chromaStored: true,
      });
    } catch (chromaError) {
      console.error("Chroma update error:", chromaError);

      return res.status(500).json({
        error: "Product updated in MongoDB, but failed to update ChromaDB",
        product: updatedProduct,
        chromaStored: false,
        chromaMessage: chromaError.message,
      });
    }
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/products/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: "Invalid admin id" });
    }

    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({ error: "Status must be draft or published" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.adminId.toString() !== adminId) {
      return res.status(403).json({ error: "You can update only your own products" });
    }

    product.status = status;
    const updatedProduct = await product.save();

    try {
      await syncProductToChroma(req, updatedProduct, updatedProduct.tags || []);

      return res.status(200).json({
        message: `Product moved to ${status} successfully`,
        product: updatedProduct,
        chromaStored: true,
      });
    } catch (chromaError) {
      console.error("Chroma status sync error:", chromaError);

      return res.status(500).json({
        error: "Product status updated in MongoDB, but failed to sync ChromaDB",
        product: updatedProduct,
        chromaStored: false,
        chromaMessage: chromaError.message,
      });
    }
  } catch (error) {
    console.error("Update product status error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: "Invalid admin id" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.adminId.toString() !== adminId) {
      return res.status(403).json({ error: "You can delete only your own products" });
    }

    await Product.findByIdAndDelete(id);

    try {
      await deleteProductFromChroma(req, id);

      return res.status(200).json({
        message: "Product deleted successfully from MongoDB and ChromaDB",
        deletedProductId: id,
        chromaDeleted: true,
      });
    } catch (chromaError) {
      console.error("Chroma delete error:", chromaError);

      return res.status(500).json({
        error: "Product deleted in MongoDB, but failed to delete from ChromaDB",
        deletedProductId: id,
        chromaDeleted: false,
        chromaMessage: chromaError.message,
      });
    }
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;