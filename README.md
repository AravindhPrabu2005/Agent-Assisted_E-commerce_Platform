# 🛒 Agent-Assisted E-commerce Platform

A full-stack AI-powered e-commerce platform built with the MERN stack, LangChain, LangGraph, and ChromaDB. The platform features intelligent shopping assistants, AI-driven inventory forecasting, semantic product recommendations, and automated review summarization — all integrated into a seamless user and admin experience.

---

## 🧠 What Makes It "Agent-Assisted"

Unlike traditional e-commerce platforms, this project embeds **two distinct AI agents** into the core workflow:

- **Shopping Agent** — A LangGraph-powered chatbot that understands natural language, helps users find products, add items to cart, and track orders conversationally.
- **Inventory Agent** — A LangGraph agent that assists admins in forecasting stock levels, analyzing demand patterns, and generating restock recommendations.

Both agents use **Groq** as the LLM backend for fast inference, and **ChromaDB** for semantic memory over products, reviews, and orders.

---

## 🗂️ Project Structure

```
Agent-Assisted_E-commerce_Platform/
├── client/                         # React Frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── admin/              # Admin portal components
│       │   │   ├── Analytics.jsx
│       │   │   ├── Dashboard.jsx
│       │   │   ├── Inventory.jsx
│       │   │   ├── InventoryForecast.jsx
│       │   │   ├── NewProduct.jsx
│       │   │   ├── Orders.jsx
│       │   │   ├── ProductWorkspace.jsx
│       │   │   ├── Products.jsx
│       │   │   └── AdminNavbar.jsx
│       │   ├── user/               # User portal components
│       │   │   ├── Home.jsx
│       │   │   ├── Product.jsx
│       │   │   ├── ChatBot.jsx
│       │   │   ├── Cart.jsx
│       │   │   ├── CartCheckout.jsx
│       │   │   ├── Order.jsx
│       │   │   ├── OrdersListing.jsx
│       │   │   ├── Wishlist.jsx
│       │   │   └── UserNavbar.jsx
│       │   ├── Landing.jsx
│       │   ├── Loginpage.jsx
│       │   ├── Signup.jsx
│       │   └── AdminSignup.jsx
│       ├── axiosInstance.js
│       └── App.js
│
├── server/                         # Node.js / Express Backend
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Admin.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── CartItem.js
│   │   ├── WishlistItem.js
│   │   ├── Conversation.js
│   │   └── Review.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── chatbotRoutes.js          # Shopping AI Agent
│   │   ├── inventoryAgentRoutes.js   # Inventory AI Agent
│   │   ├── conversationRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── reviewSummaryRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── wishlistRoutes.js
│   │   └── recommendationRoutes.js
│   ├── services/
│   │   ├── chromaService.js
│   │   ├── recommendationService.js
│   │   └── reviewSummaryService.js
│   ├── server.js
│   └── package.json
│
└── infra/                          # Infrastructure
    ├── docker-compose.yml          # ChromaDB Docker setup
    └── chroma/                     # ChromaDB persistent volume
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (via Mongoose) |
| Vector Database | ChromaDB |
| AI Agents | LangChain, LangGraph |
| LLM Provider | Groq API |
| Authentication | JWT + bcryptjs |
| Infrastructure | Docker Compose |

---

## 🌟 Features

### 👤 User Side
- **AI Shopping Chatbot** — Natural language assistant to browse, compare, and purchase products
- **Smart Recommendations** — Vector similarity–based suggestions powered by ChromaDB
- **Product Search & Filtering** — Semantic search across product catalog
- **Cart & Wishlist** — Full cart management with quantity controls
- **Checkout & Orders** — Complete order placement and tracking
- **AI Review Summaries** — Groq-generated summaries of product reviews
- **Conversation History** — Persistent chat memory across sessions

### 🛠️ Admin Side
- **Dashboard** — Real-time store overview with key metrics
- **Analytics** — Rich charts for sales, revenue, and user trends
- **Product Workspace** — Full product CRUD with ChromaDB vector sync
- **Inventory Management** — Stock tracking and updates
- **AI Inventory Forecast** — LangGraph agent predicting demand and restock needs
- **Order Management** — View, filter, and update order statuses

---

## 🤖 AI Agent Architecture

### Shopping Agent (`chatbotRoutes.js`)
Built with **LangGraph** as a stateful graph pipeline. The agent:
1. Receives user message + conversation history
2. Routes intent — product search, cart action, order query, or general chat
3. Queries ChromaDB for semantically relevant products
4. Executes actions (add to cart, fetch order status, etc.)
5. Returns a natural language response

### Inventory Agent (`inventoryAgentRoutes.js`)
Admin-facing LangGraph agent that:
1. Analyzes current stock levels from MongoDB
2. Queries historical order vectors from ChromaDB
3. Generates demand forecasts and restock recommendations
4. Presents structured insights on the `InventoryForecast` dashboard

### ChromaDB Collections

| Collection | Purpose |
|---|---|
| `products` | Product embeddings for semantic search & recommendations |
| `reviews` | Review embeddings for AI summarization |
| `orders` | Order history embeddings for inventory forecasting |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB Atlas URI
- Groq API Key
- Docker & Docker Compose (for ChromaDB)

### 1. Start ChromaDB

```bash
cd infra
docker-compose up -d
```

### 2. Setup Server

```bash
cd server
npm install
```

Create a `.env` file in `/server`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

```bash
npm start
```

### 3. Setup Client

```bash
cd client
npm install
npm start
```

The React app runs on `http://localhost:3000` and the Express server on `http://localhost:5000`.

---

## 🗃️ Database Models

| Model | Key Fields |
|---|---|
| `User` | name, email, password (hashed) |
| `Admin` | name, email, password (hashed) |
| `Product` | name, description, price, category, stock, images |
| `Order` | userId, items[], shippingAddress, status, totalAmount |
| `CartItem` | userId, productId, quantity |
| `WishlistItem` | userId, productId |
| `Review` | userId, productId, rating, comment |
| `Conversation` | userId, messages[], timestamps |

---

## 🔐 Authentication

- Separate JWT-based auth flows for **Users** and **Admins**
- `authMiddleware.js` protects all private routes by verifying Bearer tokens
- Passwords hashed using `bcryptjs`

---

## 📦 Key Dependencies

```json
"@langchain/core": "^1.1.48",
"@langchain/groq": "^1.2.1",
"@langchain/langgraph": "^1.3.6",
"chromadb": "^3.4.3",
"mongoose": "^8.10.0",
"express": "^4.22.2",
"jsonwebtoken": "^9.0.2",
"bcryptjs": "^2.4.3"
```

---

---

## 🧑‍💻 Author

**Aravindhprabu** — Undergraduate CS Student, Chennai  
Building production-grade AI-integrated full-stack systems.

---

## 📄 License

This project is for educational and portfolio purposes.
