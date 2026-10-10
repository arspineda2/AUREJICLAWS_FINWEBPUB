const mongoose = require("mongoose");

const mediaAssetSchema = new mongoose.Schema({
  contentType: { type: String, required: true, enum: ["image/jpeg", "image/png", "image/webp"] },
  data: { type: Buffer, required: true }
}, { timestamps: true });

module.exports = mongoose.models.MediaAsset || mongoose.model("MediaAsset", mediaAssetSchema);
