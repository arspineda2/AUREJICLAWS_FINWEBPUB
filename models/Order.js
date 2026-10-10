/* Defines what an order looks like in MongoDB: customer details,
purchased items, total, payment proof, and status. */
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customer: {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    contactNo: { type: String, required: true, trim: true, maxlength: 40 },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    consentGiven: { type: Boolean, required: true }
  },
  items: {
    type: [{
      productId: { type: String, required: true },
      productName: { type: String, required: true },
      unitPrice: { type: Number, required: true, min: 0 },
      quantity: { type: Number, required: true, min: 1, max: 10 }
    }],
    required: true,
    validate: {
      validator: (items) => items.length > 0,
      message: "An order must contain at least one item."
    }
  },
  totalAmount: { type: Number, required: true, min: 0 },
  payment: {
    method: { type: String, required: true, enum: ["GCash"] },
    referenceNumber: { type: String, required: true, trim: true, maxlength: 100 },
    dateSent: { type: String, required: true },
    timeSent: { type: String, required: true },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    proof: {
      contentType: { type: String, required: true },
      data: { type: Buffer, required: true }
    }
  },

  isDeleted: { type: Boolean, default: false },
  
  status: {
    type: String,
    enum: ["Pending Review", "Approved", "Rejected"],
    default: "Pending Review"
  }
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
