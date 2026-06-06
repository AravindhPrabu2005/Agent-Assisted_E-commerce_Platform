const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Order = require("../models/Order");
const Product = require("../models/Product");
const CartItem = require("../models/CartItem");

const round2 = (num) => Math.round(num * 100) / 100;

router.post("/orders", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { userId, items, customer, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one item is required.",
      });
    }

    if (
      !customer?.fullName ||
      !customer?.phone ||
      !shippingAddress?.addressLine1 ||
      !shippingAddress?.city ||
      !shippingAddress?.state ||
      !shippingAddress?.postalCode
    ) {
      return res.status(400).json({
        message: "Customer and shipping details are required.",
      });
    }

    let createdOrder = null;

    await session.withTransaction(async () => {
      const orderItems = [];
      let subtotal = 0;

      for (const entry of items) {
        if (!entry?.productId || !entry?.quantity || Number(entry.quantity) < 1) {
          throw new Error("Each order item must have valid product and quantity.");
        }

        const product = await Product.findById(entry.productId).session(session);

        if (!product || !product.isActive) {
          throw new Error("One or more products are not available.");
        }

        const qty = Number(entry.quantity);

        if ((product.availabilityCount || 0) < qty) {
          throw new Error(`Requested quantity not available for ${product.name}.`);
        }

        const unitPrice =
          product.discountPrice && product.discountPrice > 0
            ? product.discountPrice
            : product.price;

        const lineTotal = round2(unitPrice * qty);
        subtotal += lineTotal;

        orderItems.push({
          productId: product._id,
          name: product.name,
          imageUrl: product.imageUrl,
          brand: product.brand,
          sku: product.sku,
          unitPrice,
          quantity: qty,
          lineTotal,
        });

        product.availabilityCount -= qty;
        product.orderCount = (product.orderCount || 0) + qty;

        if (product.availabilityCount <= 0) {
          product.availabilityCount = 0;
          product.status = "out_of_stock";
        } else {
          product.status = "published";
        }

        await product.save({ session });
      }

      subtotal = round2(subtotal);
      const gstPercent = 18;
      const gstAmount = round2((subtotal * gstPercent) / 100);
      const shippingCharge = 0;
      const totalAmount = round2(subtotal + gstAmount + shippingCharge);

      const transactionRef = `SIM-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const [order] = await Order.create(
        [
          {
            userId: userId || null,
            items: orderItems,
            pricing: {
              subtotal,
              gstPercent,
              gstAmount,
              shippingCharge,
              totalAmount,
            },
            payment: {
              method: "simulation",
              status: "paid",
              paidAt: new Date(),
              transactionRef,
            },
            orderStatus: "placed",
            customer: {
              fullName: customer.fullName,
              email: customer.email || "",
              phone: customer.phone,
            },
            shippingAddress: {
              addressLine1: shippingAddress.addressLine1,
              addressLine2: shippingAddress.addressLine2 || "",
              city: shippingAddress.city,
              state: shippingAddress.state,
              postalCode: shippingAddress.postalCode,
              country: shippingAddress.country || "India",
            },
          },
        ],
        { session }
      );

      if (userId) {
        await CartItem.deleteMany({ userId }).session(session);
      }

      createdOrder = order;
    });

    return res.status(201).json({
      message: "Order placed successfully.",
      order: createdOrder,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Failed to place order.",
    });
  } finally {
    await session.endSession();
  }
});

router.get("/orders", async (req, res) => {
  try {
    const { userId } = req.query;

    const query = userId ? { userId } : {};
    const orders = await Order.find(query)
      .populate("items.productId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch orders.",
    });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.productId");

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch order.",
    });
  }
});

router.get("/admin/orders/:adminId", async (req, res) => {
  try {
    const { adminId } = req.params;

    const adminProducts = await Product.find({ adminId }).select("_id");
    const productIds = adminProducts.map((product) => product._id.toString());

    const orders = await Order.find({
      "items.productId": { $in: productIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    const filteredOrders = orders.map((order) => {
      const filteredItems = (order.items || []).filter((item) =>
        productIds.includes(String(item.productId?._id || item.productId))
      );

      const recalculatedSubtotal = filteredItems.reduce(
        (sum, item) => sum + Number(item.lineTotal || 0),
        0
      );

      return {
        ...order,
        items: filteredItems,
        pricing: {
          ...order.pricing,
          totalAmount: recalculatedSubtotal,
        },
      };
    });

    res.json({ orders: filteredOrders });
  } catch (error) {
    console.error("Admin orders fetch failed:", error);
    res.status(500).json({ error: "Failed to fetch admin orders." });
  }
});

module.exports = router;