/*
 * Product workflow:
 * Products are edited through the authenticated catalog API and rendered by
 * both the public shop and the checkout API.
 */
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  // Stable identifier used by the shop and order items; must be unique.
  productId: { type: String, required: true, unique: true, trim: true },
  productName: { type: String, required: true, trim: true, maxlength: 100 },
  price: { type: Number, required: true, min: 0 },
  stocks: { type: Number, required: true, min: 0, default: 0 },
  soldOut: { type: Boolean, default: false },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  imageUrl: { type: String, required: true, trim: true, maxlength: 500 }
}, { timestamps: true });

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);