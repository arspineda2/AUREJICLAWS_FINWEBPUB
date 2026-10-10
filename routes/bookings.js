const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const transporter = require("../config/email");
const requireAdminAuth = require("../middleware/requireAdminAuth");

const router = express.Router();

// 1. PUBLIC ROUTE: Customer submits an appointment booking
router.post('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Booking service is unavailable because MongoDB is disconnected. Please try again later."
      });
    }

    const { name, email, contact, serviceId, serviceType, dateSchedule, timeSlot, remarks } = req.body;

    if (!name || !email || !contact || !serviceId || !serviceType || !dateSchedule || !timeSlot) {
      return res.status(400).json({ success: false, message: "Missing required booking details." });
    }

    const newBooking = new Booking({
      name,
      email,
      contact,
      serviceId,
      serviceType,
      dateSchedule,
      timeSlot,
      remarks: remarks || ""
    });

    await newBooking.save();
    console.info(`Booking ${newBooking.id} saved to ${mongoose.connection.name}.${Booking.collection.collectionName}.`);
    return res.status(201).json({ 
      success: true, 
      message: "Appointment booked successfully! We await staff review.",
      bookingId: newBooking._id 
    });

  } catch (error) {
    console.error("Booking creation error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create booking." });
  }
});

// 2. ADMIN ROUTE: List all bookings for dashboard management
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    return res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error loading bookings:", error);
    return res.status(500).json({ success: false, message: "Failed to load system bookings." });
  }
});

// 3. ADMIN ROUTE: Update booking status (Pending, Confirmed, Completed, Cancelled)
router.post('/status/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Confirmed", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status === status) {
      return res.json({
        success: true,
        notificationSent: null,
        message: `Booking is already marked as ${status}.`
      });
    }

    booking.status = status;
    await booking.save();

    const shouldNotifyCustomer = status === "Confirmed" || status === "Cancelled";
    if (!shouldNotifyCustomer) {
      return res.json({
        success: true,
        notificationSent: null,
        message: `Booking status updated to ${status}.`
      });
    }

    const isConfirmed = status === "Confirmed";
    let notificationSent = true;
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: booking.email,
        subject: isConfirmed
          ? "Your Aureji Claws booking is confirmed"
          : "Update to your Aureji Claws booking",
        text: [
          `Hi ${booking.name},`,
          "",
          isConfirmed
            ? "Your appointment booking has been confirmed."
            : "We’re sorry, but your appointment booking has been cancelled.",
          "",
          `Service: ${booking.serviceType}`,
          `Date: ${booking.dateSchedule}`,
          `Time: ${booking.timeSlot}`,
          "",
          "If you have questions, please contact Aureji Claws."
        ].join("\n")
      });
    } catch (emailError) {
      notificationSent = false;
      console.error(`Booking ${status.toLowerCase()} email failed:`, emailError);
    }

    return res.json({
      success: true,
      notificationSent,
      message: notificationSent
        ? `Booking marked as ${status.toLowerCase()} and customer notified.`
        : `Booking marked as ${status.toLowerCase()}, but the customer notification email could not be sent.`
    });

  } catch (error) {
    console.error("Error updating booking status:", error);
    return res.status(500).json({ success: false, message: "Failed to update booking status." });
  }
});

// 4. ADMIN ROUTE: Delete a booking (e.g. when Completed or Cancelled)
// Example for bookings or orders delete route
router.delete('/:id', requireAdminAuth, async (req, res) => {
  try {
    const record = await Booking.findByIdAndUpdate(
      req.params.id, 
      { isDeleted: true }, 
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }

    return res.json({ 
      success: true, 
      message: "Record hidden from dashboard but kept safely in the database." 
    });
  } catch (error) {
    console.error("Error archiving record:", error);
    return res.status(500).json({ success: false, message: "Failed to update record." });
  }
});

module.exports = router;