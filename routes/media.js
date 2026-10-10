const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const MediaAsset = require("../models/MediaAsset");
const requireAdminAuth = require("../middleware/requireAdminAuth");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(new Error("Upload a JPEG, PNG, or WebP image."));
    }
    callback(null, true);
  }
});

function getImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

function getImageBuffer(data) {
  if (Buffer.isBuffer(data)) return data;
  if (data && typeof data.value === "function") {
    const value = data.value(true);
    return Buffer.isBuffer(value) ? value : null;
  }
  if (data instanceof Uint8Array) return Buffer.from(data);
  return null;
}

router.post("/", requireAdminAuth, (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) return res.status(400).json({ success: false, message: error.message });
    next();
  });
}, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Image storage is unavailable because MongoDB is disconnected." });
    }
    if (!req.file) return res.status(400).json({ success: false, message: "Choose an image to upload." });
    const contentType = getImageType(req.file.buffer);
    if (!contentType) return res.status(400).json({ success: false, message: "The uploaded file is not a valid JPEG, PNG, or WebP image." });

    const asset = await MediaAsset.create({ contentType, data: req.file.buffer });
    return res.status(201).json({ success: true, url: `/api/media/${asset.id}` });
  } catch (error) {
    console.error("Admin image upload failed:", error);
    return res.status(500).json({ success: false, message: "Failed to save the image." });
  }
});

router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).send("Image not found.");
  try {
    const asset = await MediaAsset.findById(req.params.id).select("contentType data").lean();
    if (!asset) return res.status(404).send("Image not found.");
    const image = getImageBuffer(asset.data);
    if (!image) {
      console.error(`Image ${req.params.id} has an unsupported stored data format.`);
      return res.status(500).send("Image could not be loaded.");
    }
    res.set("Content-Type", asset.contentType);
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(image);
  } catch (error) {
    console.error("Image retrieval failed:", error);
    return res.status(500).send("Image could not be loaded.");
  }
});

module.exports = router;
