const express = require("express");
const router = express.Router();

const WishlistItem = require("../models/WishlistItem");
const Product = require("../models/Product");

router.get("/wishlist", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const items = await WishlistItem.find({ userId })
      .populate("productId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ items });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch wishlist items." });
  }
});

router.get("/wishlist/check", async (req, res) => {
  try {
    const { userId, productId } = req.query;

    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId are required." });
    }

    const item = await WishlistItem.findOne({ userId, productId });

    return res.status(200).json({
      exists: !!item,
      item,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to check wishlist item." });
  }
});

router.post("/wishlist", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId are required." });
    }

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found." });
    }

    const existingItem = await WishlistItem.findOne({ userId, productId });

    if (existingItem) {
      return res.status(200).json({
        message: "Product already in wishlist.",
        item: existingItem,
      });
    }

    const item = await WishlistItem.create({
      userId,
      productId,
    });

    const populatedItem = await WishlistItem.findById(item._id).populate("productId");

    return res.status(201).json({
      message: "Product added to wishlist.",
      item: populatedItem,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Product already in wishlist." });
    }

    return res.status(500).json({
      message: error.message || "Failed to add item to wishlist.",
    });
  }
});

router.delete("/wishlist/:id", async (req, res) => {
  try {
    const item = await WishlistItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Wishlist item not found." });
    }

    return res.status(200).json({
      message: "Wishlist item removed successfully.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove wishlist item." });
  }
});

module.exports = router;