/* Defines what happens when the app receives an order request: 
reads the submitted form and screenshot, validates the data and products, calculates the total, 
then calls the model to save the order. */
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const Order = require("../models/Order");

const router = express.Router();

// Keep the uploaded image in memory until the order is saved; never write receipts
// into public/ where static hosting could expose customer payment information.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024,
    files: 1,
    fields: 12,
    fieldSize: 10 * 1024
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Upload a JPEG, PNG, or WebP payment screenshot."));
    }
    callback(null, true);
  }
});

// Product prices and availability come from the server, not browser-submitted values.
const products = {
  "presson-one": { name: "Amethyst Fang", price: 1000, available: true },
  "presson-two": { name: "Starlit Nails", price: 500, available: true },
  "presson-three": { name: "Deep Sea", price: 600, available: true },
  "presson-four": { name: "Lush Green By Ersa", price: 1000, available: false },
  "presson-five": { name: "Mocha Muse", price: 500, available: true },
  "presson-six": { name: "Cat Eye Nails", price: 400, available: true }
};

function uploadPaymentProof(req, res, next) {
  upload.single("proofUpload")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next();
  });
}

function imageContentType(file) {
  const bytes = file.buffer;
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8
    && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = bytes.length >= 12
    && bytes.toString("ascii", 0, 4) === "RIFF"
    && bytes.toString("ascii", 8, 12) === "WEBP";
  if (isJpeg) return "image/jpeg";
  if (isPng) return "image/png";
  if (isWebp) return "image/webp";
  return null;
}

// The frontend sends customer/payment fields, product IDs/quantities, and one screenshot.
router.post("/place-order", uploadPaymentProof, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, error: "The order database is unavailable. Please try again later." });
    }

    const {
      fullName, email, contactNo, address, notes1, consent,
      items, paymentMethod, refNumber, dateSent, timeSent, notes2
    } = req.body;
    const requiredFields = [fullName, email, contactNo, address, paymentMethod, refNumber, dateSent, timeSent];
    if (requiredFields.some((value) => typeof value !== "string" || !value.trim())) {
      return res.status(400).json({ success: false, error: "Complete all required customer and payment fields." });
    }
    if (consent !== "true") {
      return res.status(400).json({ success: false, error: "Consent is required to process the order." });
    }
    if ([notes1, notes2].some((value) => value !== undefined && typeof value !== "string")) {
      return res.status(400).json({ success: false, error: "Optional notes must be plain text." });
    }
    if (fullName.length > 120 || email.length > 254 || contactNo.length > 40
      || address.length > 500 || (notes1 || "").length > 1000
      || refNumber.length > 100 || (notes2 || "").length > 1000) {
      return res.status(400).json({ success: false, error: "One or more fields exceed the allowed length." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, error: "Enter a valid email address." });
    }
    if (!["GCash", "Maya", "Bank Transfer"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, error: "Choose a supported payment method." });
    }
    const parsedDate = new Date(`${dateSent}T00:00:00.000Z`);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(dateSent)
      && !Number.isNaN(parsedDate.getTime())
      && parsedDate.toISOString().slice(0, 10) === dateSent;
    if (!validDate || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeSent)) {
      return res.status(400).json({ success: false, error: "Enter a valid payment date and time." });
    }
    const verifiedContentType = req.file && imageContentType(req.file);
    if (!req.file || !verifiedContentType || verifiedContentType !== req.file.mimetype) {
      return res.status(400).json({ success: false, error: "Attach a valid JPEG, PNG, or WebP payment screenshot." });
    }

    let requestedItems;
    try {
      requestedItems = JSON.parse(items);
    } catch {
      return res.status(400).json({ success: false, error: "The order items could not be read." });
    }
    if (!Array.isArray(requestedItems) || requestedItems.length < 1 || requestedItems.length > 10) {
      return res.status(400).json({ success: false, error: "An order must contain between 1 and 10 products." });
    }

    const orderItems = [];
    for (const item of requestedItems) {
      if (!item || typeof item.productId !== "string") {
        return res.status(400).json({ success: false, error: "An order item is invalid." });
      }
      const product = products[item.productId];
      if (!product || !product.available) {
        return res.status(400).json({ success: false, error: "An item is unavailable. Refresh the page and try again." });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
        return res.status(400).json({ success: false, error: "Product quantities must be between 1 and 10." });
      }
      orderItems.push({
        productId: item.productId,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity
      });
    }

    const totalAmount = orderItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
    const order = await Order.create({
      customer: {
        fullName,
        email,
        contactNo,
        address,
        notes: notes1,
        consentGiven: true
      },
      items: orderItems,
      totalAmount,
      payment: {
        method: paymentMethod,
        referenceNumber: refNumber,
        dateSent,
        timeSent,
        notes: notes2,
        proof: {
          contentType: verifiedContentType,
          data: req.file.buffer
        }
      }
    });

    res.status(201).json({
      success: true,
      orderId: order.id,
      totalAmount: order.totalAmount,
      status: order.status
    });
  } catch (error) {
    console.error("Order save failed:", error.name);
    res.status(500).json({ success: false, error: "The order could not be saved. Please try again." });
  }
});

module.exports = router;