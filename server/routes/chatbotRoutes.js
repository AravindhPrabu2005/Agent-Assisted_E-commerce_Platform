const express = require("express");
const Groq = require("groq-sdk");
const { searchProductsFromChroma } = require("../services/chromaService");

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Queries that usually mean "explain / more details about same product"
const detailVerbPattern =
  /\b(explain|detail|details|describe|tell me|more about|show me|spec|specs|specifications)\b/i;
// Queries that indicate user wants cheaper / low price
const cheapPattern =
  /\b(cheap|cheaper|low price|less price|lower price|budget|price is high|too costly|too expensive|pricy|pricey)\b/i;

// "more options? / better one?" style follow‑ups
const isMoreOptionsFollowup = (query) => {
  const q = query.toLowerCase();
  const FOLLOWUP_OPTIONS =
    /(any ?other|other options?|more options?|anything else|something else|another one|more like this|similar ones?|similar products?|show another|better one|better option|best one)/i;
  return FOLLOWUP_OPTIONS.test(q);
};

// Count / total queries
const isCountQuery = (query) => {
  const q = query.toLowerCase();
  return /\bhow many\b/.test(q) || /\btotal\b/.test(q) || /\bcount\b/.test(q);
};

// Listing queries: "list products you have", "show products you have"
const isListingQuery = (query) => {
  const q = query.toLowerCase();
  return /\b(list|show)\b.*\b(products?|items?|things)\b/i.test(q);
};

/**
 * 1. LLM INTENT ROUTER
 */
async function classifyMessage(message, history = []) {
  const routerSystemPrompt = `
You are a router for an e-commerce assistant called eKadai.

Your job:
- Understand the user's message and recent chat history.
- Decide if this is a PRODUCT-related query, SMALL TALK, or OTHER (like coding, politics, exams, etc.).
- If it's NOT product-related, you may write a friendly small-talk reply, but you MUST NOT answer coding, exam, or general knowledge questions. Instead, you should remind the user that you are an e-commerce product assistant.

Output format:
Return ONLY a single valid JSON object (no extra text, no comments):

{
  "mode": "product" | "direct_answer",
  "intent": "small_talk" | "product_query" | "other",
  "category": "Laptops" | "Mobiles" | "Fashion" | "Home Appliances" | "Audio" | null,
  "normalized_query": "string",
  "answer": "string or null"
}

When is something PRODUCT-related?
- Any question about:
  - specific items ("do you have cooker", "I need a shoe", "suggest headphones")
  - categories ("what products you have", "what all categories", "what products in fashion")
  - listing ("list products you have", "show products you have", "list all laptops")
  - catalog statistics ("how many products you have", "how many mobiles are there", "how many products in total")
  - prices, offers, discounts, availability, comparisons, specs.
- FOLLOW-UP product queries that reference prior results, such as:
  - "that laptop", "this phone", "that product", "that one"
  - "short desc", "short description", "brief description of that", "why don't you give short desc"
  - "better one please", "any other option", "cheaper one", "more options"

All of the above MUST be classified as intent = "product_query" and mode = "product".

When is something SMALL TALK?
- Greetings and chit-chat:
  - "hi", "hello", "hey bro", "how are you", "how's your day", "what's up"
  - frustration / meta chat about the bot:
    - "you are not understanding", "you are frustrating me", "what are you doing", "who are you"
- For these, use:
  - mode = "direct_answer"
  - intent = "small_talk"
  - "answer" = a friendly, domain-aware reply (e.g. "I'm doing well! I'm mainly here to help you with products on eKadai...").

When is something OTHER?
- Non-product topics like:
  - coding questions ("give me python code", "write a Java function", "DSA problem", "SQL query")
  - exams, job prep, politics, general knowledge, etc.
- For these:
  - mode = "direct_answer"
  - intent = "other"
  - "answer" MUST be a refusal that clearly says you are an eKadai product finder assistant and that you do NOT handle coding, exams, politics, or general knowledge. Do not provide code or detailed answers.

Additional rules:
- When mode = "product":
  - "answer" MUST be null. You are not answering the question here.
  - "normalized_query" should be a clean product search query, e.g. "laptops for students under 50000", "running shoes for men", "rice cooker", "topmost product by price", "total products in catalog".
- "category":
  - Try to infer ONE of: "Laptops", "Mobiles", "Fashion", "Home Appliances", "Audio".
  - Use null if you are not sure.

IMPORTANT:
- Do NOT mention JSON, keys, or technical details in your "answer" text. That should read like a normal assistant message to the user.
`.trim();

  const routerMessages = [
    { role: "system", content: routerSystemPrompt },
    ...history.slice(-6).map((h) => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content,
    })),
    {
      role: "user",
      content: JSON.stringify({ message }),
    },
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: routerMessages,
    temperature: 0,
    max_tokens: 400,
  });

  const raw = completion?.choices?.[0]?.message?.content || "{}";

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    parsed = {
      mode: "product",
      intent: "product_query",
      category: null,
      normalized_query: message,
      answer: null,
    };
  }

  if (!parsed.mode) parsed.mode = "product";
  if (!parsed.intent) parsed.intent = parsed.mode === "product" ? "product_query" : "other";
  if (!parsed.normalized_query) parsed.normalized_query = message;

  return parsed;
}

