const express = require("express");
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
    Tags: ${(product.tags || []).join(", ")}
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

router.get("/inventory", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Fetch inventory error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { availabilityCount, minimumThresholdCount, orderCount, status } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (availabilityCount !== undefined) {
      product.availabilityCount = Number(availabilityCount);
    }

    if (minimumThresholdCount !== undefined) {
      product.minimumThresholdCount = Number(minimumThresholdCount);
    }

    if (orderCount !== undefined) {
      product.orderCount = Number(orderCount);
    }

    if (status) {
      product.status = status;
    } else if (Number(product.availabilityCount) === 0) {
      product.status = "out_of_stock";
    } else if (product.status === "out_of_stock" && Number(product.availabilityCount) > 0) {
      product.status = "published";
    }

    const updatedProduct = await product.save();

    try {
      const chromaClient = req.app.locals.chromaClient;

      if (chromaClient) {
        const productCollection = await chromaClient.getOrCreateCollection({
          name: "products",
        });

        await productCollection.update({
          ids: [updatedProduct._id.toString()],
          documents: [generateProductDocument(updatedProduct)],
          metadatas: [
            {
              productId: updatedProduct._id.toString(),
              adminId: updatedProduct.adminId.toString(),
              name: updatedProduct.name,
              category: updatedProduct.category,
              subCategory: updatedProduct.subCategory || "",
              brand: updatedProduct.brand || "",
              price: updatedProduct.price,
              discountPrice: updatedProduct.discountPrice || 0,
              availabilityCount: updatedProduct.availabilityCount,
              minimumThresholdCount: updatedProduct.minimumThresholdCount,
              orderCount: updatedProduct.orderCount || 0,
              imageUrl: updatedProduct.imageUrl,
              status: updatedProduct.status,
              isFeatured: updatedProduct.isFeatured,
            },
          ],
        });
      }
    } catch (chromaError) {
      console.error("Chroma inventory update error:", chromaError);
    }

    return res.json({
      success: true,
      message: "Inventory updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update inventory error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;