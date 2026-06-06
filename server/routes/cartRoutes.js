const express = require("express");
const router = express.Router();

const CartItem = require("../models/CartItem");
const Product = require("../models/Product");

router.get("/cart", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const items = await CartItem.find({ userId })
      .populate("productId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ items });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch cart items." });
  }
});

router.get("/cart/check", async (req, res) => {
  try {
    const { userId, productId } = req.query;

    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId are required." });
    }

    const item = await CartItem.findOne({ userId, productId });

    return res.status(200).json({
      exists: !!item,
      item,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to check cart item." });
  }
});

router.post("/cart", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId are required." });
    }

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found." });
    }

    const qty = Number(quantity) > 0 ? Number(quantity) : 1;

    const existingItem = await CartItem.findOne({ userId, productId });

    if (existingItem) {
      existingItem.quantity += qty;
      await existingItem.save();

      const populatedItem = await CartItem.findById(existingItem._id).populate("productId");

      return res.status(200).json({
        message: "Cart item quantity updated.",
        item: populatedItem,
      });
    }

    const item = await CartItem.create({
      userId,
      productId,
      quantity: qty,
    });

    const populatedItem = await CartItem.findById(item._id).populate("productId");

    return res.status(201).json({
      message: "Product added to cart.",
      item: populatedItem,
    });
  } catch (error) {
  console.error("POST /cart error:", error);
  return res.status(500).json({
    message: error.message || "Failed to add item to cart.",
    error,
  });
}
  
});

router.patch("/cart/:id", async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || Number(quantity) < 1) {
      return res.status(400).json({ message: "Valid quantity is required." });
    }

    const item = await CartItem.findByIdAndUpdate(
      req.params.id,
      { quantity: Number(quantity) },
      { new: true }
    ).populate("productId");

    if (!item) {
      return res.status(404).json({ message: "Cart item not found." });
    }

    return res.status(200).json({
      message: "Cart item updated.",
      item,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update cart item." });
  }
});

router.delete("/cart/:id", async (req, res) => {
  try {
    const item = await CartItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Cart item not found." });
    }

    return res.status(200).json({
      message: "Cart item removed successfully.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove cart item." });
  }
});

module.exports = router;