/**
 * 2. Short description generator for product cards
 */
async function generateShortDescriptionFromDocument(doc, name) {
  if (!doc || !doc.trim()) return "";

  const prompt = `
You are writing a short description for an e-commerce product card.

Product name: ${name || "Unknown Product"}

Task:
- Read the product context below.
- Write 1–2 concise sentences (max ~120 characters each) that describe:
  - What the product is.
  - Who/what it's good for.
- Do NOT include price, availability, or brand slogans.
- Do NOT mention "this card" or "product card".
- Answer with plain text only, no bullet points.

Product context:
${doc}
  `.trim();

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You generate short product descriptions for e-commerce cards.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 80,
  });

  const text = completion?.choices?.[0]?.message?.content?.trim() || "";
  return text.length > 260 ? text.slice(0, 260) : text;
}

/**
 * 3. CONSTRAINT PARSING (budget + sub-type + explicit keyword)
 *    IMPORTANT: constraints are based on RAW USER MESSAGE (not normalized_query).
 */
const extractConstraints = (query) => {
  const q = query.toLowerCase();
  const constraints = {
    maxPrice: null,
    minPrice: null,
    wantsSlippers: false,
    requiredKeyword: null, // e.g. "white kerchiefs", "gm brand switches box", "diwali crackers"
  };

  // Listing queries → no hard keyword
  if (isListingQuery(q)) {
    return constraints;
  }

  // Count queries → no hard keyword
  if (isCountQuery(q)) {
    return constraints;
  }

  // max price
  let maxMatch =
    q.match(/under\s*(\d+)\s*(rs|rupees|₹)?/) ||
    q.match(/below\s*(\d+)\s*(rs|rupees|₹)?/) ||
    q.match(/upto\s*(\d+)\s*(rs|rupees|₹)?/);
  if (maxMatch) constraints.maxPrice = parseInt(maxMatch[1], 10);

  // min price
  let minMatch =
    q.match(/above\s*(\d+)\s*(rs|rupees|₹)?/) ||
    q.match(/over\s*(\d+)\s*(rs|rupees|₹)?/);
  if (minMatch) constraints.minPrice = parseInt(minMatch[1], 10);

  // slippers / chappal
  constraints.wantsSlippers = /\b(slipper|slippers|chappal|chapal|chappel|chapel)\b/i.test(q);

  // META FOLLOW‑UPS (better one / cheaper / more options) → no hard keyword
  const isFollowupMeta = isMoreOptionsFollowup(q) || cheapPattern.test(q);
  if (isFollowupMeta) {
    return constraints;
  }

  // explicit product keywords
  if (/\brice\s*cooker\b/.test(q)) {
    constraints.requiredKeyword = "rice cooker";
  } else if (/\bpressure\s*cooker\b/.test(q)) {
    constraints.requiredKeyword = "pressure cooker";
  } else if (/\bcooker(s)?\b/.test(q)) {
    constraints.requiredKeyword = "cooker";
  } else if (/\bpooja\b/i.test(q) || /\bmandir\b/i.test(q)) {
    constraints.requiredKeyword = "pooja";
  } else {
    // 1) "do you have X" / "have you got X"
    let m =
      q.match(/do\s+you\s+have\s+([a-z0-9\s]+)\??$/i) ||
      q.match(/have\s+you\s+got\s+([a-z0-9\s]+)\??$/i);
    // 2) "i need X" or "need X"
    if (!m) {
      m = q.match(/\bi\s+need\s+([a-z0-9\s]+)\??$/i) || q.match(/\bneed\s+([a-z0-9\s]+)\??$/i);
    }
    // 3) "i want X" or "want X"
    if (!m) {
      m = q.match(/\bi\s+want\s+([a-z0-9\s]+)\??$/i) || q.match(/\bwant\s+([a-z0-9\s]+)\??$/i);
    }
    // 4) "looking for X"
    if (!m) {
      m = q.match(/\blooking\s+for\s+([a-z0-9\s]+)\??$/i);
    }

    if (m && m[1]) {
      let phrase = m[1].trim();
      // strip casual fillers at the end: "yar", "yaar", "please", "pls", "plz", "for sure"
      phrase = phrase.replace(/\b(yar+|yaar+|please|pls|plz|for sure)\b/gi, "").trim();
      // strip leading articles: "a air fryer" -> "air fryer"
      phrase = phrase.replace(/^(a|an|the)\s+/i, "").trim();

      const words = phrase.split(/\s+/).filter(Boolean);

      // if phrase contains verbs like "explain", "detail", etc., it's a follow-up, not a product name
      // also only treat SHORT phrases (<=4 words) as hard product names
      if (
        phrase.length >= 3 &&
        words.length > 0 &&
        words.length <= 4 &&
        !detailVerbPattern.test(phrase)
      ) {
        constraints.requiredKeyword = phrase; // e.g. "diwali crackers", "air fryer", "gm brand switches box"
      }
    }

    // 5) fallback: very short queries like "crackers?", "just crackers?"
    if (!constraints.requiredKeyword) {
      // drop filler words including "need", "want", "for", "sure"
      let fallback = q
        .replace(
          /\b(just|only|some|any|please|pls|plz|yar+|yaar+|products?|product|need|want|for|sure)\b/gi,
          ""
        )
        .replace(/[?.!]+/g, "")
        .trim();

      // ignore pure retry utterances
      if (/^(try again|search again|again)$/i.test(fallback)) {
        fallback = "";
      }

      const knownCategoryRegex =
        /\b(laptop|laptops|mobile|phone|smartphone|watch|headphone|headphones|earbud|earbuds|speaker|tv|television|fridge|refrigerator|shoes?|tshirt|t-shirt|jeans|dress|jacket|coat|bag|backpack)\b/i;

      const words = fallback.split(/\s+/).filter(Boolean);

      if (
        fallback &&
        fallback.length >= 3 &&
        words.length <= 3 &&
        !knownCategoryRegex.test(fallback) &&
        !detailVerbPattern.test(fallback)
      ) {
        constraints.requiredKeyword = fallback; // e.g. "crackers"
      }
    }
  }

  return constraints;
};

