// controllers/adminController.js
const User = require("../models/User");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");
const { logAdminAction } = require("../utils/adminAudit");
const { adminSchemas } = require("../utils/validation");
const AdminActionLog = require("../models/AdminActionLog");
const mongoose = require("mongoose");
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const { signJwt } = require("../utils/jwt");

const VALID_ROLES = ["user", "farmer", "vendor", "admin"];
const VALID_STATUSES = [
  "pending",
  "accepted",
  "completed",
  "disputed",
  "expired",
  "rejected",
];

// List all users (admin only) with pagination, filtering, and search
async function getAllUsers(req, res) {
  const { page = 1, limit = 20, search, role } = req.query;
  const query = {};
  if (typeof role === "string" && VALID_ROLES.includes(role)) query.role = role;
  if (typeof search === "string" && search.length > 0 && search.length < 100) {
    const safeSearch = escapeRegex(search);
    query.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { username: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
      { phone: { $regex: safeSearch, $options: "i" } },
    ];
  } else if (typeof search !== "undefined" && search !== null) {
    return res.status(400).json({ message: "Invalid search parameter" });
  }
  const users = await User.find(query)
    .select("-password")
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await User.countDocuments(query);
  res.json({ users, total, page: Number(page), limit: Number(limit) });
}

// List all products (admin only) with pagination, filtering, and search
async function getAllProducts(req, res) {
  const { page = 1, limit = 20, search, farmer } = req.query;
  const query = {};
  if (typeof farmer === "string" && mongoose.Types.ObjectId.isValid(farmer))
    query.farmer = farmer;
  if (typeof search === "string" && search.length > 0 && search.length < 100) {
    const safeSearch = escapeRegex(search);
    query.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
    ];
  } else if (typeof search !== "undefined" && search !== null) {
    return res.status(400).json({ message: "Invalid search parameter" });
  }
  const products = await Product.find(query)
    .populate("farmer", "name email")
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await Product.countDocuments(query);
  res.json({ products, total, page: Number(page), limit: Number(limit) });
}

// Change user role (admin only) with validation and audit logging
async function changeUserRole(req, res) {
  const { userId, role } = req.body;
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId" });
  }
  if (userId === req.user._id.toString() && role !== "admin") {
    return res.status(400).json({ message: "Admins cannot demote themselves" });
  }
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  await logAdminAction({
    admin: req.user._id,
    action: "role_change",
    target: userId,
    details: { newRole: role },
  });
  res.json(user);
}

// Admin login by username with validation and audit logging
async function adminLogin(req, res) {
  try {
    const { username, password, deviceFingerprint } = req.body;
    // Validation is handled by middleware
    const user = await User.findOne({
      username: { $eq: username },
      role: "admin",
    });
    if (!user) {
      await logAdminAction({
        admin: null,
        action: "login_failed",
        details: { username, reason: "User not found or not admin" },
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAdminAction({
        admin: user._id,
        action: "login_failed",
        details: { username, reason: "Invalid password" },
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!user.deviceFingerprint) {
      user.deviceFingerprint = deviceFingerprint;
      await user.save();
    } else if (user.deviceFingerprint !== deviceFingerprint) {
      await logAdminAction({
        admin: user._id,
        action: "login_failed",
        details: { username, reason: "Device not recognized" },
      });
      return res
        .status(403)
        .json({ message: "Access denied: device not recognized" });
    }
    const token = signJwt(
      { userId: user._id, tokenVersion: user.tokenVersion },
      process.env.JWT_SECRET,
      "7d"
    );
    await logAdminAction({
      admin: user._id,
      action: "login_success",
      details: { username },
    });
    user.lastAdminLogin = new Date();
    await user.save();
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
}

// Get recent admin logs (admin only)
async function getAdminLogs(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const logs = await AdminActionLog.find()
    .populate("admin", "username name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await AdminActionLog.countDocuments();
  res.json({ logs, total, page: Number(page), limit: Number(limit) });
}

// Get admin settings (stub)
async function getAdminSettings(req, res) {
  // Placeholder: return static settings for now
  res.json({
    maintenanceMode: false,
    allowNewAdmins: true,
    passwordPolicy: "strong",
  });
}

// Update admin notes for a user (admin only)
async function updateAdminNotes(req, res) {
  const { userId, adminNotes } = req.body;
if (!mongoose.Types.ObjectId.isValid(userId)) {
  return res.status(400).json({ message: 'Invalid userId' });
}
const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  user.adminNotes = adminNotes;
  await user.save();
  await logAdminAction({
    admin: req.user._id,
    action: "update_admin_notes",
    target: userId,
    details: { adminNotes },
  });
  res.json({ message: "Admin notes updated", userId });
}

module.exports = {
  getAllUsers,
  getAllProducts,
  changeUserRole,
  adminLogin,
  getAdminLogs,
  getAdminSettings,
  updateAdminNotes,
};
