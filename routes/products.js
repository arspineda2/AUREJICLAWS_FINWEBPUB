const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const requireAdminAuth = require("../middleware/requireAdminAuth");

const router = express.Router();
const initialProducts = [
  { productId: "presson-one", productName: "Amethyst Fang", price: 1000, stocks: 100, soldOut: false, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.", imageUrl: "photos/presson-one.png" },
  { productId: "presson-two", productName: "Starlit Nails", price: 500, stocks: 100, soldOut: false, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.", imageUrl: "photos/presson-two.png" },
  { productId: "presson-three", productName: "Deep Sea", price: 600, stocks: 100, soldOut: false, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.", imageUrl: "photos/presson-three.png" },
  { productId: "presson-four", productName: "Lush Green By Ersa", price: 1000, stocks: 0, soldOut: true, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.", imageUrl: "photos/presson-four.png" },
  { productId: "presson-five", productName: "Mocha Muse", price: 500, stocks: 100, soldOut: false, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.", imageUrl: "photos/presson-five.png" },
  { productId: "presson-six", productName: "Cat Eye Nails", price: 400, stocks: 100, soldOut: false, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.", imageUrl: "photos/presson-six.png" }
];

async function ensureInitialProducts() {
  if (await Product.exists()) return;
  await Product.bulkWrite(initialProducts.map((product) => ({
    updateOne: {
      filter: { productId: product.productId },
      update: { $setOnInsert: product },
      upsert: true
    }
  })));
}

function serializeProduct(product) {
  const stocks = Number.isInteger(product.stocks) ? product.stocks : 0;
  return {
    productId: product.productId,
    productName: product.productName,
    price: product.price,
    stocks,
    soldOut: Boolean(product.soldOut) || stocks < 1,
    description: product.description || "",
    imageUrl: product.imageUrl || `photos/${product.productId}.png`
  };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Product catalog is unavailable because MongoDB is disconnected." });
    }
    await ensureInitialProducts();
    const products = await Product.find().sort({ createdAt: 1, productId: 1 }).lean();
    return res.json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    console.error("Product catalog load failed:", error);
    return res.status(500).json({ success: false, message: "Failed to load products." });
  }
});

router.put("/:productId", requireAdminAuth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Product catalog is unavailable because MongoDB is disconnected." });
    }
    if (!isRecord(req.body)) {
      return res.status(400).json({ success: false, message: "Enter valid product details." });
    }
    const { productName, price, stocks, soldOut, description, imageUrl } = req.body;
    const cleanProductId = req.params.productId.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,80}$/.test(cleanProductId)
      || typeof productName !== "string" || !productName.trim() || productName.trim().length > 100
      || !Number.isFinite(price) || price < 0
      || !Number.isInteger(stocks) || stocks < 0
      || typeof soldOut !== "boolean" || (!soldOut && stocks === 0)
      || typeof description !== "string" || !description.trim() || description.trim().length > 1000
      || typeof imageUrl !== "string" || imageUrl.length > 500
      || !(/^\/api\/media\/[a-f\d]{24}$/i.test(imageUrl)
        || (/^photos\/[a-z\d._/-]+$/i.test(imageUrl) && !imageUrl.includes("..")))) {
      return res.status(400).json({ success: false, message: "Enter a valid name, price, stock count, description, and image." });
    }

    const product = await Product.findOneAndUpdate(
      { productId: cleanProductId },
      {
        $set: {
          productName: productName.trim(),
          price,
          stocks,
          soldOut,
          description: description.trim(),
          imageUrl: imageUrl.trim()
        },
        $setOnInsert: { productId: cleanProductId }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, product: serializeProduct(product) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "That product ID is already in use." });
    console.error("Product save failed:", error);
    return res.status(500).json({ success: false, message: "Failed to save product." });
  }
});

router.delete("/:productId", requireAdminAuth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Product catalog is unavailable because MongoDB is disconnected." });
    }
    const result = await Product.deleteOne({ productId: req.params.productId });
    if (!result.deletedCount) return res.status(404).json({ success: false, message: "Product not found." });
    return res.json({ success: true });
  } catch (error) {
    console.error("Product delete failed:", error);
    return res.status(500).json({ success: false, message: "Failed to delete product." });
  }
});

module.exports = router;
