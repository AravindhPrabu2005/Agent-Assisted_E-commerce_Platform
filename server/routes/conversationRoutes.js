const express = require("express");
const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");

const router = express.Router();

const getWelcomeMessage = () => ({
  role: "assistant",
  content:
    "Hi, I'm your product finder. Ask me about products, features, prices, comparisons, or what suits your needs.",
  recommendations: [],
});

const generateTitleFromMessages = (messages = []) => {
  const firstUserMessage = messages.find((message) => message.role === "user");

  if (!firstUserMessage || !firstUserMessage.content) {
    return "New chat";
  }

  const text = firstUserMessage.content.trim();
  if (!text) return "New chat";

  return text.length > 40 ? `${text.slice(0, 40)}...` : text;
};

const isValidMongoId = (id) => {
  if (!id || typeof id !== "string") return false;

  const trimmedId = id.trim();

  return (
    mongoose.Types.ObjectId.isValid(trimmedId) &&
    String(new mongoose.Types.ObjectId(trimmedId)) === trimmedId
  );
};

const validateConversationId = (req, res, next) => {
  const { id } = req.params;

  if (!isValidMongoId(id)) {
    return res.status(400).json({
      message: "Invalid conversation id.",
    });
  }

  req.params.id = id.trim();
  next();
};

router.post("/conversations", async (req, res) => {
  try {
    const conversation = await Conversation.create({
      title: "New chat",
      messages: [getWelcomeMessage()],
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({
      message: "Failed to create conversation.",
      error: error.message,
    });
  }
});

router.get("/conversations", async (req, res) => {
  try {
    const conversations = await Conversation.find({})
      .sort({ updatedAt: -1 })
      .select("_id title createdAt updatedAt");

    res.json(conversations);
  } catch (error) {
    console.error("Fetch conversations error:", error);
    res.status(500).json({
      message: "Failed to fetch conversations.",
      error: error.message,
    });
  }
});

router.get("/conversations/:id", validateConversationId, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    res.json(conversation);
  } catch (error) {
    console.error("Fetch conversation error:", error);
    res.status(500).json({
      message: "Failed to fetch conversation.",
      error: error.message,
    });
  }
});

router.patch(
  "/conversations/:id/title",
  validateConversationId,
  async (req, res) => {
    try {
      const { title } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ message: "Title is required." });
      }

      const conversation = await Conversation.findByIdAndUpdate(
        req.params.id,
        { title: title.trim() },
        { new: true }
      );

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found." });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Rename conversation error:", error);
      res.status(500).json({
        message: "Failed to rename conversation.",
        error: error.message,
      });
    }
  }
);

router.delete("/conversations/:id", validateConversationId, async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    res.json({ message: "Conversation deleted successfully." });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({
      message: "Failed to delete conversation.",
      error: error.message,
    });
  }
});

router.post(
  "/conversations/:id/messages",
  validateConversationId,
  async (req, res) => {
    try {
      const { userMessage, assistantMessage } = req.body;

      if (!userMessage || !userMessage.content?.trim()) {
        return res.status(400).json({ message: "User message is required." });
      }

      if (!assistantMessage || !assistantMessage.content?.trim()) {
        return res.status(400).json({ message: "Assistant message is required." });
      }

      const conversation = await Conversation.findById(req.params.id);

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found." });
      }

      conversation.messages.push({
        role: "user",
        content: userMessage.content.trim(),
        recommendations: [],
      });

      conversation.messages.push({
        role: "assistant",
        content: assistantMessage.content.trim(),
        recommendations: Array.isArray(assistantMessage.recommendations)
          ? assistantMessage.recommendations
          : [],
      });

      if (!conversation.title || conversation.title === "New chat") {
        conversation.title = generateTitleFromMessages(conversation.messages);
      }

      await conversation.save();

      res.json(conversation);
    } catch (error) {
      console.error("Save messages error:", error);
      res.status(500).json({
        message: "Failed to save messages.",
        error: error.message,
      });
    }
  }
);

module.exports = router;