const applyConstraintsToSources = (sources, constraints) => {
  let filtered = [...sources];

  // 1) required keyword: must appear in name or description or full context
  if (constraints.requiredKeyword) {
    const kw = constraints.requiredKeyword.toLowerCase();
    filtered = filtered.filter((item) => {
      const metadata = item.metadata || {};
      const name = (metadata.name || "").toLowerCase();
      const shortDesc = (metadata.shortDescription || "").toLowerCase();
      const doc = (item.document || "").toLowerCase();
      return name.includes(kw) || shortDesc.includes(kw) || doc.includes(kw);
    });
  }

  // 2) slippers / chappal constraints
  const slipperRegex = /\b(slipper|slippers|chappal|chapal|chappel|chapel)\b/i;
  if (constraints.wantsSlippers) {
    filtered = filtered.filter((item) => {
      const metadata = item.metadata || {};
      const name = (metadata.name || "").toLowerCase();
      const shortDesc = (metadata.shortDescription || "").toLowerCase();
      const doc = (item.document || "").toLowerCase();
      return (
        slipperRegex.test(name) ||
        slipperRegex.test(shortDesc) ||
        slipperRegex.test(doc)
      );
    });
  }

  // 3) price filters
  if (constraints.maxPrice != null) {
    const max = constraints.maxPrice;
    filtered = filtered.filter((item) => {
      const metadata = item.metadata || {};
      let price = metadata.discountPrice ?? metadata.price;
      if (price == null) return false;
      if (typeof price === "string") {
        const num = parseInt(price.replace(/[^\d]/g, ""), 10);
        if (Number.isNaN(num)) return false;
        price = num;
      }
      if (typeof price !== "number") return false;
      return price <= max;
    });
  }

  if (constraints.minPrice != null) {
    const min = constraints.minPrice;
    filtered = filtered.filter((item) => {
      const metadata = item.metadata || {};
      let price = metadata.discountPrice ?? metadata.price;
      if (price == null) return false;
      if (typeof price === "string") {
        const num = parseInt(price.replace(/[^\d]/g, ""), 10);
        if (Number.isNaN(num)) return false;
        price = num;
      }
      if (typeof price !== "number") return false;
      return price >= min;
    });
  }

  return filtered;
};

