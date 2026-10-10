/*
 * Booking workflow:
 * 1. The public booking endpoint validates the submitted customer, service,
 *    and requested schedule, then creates a Booking document.
 * 2. New bookings start as Pending so the business can review availability.
 * 3. Staff can update the status as the appointment is confirmed, completed,
 *    or cancelled; remarks can record relevant scheduling notes.
 * 4. Mongoose applies the field rules below and adds createdAt/updatedAt.
 */
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  // Contact details let the business identify and follow up with the customer.
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  contact: { type: String, required: true, trim: true, maxlength: 40 },
  
  // serviceId is the stable service reference; serviceType keeps its display
  // name on the booking even if the service catalog is renamed later.
  serviceId: { type: String, required: true }, 
  serviceType: { type: String, required: true, trim: true, maxlength: 100 },
  
  // Store the requested date and time in consistent YYYY-MM-DD and HH:MM
  // formats so API validation and availability checks can use them.
  dateSchedule: { 
    type: String, 
    required: true,
    validate: {
      validator: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
      message: "Date must use YYYY-MM-DD format."
    }
  },
  // Change timeSlot validation to a flexible string so ranges like "10:00 AM - 1:30 PM" work smoothly
  timeSlot: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 50
  },

  isDeleted: { type: Boolean, default: false },
  
  // The default is awaiting staff review; status changes should be made
  // through an authorized management workflow.
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
    default: "Pending"
  },
  // Optional internal/customer-facing scheduling context.
  remarks: { type: String, trim: true, maxlength: 1000, default: "" }
}, { timestamps: true });

// Register the schema as the Booking model used by Mongoose database queries.
module.exports = mongoose.model("Booking", bookingSchema);