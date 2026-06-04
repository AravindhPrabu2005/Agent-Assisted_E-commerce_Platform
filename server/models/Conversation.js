const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    recommendations: [
      {
        id: { type: String, default: "" },
        name: { type: String, default: "" },
        brand: { type: String, default: "" },
        category: { type: String, default: "" },
        price: { type: Number, default: null },
        discountPrice: { type: Number, default: null },
        shortDescription: { type: String, default: "" },
        imageUrl: { type: String, default: "" },
      },
    ],
  },
  { _id: true, timestamps: true }
);

const ConversationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "New chat",
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);