// "only one" / "topmost" style
const wantsSingleProduct = (query) => {
  const q = query.toLowerCase();
  return (
    /\b(only one|just one|single product|only 1|one top|one best|topmost|top most)\b/.test(q) ||
    /\b(highest price|most expensive|costliest|max price|maximum price)\b/.test(q)
  );
};

// numeric price extraction
const getNumericPrice = (metadata) => {
  let price = metadata.discountPrice ?? metadata.price;
  if (price == null) return null;
  if (typeof price === "string") {
    const num = parseInt(price.replace(/[^\d]/g, ""), 10);
    if (Number.isNaN(num)) return null;
    price = num;
  }
  if (typeof price !== "number") return null;
  return price;
};

/**
 * 4. MAIN ROUTE
 */
router.post("/product-finder", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required." });
    }

    const trimmedMessage = message.trim();
    const isCount = isCountQuery(trimmedMessage);

    // Retry utterances like "try again" → ask user to restate product
    const retryPattern = /^(try again|search again|again)$/i;
    if (retryPattern.test(trimmedMessage)) {
      return res.json({
        answer:
          'If you want me to search again, please mention the product clearly, for example: "air fryer under 8000" or "laptops for office use".',
        sources: [],
      });
    }

    // EXTRA: Medical / health queries → refuse, no products
    const medicalPattern =
      /\b(cough|fever|cold|flu|headache|sore throat|throat pain|infection|tablet for|tablets for|medicine|medicines|syrup|antibiotic|painkiller)\b/i;
    if (medicalPattern.test(trimmedMessage)) {
      return res.json({
        answer:
          "It sounds like you’re asking about medicine or treatment. I’m only a product finder for eKadai and can’t help with medical advice or medicines. Please consult a doctor or a medical professional.",
        sources: [],
      });
    }

    // 1) LLM router
    const route = await classifyMessage(trimmedMessage, history);
    const { mode, intent, category, normalized_query, answer: routerAnswer } = route;

    // 2) direct_answer path: small talk or non-product topics
    if (mode === "direct_answer") {
      if (intent === "small_talk" && routerAnswer) {
        return res.json({
          answer: routerAnswer,
          sources: [],
        });
      }

      // intent === "other" or routerAnswer missing → domain guard
      return res.json({
        answer:
          "I'm your product finder assistant for eKadai. I focus on helping with products, prices, offers, and availability. I can't handle coding, exams, or other non-product questions. Please tell me what kind of product you’re interested in.",
        sources: [],
      });
    }

    // 3) product path
    const detectedCategory = category; // may be null

    // constraints from RAW message (for hard "no" behavior)
    const constraints = extractConstraints(trimmedMessage);
    const limitToOne = wantsSingleProduct(trimmedMessage);
    const isDetailQuery = detailVerbPattern.test(trimmedMessage.toLowerCase());
    const wantsCheaper = cheapPattern.test(trimmedMessage.toLowerCase());
    const isOptionsFollowup = isMoreOptionsFollowup(trimmedMessage);

    // For COUNT or LIST queries, override search query to be category-based / generic
    let searchQueryForChroma = normalized_query;
    if (isCount || isListingQuery(trimmedMessage)) {
      if (detectedCategory === "Laptops") searchQueryForChroma = "laptop";
      else if (detectedCategory === "Mobiles") searchQueryForChroma = "mobile";
      else if (detectedCategory === "Fashion") searchQueryForChroma = "fashion";
      else if (detectedCategory === "Home Appliances") searchQueryForChroma = "appliance";
      else if (detectedCategory === "Audio") searchQueryForChroma = "audio";
      else searchQueryForChroma = "product";
    }

    // retrieval
    const chromaMatches = await searchProductsFromChroma(searchQueryForChroma, 20);

    if (!chromaMatches.length) {
      const kwText = constraints.requiredKeyword
        ? `"${constraints.requiredKeyword}"`
        : "that query";
      return res.json({
        answer: `I searched our product catalog but couldn’t find anything matching ${kwText}. It looks like we don’t have that kind of product right now.`,
        sources: [],
      });
    }

    const strongMatches = chromaMatches.filter(
      (item) => item.document && item.document.trim()
    );

    if (!strongMatches.length) {
      return res.json({
        answer:
          "Your query sounds product-related, but there are no usable product details in the database for this search. Please try another product, brand, or category.",
        sources: [],
      });
    }

    let filteredSources = strongMatches;

    // category filter from router
    if (detectedCategory) {
      const categoryMatches = strongMatches.filter((item) => {
        const metadataCategory = (item.metadata?.category || "").toLowerCase();
        return metadataCategory === detectedCategory.toLowerCase();
      });

      if (!categoryMatches.length) {
        return res.json({
          answer: `I looked for products in the "${detectedCategory}" category for your query, but there are no matching items in our catalog right now.`,
          sources: [],
        });
      }

      filteredSources = categoryMatches;
    } else {
      filteredSources = strongMatches.slice(0, 6);
    }

    // apply constraints
    let constrainedSources = applyConstraintsToSources(filteredSources, constraints);

    // CHEAPEST / BETTER OPTIONS logic:
    if (wantsCheaper || isOptionsFollowup) {
      if (constrainedSources.length === 1) {
        const only = constrainedSources[0];
        const name = only.metadata?.name || "this product";
        const price = getNumericPrice(only.metadata || {}) || "the current price";

        return res.json({
          answer: `I understand you’re looking for a better or cheaper option. Right now, ${name} at ₹${price} is the only matching option in our catalog for this request, so I don’t have another alternative to show you. You can keep this one in mind or check back later when we have more options.`,
          sources: [],
        });
      }

      if (constrainedSources.length > 1 && wantsCheaper) {
        let cheapest = null;
        let cheapestPrice = Infinity;
        for (const item of constrainedSources) {
          const p = getNumericPrice(item.metadata || {});
          if (p != null && p < cheapestPrice) {
            cheapestPrice = p;
            cheapest = item;
          }
        }
        if (cheapest) {
          constrainedSources = [cheapest];
        } else {
          constrainedSources = constrainedSources.slice(0, 3);
        }
      }
    }

    // If nothing matches constraints, hard "no match"
    if (!constrainedSources.length) {
      if (constraints.requiredKeyword) {
        return res.json({
          answer: `I tried to find "${constraints.requiredKeyword}" in our catalog, but there are no matching products right now.`,
          sources: [],
        });
      }

      if (constraints.wantsSlippers && detectedCategory === "Fashion") {
        if (constraints.maxPrice != null) {
          return res.json({
            answer: `I tried to find slippers in our fashion catalog within your budget of ₹${constraints.maxPrice}, but there are no matching products right now.`,
            sources: [],
          });
        }
        return res.json({
          answer:
            "I looked for slippers in our fashion catalog, but there are no matching products in the current database.",
          sources: [],
        });
      }

      if (constraints.maxPrice != null && detectedCategory) {
        return res.json({
          answer: `I looked for ${detectedCategory.toLowerCase()} within your budget of ₹${constraints.maxPrice}, but there are no matching products right now.`,
          sources: [],
        });
      }

      return res.json({
        answer:
          "I searched our product catalog for your request, but couldn’t find any products that match those conditions.",
        sources: [],
      });
    }

    // SPECIAL: "topmost / costliest" → pick ONLY the highest-priced product here
    if (limitToOne) {
      let best = null;
      let bestPrice = -Infinity;
      for (const item of constrainedSources) {
        const metadata = item.metadata || {};
        const price = getNumericPrice(metadata);
        if (price != null && price > bestPrice) {
          bestPrice = price;
          best = item;
        }
      }
      if (!best) {
        best = constrainedSources[0];
      }
      filteredSources = [best];
    } else {
      filteredSources = constrainedSources.slice(0, 6);
    }

    // Handle "any other?" when only one product remains (already covered by isOptionsFollowup above)
    // Build context for product-answer LLM
    const contextBlock = filteredSources
      .map((item, index) => {
        const metadata = item.metadata || {};
        return `
Product Source ${index + 1}
ID: ${item.id || "N/A"}
Name: ${metadata.name || "Unknown"}
Brand: ${metadata.brand || "Unknown"}
Category: ${metadata.category || "Unknown"}
Price: ${metadata.price ?? "Unknown"}
Discount Price: ${metadata.discountPrice ?? "Unknown"}
Availability: ${metadata.availabilityCount ?? "Unknown"}
Short Description: ${metadata.shortDescription || "N/A"}
Full Context:
${item.document}
        `.trim();
      })
      .join("\n\n----------------------\n\n");

    const categoryHint = detectedCategory
      ? `The user is asking about ${detectedCategory.toLowerCase()}. Only talk about products from this category in your answer.`
      : "";

    const questionTypeHint = isCount || isListingQuery(trimmedMessage)
      ? "The user is asking how many products are available or wants to list them (count/list query), not for detailed specs."
      : "The user is mainly asking for product suggestions or options.";

    const productCount = filteredSources.length;
    const topPriceHint = limitToOne
      ? "The backend has already pre-selected the highest-priced product for this query, so the single Product Source you see IS the highest-priced product among the retrieved options."
      : "";

    const systemPrompt = `
You are an e-commerce product finder assistant for eKadai.

High-level intent:
- ${questionTypeHint}

Context summary:
- Number of distinct products in the provided context: ${productCount}
- ${topPriceHint}

CRITICAL grounding rules:
1. You can ONLY answer using the provided product database context. Do not use any outside knowledge, even if you "know" popular products like Apple AirPods Pro or iPhone.
2. You must ONLY mention product names and brands that appear EXACTLY in the Name or Brand fields of the Product Source sections. If a product name or brand is not in Product Source, pretend it does not exist and DO NOT mention it.
3. You must NOT claim that a product is "top selling", "bestseller", "most popular", or similar unless the context explicitly states that.
4. If the user asks "how many" or "total" for a category, answer based only on the products in the provided context. Do NOT guess values beyond what you see.

Safety rules:
5. If the user asks for something that cannot be answered from the context (for example coding, generic life advice, or information unrelated to products), reply EXACTLY with: NO_ANSWER
   - NO_ANSWER must be uppercase, with no extra text before or after.
6. Never generate code, tutorials, or other non-product content.

Answer style rules:
7. The UI will show product cards with full details (title, price, image, short description, etc.).
   - Do NOT repeat long spec sheets, price lines, or bullet lists for each product.
   - Do NOT echo the entire "Full Context" of any product.
8. For product queries:
   - Start with 1–2 short sentences recommending the most relevant product(s), for example: "Here’s a laptop I recommend for your needs; the full details are in the card below."
   - Always mention that the matching product(s) are shown below.
9. For count/list queries:
   - Clearly state how many matching products are available in the context.
   - Optionally list their names briefly, then tell the user that the products are shown below.
10. If the user explicitly asks for a "short description", "short desc", or "brief description" of a product:
   - Provide 1–3 concise sentences summarizing what the product is, its main use, and one or two key strengths.
   - Do NOT respond with meta text like "I cannot provide short description"; instead, generate the short description using the provided product details.
11. If the user asks "why should I buy this?" OR asks for "details/specs" again, treat it as a follow-up about the same product(s) and:
   - Explain in 3–5 sentences why it could be a good choice, based ONLY on the given context (features, price, availability, discounts).
   - Point the user to the product card for full details instead of repeating them.

Category rules:
12. ${categoryHint}
13. Only recommend products that match the user's category request. If they ask for laptops, do NOT talk about mobiles, audio, appliances, or fashion.
14. The products you discuss in text must correspond exactly to the Product Source entries in the context.

If you truly cannot answer a question by following all rules above, answer with NO_ANSWER.
    `.trim();

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-3).map((item) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: item.content,
      })),
      {
        role: "user",
        content: `
User question:
${trimmedMessage}

Normalized product query for search:
${searchQueryForChroma}

Product database context:
${contextBlock}
        `.trim(),
      },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0,
      max_tokens: 900,
    });

    const rawAnswer =
      completion?.choices?.[0]?.message?.content ||
      "I could not generate a response.";

    let finalAnswer = rawAnswer.trim();

    // Robust NO_ANSWER handling: if LLM mentions NO_ANSWER anywhere, treat as refusal
    if (finalAnswer === "NO_ANSWER" || finalAnswer.includes("NO_ANSWER")) {
      return res.json({
        answer:
          "I can only answer questions based on our product catalog (features, prices, availability, comparisons). Your last message doesn’t match any products in the current context.",
        sources: [],
      });
    }

    // Build response sources with auto shortDescription
    const sourcesForResponse = await Promise.all(
      filteredSources.map(async (item) => {
        const metadata = item.metadata || {};
        let shortDescription = metadata.shortDescription || "";

        if (!shortDescription) {
          shortDescription = await generateShortDescriptionFromDocument(
            item.document,
            metadata.name
          );
        }

        return {
          id: item.id,
          name: metadata.name || "Unknown Product",
          brand: metadata.brand || "",
          category: metadata.category || "",
          price: metadata.price ?? null,
          discountPrice: metadata.discountPrice ?? null,
          shortDescription,
          imageUrl: metadata.imageUrl || "",
        };
      })
    );

    return res.json({
      answer: finalAnswer,
      // For follow-up detail/spec questions, do NOT resend product cards
      sources: isDetailQuery ? [] : sourcesForResponse,
    });
  } catch (error) {
    console.error("Product finder chatbot error:", error);
    return res.status(500).json({
      message: "Failed to get chatbot response.",
      error: error.message,
    });
  }
});

module.exports = router;