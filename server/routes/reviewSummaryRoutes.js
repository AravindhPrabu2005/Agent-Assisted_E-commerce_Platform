const express = require("express");
const mongoose = require("mongoose");
const { generateProductReviewSummary } = require("../services/reviewSummaryService");

const router = express.Router();

const isValidMongoId = (id) =>
  typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

router.post("/products/:productId/review-summary", async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidMongoId(productId)) {
      return res.status(400).json({ error: "Invalid product id." });
    }

    const summary = await generateProductReviewSummary(productId);

    return res.json({
      message: "Review summary generated successfully.",
      summary,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Review summary error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate review summary.",
    });
  }
});

module.exports = router;