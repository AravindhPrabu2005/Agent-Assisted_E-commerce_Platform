const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { ChromaClient } = require("chromadb");
const { DefaultEmbeddingFunction } = require("@chroma-core/default-embed");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const chatbotRoutes = require('./routes/chatbotRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/", authRoutes);
app.use("/", productRoutes);
app.use("/", inventoryRoutes);
app.use("/",chatbotRoutes);
app.use("/",conversationRoutes);

const initConnections = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const chromaClient = new ChromaClient({
      host: process.env.CHROMA_HOST || "localhost",
      port: Number(process.env.CHROMA_PORT) || 8000,
      ssl: false,
    });

    const embeddingFunction = new DefaultEmbeddingFunction();

    app.locals.chromaClient = chromaClient;
    app.locals.embeddingFunction = embeddingFunction;

    console.log("ChromaDB connected");

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Startup connection error:", err);
  }
};

initConnections();