const Groq = require("groq-sdk");
const Review = require("../models/Review");
const Product = require("../models/Product");
const { searchProductsFromChroma } = require("./chromaService");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateProductReviewSummary(productId) {
  const product = await Product.findById(productId).lean();

  if (!product) {
    throw new Error("Product not found.");
  }

  const reviews = await Review.find({ productId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  if (!reviews.length) {
    return {
      summary: "No customer reviews are available for this product yet.",
      highlights: [],
      concerns: [],
      sentiment: "mixed",
      confidence: "low",
    };
  }

  const chromaMatches = await searchProductsFromChroma(product.name, 3);

  const productContext = chromaMatches
    .map((item, index) => {
      return `Context ${index + 1}
Document:
${item.document || ""}

Metadata:
${JSON.stringify(item.metadata || {}, null, 2)}`;
    })
    .join("\n\n");

  const reviewContext = reviews
    .map((review, index) => {
      return `Review ${index + 1}
Customer: ${review.customerName || "Customer"}
Rating: ${review.rating}/5
Review Text: ${review.reviewText}`;
    })
    .join("\n\n");

  const prompt = `
You are an e-commerce review summarization assistant for sellers.

Your job:
- Summarize the real customer feedback for one product.
- Use only the provided product context and reviews.
- Be concise, balanced, and useful for a seller.
- Do not invent features, issues, praise, or complaints.
- Highlights should contain recurring positive themes.
- Concerns should contain recurring negative themes or hesitation points.
- If reviews are few or mixed, reduce confidence.

Return ONLY valid JSON in this exact shape:
{
  "summary": "string",
  "highlights": ["string"],
  "concerns": ["string"],
  "sentiment": "positive | mixed | negative",
  "confidence": "low | medium | high"
}

Product:
Name: ${product.name || ""}
Brand: ${product.brand || ""}
Category: ${product.category || ""}
Short Description: ${product.shortDescription || ""}
Description: ${product.description || ""}

Chroma Product Context:
${productContext}

Customer Reviews:
${reviewContext}
  `.trim();

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content: "You are a precise JSON-only review summary generator.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const raw = completion?.choices?.[0]?.message?.content?.trim() || "{}";

  try {
    const parsed = JSON.parse(raw);

    return {
      summary: parsed.summary || "No summary available.",
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      sentiment: ["positive", "mixed", "negative"].includes(parsed.sentiment)
        ? parsed.sentiment
        : "mixed",
      confidence: ["low", "medium", "high"].includes(parsed.confidence)
        ? parsed.confidence
        : "low",
    };
  } catch (error) {
    return {
      summary: raw || "Summary could not be parsed.",
      highlights: [],
      concerns: [],
      sentiment: "mixed",
      confidence: "low",
    };
  }
}

module.exports = {
  generateProductReviewSummary,
};