const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { upsertProductToChroma } = require("../services/chromaService");

const isValidMongoId = (id) =>
  typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

router.post("/reviews", async (req, res) => {
  try {
    const { orderId, productId, userId, customerName, rating, reviewText } = req.body;

    if (!orderId || !productId || !customerName || !rating || !reviewText?.trim()) {
      return res.status(400).json({
        message: "orderId, productId, customerName, rating and reviewText are required.",
      });
    }

    if (!isValidMongoId(orderId) || !isValidMongoId(productId)) {
      return res.status(400).json({
        message: "Invalid orderId or productId.",
      });
    }

    if (userId && !isValidMongoId(userId)) {
      return res.status(400).json({
        message: "Invalid userId.",
      });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    const orderedItem = order.items.find(
      (item) => String(item.productId) === String(productId)
    );

    if (!orderedItem) {
      return res.status(400).json({
        message: "This product does not belong to the selected order.",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    if (userId) {
      const existingReview = await Review.findOne({
        productId,
        userId,
      });

      if (existingReview) {
        return res.status(409).json({
          message: "You have already reviewed this product.",
        });
      }
    } else {
      const existingGuestReview = await Review.findOne({
        orderId,
        productId,
      });

      if (existingGuestReview) {
        return res.status(409).json({
          message: "Review already submitted for this order item.",
        });
      }
    }

    const review = await Review.create({
      orderId,
      productId,
      userId: userId || null,
      customerName: customerName.trim(),
      rating: Number(rating),
      reviewText: reviewText.trim(),
    });

    const productReviews = await Review.find({ productId }).lean();
    const reviewCount = productReviews.length;
    const averageRating =
      reviewCount > 0
        ? productReviews.reduce((sum, item) => sum + item.rating, 0) / reviewCount
        : 0;

    product.averageRating = Number(averageRating.toFixed(1));
    product.reviewCount = reviewCount;

    if (product.ratingAverage !== undefined) {
      product.ratingAverage = Number(averageRating.toFixed(1));
    }
    if (product.ratingCount !== undefined) {
      product.ratingCount = reviewCount;
    }

    await product.save();

    await upsertProductToChroma(product);

    return res.status(201).json({
      message: "Review submitted successfully.",
      review,
      productRating: {
        averageRating: product.averageRating ?? product.ratingAverage ?? 0,
        reviewCount: product.reviewCount ?? product.ratingCount ?? 0,
      },
    });
  } catch (error) {
    console.error("Create review error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already reviewed this product.",
      });
    }

    return res.status(500).json({
      message: error.message || "Failed to submit review.",
    });
  }
});

router.get("/reviews/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidMongoId(productId)) {
      return res.status(400).json({
        message: "Invalid productId.",
      });
    }

    const reviews = await Review.find({ productId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch reviews.",
    });
  }
});

router.get("/reviews/check", async (req, res) => {
  try {
    const { productId, userId, orderId } = req.query;

    if (!productId) {
      return res.status(400).json({
        message: "productId is required.",
      });
    }

    if (!isValidMongoId(productId)) {
      return res.status(400).json({
        message: "Invalid productId.",
      });
    }

    let review = null;

    if (userId) {
      if (!isValidMongoId(userId)) {
        return res.status(400).json({
          message: "Invalid userId.",
        });
      }
      review = await Review.findOne({ productId, userId });
    } else if (orderId) {
      if (!isValidMongoId(orderId)) {
        return res.status(400).json({
          message: "Invalid orderId.",
        });
      }
      review = await Review.findOne({ productId, orderId });
    }

    return res.status(200).json({
      alreadyReviewed: !!review,
      review,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to check review status.",
    });
  }
});

module.exports = router;