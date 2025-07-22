const ContactRequest = require("../models/ContactRequest");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const ActivityLog = require("../models/ActivityLog");
const { authorize } = require("../middleware/auth");
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const VALID_STATUSES = [
  "pending",
  "accepted",
  "completed",
  "disputed",
  "expired",
  "rejected",
];

const MAX_REQUESTS = { user: 2, vendor: 5 };

exports.createRequestLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hrs
  max: (req) => MAX_REQUESTS[req.user?.role] || 2,
  message: {
    message:
      "You have reached your daily contact request limit. Please try again tomorrow.",
  },
  keyGenerator: (req) => req.user._id.toString(),
});

// Helper: get today's date as YYYY-MM-DD
function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

// Helper to log activity
async function logActivity({ user, action, resource, resourceId, meta, ip }) {
  await ActivityLog.create({
    user,
    action,
    resource,
    resourceId,
    meta,
    ip,
  });
}

// Check if a pending contact request exists
exports.checkRequestStatus = async (req, res) => {
  try {
    const { farmerId, productId } = req.params;
    if (
      !mongoose.Types.ObjectId.isValid(farmerId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    const query = {
      requesterId: req.user._id,
      farmerId,
      productId,
      status: "pending",
    };
    const existingRequest = await ContactRequest.findOne(query)
      .select("_id")
      .lean();
    res.json({ exists: !!existingRequest });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Create a new contact request
exports.createContactRequest = async (req, res) => {
  if (await hasUnresolvedAcceptedRequests(req.user._id)) {
    return res.status(429).json({
      message:
        "You have unresolved accepted requests older than 2 days. Complete them before making new requests.",
    });
  }
  try {
    const { productId, requestedQuantity } = req.body;
    const requesterId = req.user._id;
    const requesterRole = req.user.role;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }
    if (
      !requestedQuantity ||
      typeof requestedQuantity !== "number" ||
      requestedQuantity < 1
    ) {
      return res.status(400).json({ message: "Invalid requested quantity" });
    }
    // Get product and validate minimumOrderQuantity
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (requestedQuantity < (product.minimumOrderQuantity || 1)) {
      return res.status(400).json({
        message: `Requested quantity must be at least the minimum order quantity (${
          product.minimumOrderQuantity || 1
        })`,
      });
    }
    const farmerId = product.farmer;
    if (farmerId.equals(requesterId)) {
      return res
        .status(400)
        .json({ message: "Cannot request your own contact" });
    }
    // Daily rate limit check
    const today = getTodayString();
    const startOfDay = new Date(today + "T00:00:00.000Z");
    const endOfDay = new Date(today + "T23:59:59.999Z");
    const dailyCount = await ContactRequest.countDocuments({
      requesterId,
      requestedAt: { $gte: startOfDay, $lte: endOfDay },
      status: "pending",
    });
    if (dailyCount >= MAX_REQUESTS[requesterRole]) {
      return res.status(429).json({
        message: `You have reached your daily contact request limit (${MAX_REQUESTS[requesterRole]} requests). Please try again tomorrow.`,
      });
    }
    // Existing pending request check
    const existingRequest = await ContactRequest.findOne({
      requesterId,
      farmerId,
      productId,
      status: "pending",
    }).lean();
    if (existingRequest) {
      return res.status(409).json({
        message: "Pending request already exists for this farmer and product",
        existingRequestId: existingRequest._id,
      });
    }
    // Create new request
    const newRequest = await ContactRequest.create({
      productId,
      farmerId,
      requesterId,
      requesterRole,
      requestedQuantity,
      status: "pending",
      requestedAt: new Date(),
    });
    res.status(201).json({
      _id: newRequest._id,
      farmerId: newRequest.farmerId,
      productId: newRequest.productId,
      status: newRequest.status,
      requestedQuantity: newRequest.requestedQuantity,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Farmer accepts a contact request
exports.acceptContactRequest = async (req, res) => {
  if (await farmerHasUnresolvedAcceptedRequests(req.user._id)) {
    return res.status(429).json({
      message:
        "You have unresolved accepted requests older than 2 days. Complete them before accepting new requests.",
    });
  }
  try {
    const { id: requestId } = req.params;
    const farmerId = req.user._id;
    const request = await ContactRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.farmerId) !== String(farmerId)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (request.status !== "pending") {
      return res.status(409).json({ message: "Request already processed" });
    }
    request.status = "accepted";
    request.acceptedAt = new Date();
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Farmer rejects a contact request
exports.rejectContactRequest = async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const farmerId = req.user._id;
    const request = await ContactRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.farmerId) !== String(farmerId)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (request.status !== "pending") {
      return res.status(409).json({ message: "Request already processed" });
    }
    request.status = "rejected";
    request.rejectedAt = new Date();
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all requests for a user (sent or received)
exports.getMyContactRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    // Sent requests (as user or vendor)
    const sent = await ContactRequest.find({ requesterId: userId })
      .populate({
        path: "productId",
        select:
          "name price unit availableQuantity minimumOrderQuantity location",
      })
      .populate({
        path: "farmerId",
        select: "name email phone role address",
      })
      .sort({ requestedAt: -1 });
    // Received requests (as farmer)
    const received = await ContactRequest.find({ farmerId: userId })
      .populate({
        path: "productId",
        select:
          "name price unit availableQuantity minimumOrderQuantity location",
      })
      .populate({
        path: "requesterId",
        select: "name email phone role address",
      })
      .sort({ requestedAt: -1 });
    res.json({ sent, received });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Confirmation endpoints
exports.userConfirm = async (req, res) => {
  try {
    const { id } = req.params;
    const { didBuy, finalQuantity, finalPrice, feedback } = req.body;
    const userId = req.user._id;
    const request = await ContactRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.requesterId) !== String(userId))
      return res.status(403).json({ message: "Not authorized" });
    if (request.userConfirmed)
      return res.status(409).json({ message: "Already confirmed" });
    request.userConfirmed = true;
    request.userConfirmationAt = new Date();
    request.finalQuantity = finalQuantity;
    request.finalPrice = finalPrice;
    request.userFeedback = feedback;
    if (didBuy === false) {
      request.status = "not_completed";
      request.confirmationStatus = "not_completed";
    }
    await request.save();
    await logActivity({
      user: userId,
      action: "user_confirm",
      resource: "ContactRequest",
      resourceId: id,
      meta: { didBuy, finalQuantity, finalPrice, feedback },
      ip: req.ip,
    });
    // Check for both confirmations
    if (request.userConfirmed && request.farmerConfirmed) {
      if (request.status !== "not_completed") {
        if (
          request.finalQuantity === request.farmerFinalQuantity &&
          request.finalPrice === request.farmerFinalPrice
        ) {
          request.status = "completed";
          request.confirmationStatus = "completed";
        } else {
          request.status = "disputed";
          request.confirmationStatus = "disputed";
        }
        await request.save();
      }
    }
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.farmerConfirm = async (req, res) => {
  try {
    const { id } = req.params;
    const { didSell, finalQuantity, finalPrice, feedback } = req.body;
    const farmerId = req.user._id;
    const request = await ContactRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.farmerId) !== String(farmerId))
      return res.status(403).json({ message: "Not authorized" });
    if (request.farmerConfirmed)
      return res.status(409).json({ message: "Already confirmed" });
    request.farmerConfirmed = true;
    request.farmerConfirmationAt = new Date();
    request.farmerFinalQuantity = finalQuantity;
    request.farmerFinalPrice = finalPrice;
    request.farmerFeedback = feedback;
    if (didSell === false) {
      request.status = "not_completed";
      request.confirmationStatus = "not_completed";
    }
    await request.save();
    await logActivity({
      user: farmerId,
      action: "farmer_confirm",
      resource: "ContactRequest",
      resourceId: id,
      meta: { didSell, finalQuantity, finalPrice, feedback },
      ip: req.ip,
    });
    // Check for both confirmations
    if (request.userConfirmed && request.farmerConfirmed) {
      if (request.status !== "not_completed") {
        if (
          request.finalQuantity === request.farmerFinalQuantity &&
          request.finalPrice === request.farmerFinalPrice
        ) {
          request.status = "completed";
          request.confirmationStatus = "completed";
        } else {
          request.status = "disputed";
          request.confirmationStatus = "disputed";
        }
        await request.save();
      }
    }
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Blocking logic for user (before creating a new request)
async function hasUnresolvedAcceptedRequests(userId) {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const count = await ContactRequest.countDocuments({
    requesterId: userId,
    status: "accepted",
    acceptedAt: { $lt: twoDaysAgo },
    confirmationStatus: "pending",
  });
  return count > 0;
}

// Blocking logic for farmer (before accepting a new request)
async function farmerHasUnresolvedAcceptedRequests(farmerId) {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const count = await ContactRequest.countDocuments({
    farmerId,
    status: "accepted",
    acceptedAt: { $lt: twoDaysAgo },
    confirmationStatus: "pending",
  });
  return count > 0;
}

// Expiry logic: scheduled job
exports.expireOldRequests = async function () {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const expired = await ContactRequest.updateMany(
    {
      status: "accepted",
      acceptedAt: { $lt: twoDaysAgo },
      confirmationStatus: "pending",
    },
    {
      status: "expired",
      confirmationStatus: "expired",
    }
  );
  // Log each expired request
  const expiredRequests = await ContactRequest.find({
    status: "expired",
    acceptedAt: { $lt: twoDaysAgo },
  });
  for (const req of expiredRequests) {
    await logActivity({
      user: req.requesterId,
      action: "expired",
      resource: "ContactRequest",
      resourceId: req._id,
      meta: {},
      ip: null,
    });
  }
  return expired;
};

// Admin dispute tools
exports.getDisputes = [
  authorize("admin"),
  async (req, res) => {
    try {
      const disputes = await ContactRequest.find({ status: "disputed" })
        .populate("productId")
        .populate("farmerId")
        .populate("requesterId");
      res.json(disputes);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
];

exports.adminResolveDispute = [
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { finalStatus, adminNote } = req.body;
      const adminId = req.user._id;
      const request = await ContactRequest.findById(id);
      if (!request)
        return res.status(404).json({ message: "Request not found" });
      if (request.status !== "disputed")
        return res.status(409).json({ message: "Not a disputed request" });
      request.status = finalStatus;
      request.confirmationStatus = finalStatus;
      request.adminNote = adminNote;
      await request.save();
      await logActivity({
        user: adminId,
        action: "admin_resolve_dispute",
        resource: "ContactRequest",
        resourceId: id,
        meta: { finalStatus, adminNote },
        ip: req.ip,
      });
      res.json(request);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
];

// Get all contact requests (admin only)
exports.getAllContactRequests = [
  require("../middleware/auth").authorize("admin"),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const query = {};

      // Status filter
      if (typeof status === "string" && VALID_STATUSES.includes(status)) {
        query.status = status;
      }

      // Search filter
      if (
        typeof search === "string" &&
        search.length > 0 &&
        search.length < 100
      ) {
        const safeSearch = escapeRegex(search);
        query.$or = [
          { requesterName: { $regex: safeSearch, $options: "i" } },
          { farmerName: { $regex: safeSearch, $options: "i" } },
        ];
      }
      // Do NOT return 400 for empty/undefined/null

      // Pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

      const requests = await ContactRequest.find(query)
        .populate("productId")
        .populate("farmerId")
        .populate("requesterId")
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ requestedAt: -1 });
      const total = await ContactRequest.countDocuments(query);
      res.json({ requests, total, page: pageNum, limit: limitNum });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
];
