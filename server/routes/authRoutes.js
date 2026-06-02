const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Admin = require("../models/Admin");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const generateToken = (user, isAdmin = false) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      isAdmin,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

// User Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password || !phone || !address) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });

    if (existingUser || existingAdmin) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
    });

    await user.save();

    return res.json({ message: "User registered successfully" });
  } catch (error) {
    console.error("User register error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Admin Register
router.post("/admin/register", async (req, res) => {
  try {
    const { name, email, password, phone, address, companyName, gstNo } = req.body;

    if (!name || !email || !password || !phone || !address || !companyName || !gstNo) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingAdmin = await Admin.findOne({ email });
    const existingUser = await User.findOne({ email });

    if (existingAdmin || existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      companyName,
      gstNo,
    });

    await admin.save();

    return res.json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error("Admin register error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Login User or Admin
// Login User or Admin
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user, false);

      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          role: "user",
          isAdmin: false,
          isLoggedIn: true,
          email: user.email,
          name: user.name,
        },
      });
    }

    const admin = await Admin.findOne({ email });
    if (admin && (await bcrypt.compare(password, admin.password))) {
      const token = generateToken(admin, true);

      return res.json({
        success: true,
        token,
        user: {
          id: admin._id,
          role: "admin",
          isAdmin: true,
          isLoggedIn: true,
          email: admin.email,
          name: admin.name,
          companyName: admin.companyName,
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// Protected Route
router.get("/protected", authMiddleware, (req, res) => {
  return res.json({
    message: "Protected data",
    user: req.user,
  });
});

module.exports = router;