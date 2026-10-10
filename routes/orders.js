/* Defines what happens when the app receives an order request: 
reads the submitted form and screenshot, validates the data and products, calculates the total, 
then calls the model to save the order. */
const express = require("express");
const multer = require("multer");
const Order = require("../models/Order");
const Product = require("../models/Product");
const transporter = require("../config/email");
const requireAdminAuth = require("../middleware/requireAdminAuth");

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


// ==========================================
// 1. ADDED ROUTE: Create and Save a New Order
// ==========================================
router.post('/place-order', uploadPaymentProof, async (req, res) => {
  try {
    // Unpack text fields coming from the multipart checkout form submission
    const {
      paymentMethod,
      refNumber,
      dateSent,
      timeSent,
      notes2,
      fullName,
      email,
      contactNo,
      address,
      notes1,
      consent,
      items
    } = req.body;

    // Retrieve the file buffer stored by multer in memory
    const screenshotFile = req.file;

    // A. Validate base required inputs
    if (!fullName || !email || !contactNo || !address || !refNumber
      || !dateSent || !timeSent || paymentMethod !== "GCash"
      || consent !== "true" || !screenshotFile) {
      return res.status(400).json({ success: false, message: "Missing required details or your payment screenshot." });
    }

    // B. Re-verify the file buffer integrity (Double-checking file magic bytes)
    const exactMimeType = imageContentType(screenshotFile);
    if (!exactMimeType) {
      return res.status(400).json({ success: false, message: "Invalid image file format detected." });
    }

    // C. Decode and parse the cart items array from string
    let clientItems = [];
    try {
      clientItems = typeof items === "string" ? JSON.parse(items) : items;
    } catch (parseErr) {
      return res.status(400).json({ success: false, message: "Invalid item data layout format." });
    }
    if (!Array.isArray(clientItems) || clientItems.length === 0) {
      return res.status(400).json({ success: false, message: "Choose at least one product to order." });
    }
    
    // D. Validate Products, Stocks, and calculate server-side Total Price from MongoDB
    let totalAmount = 0;
    const verifiedItems = [];

    for (const item of clientItems) {
      if (!item || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
        return res.status(400).json({ success: false, message: "Each product quantity must be between 1 and 10." });
      }

      // Query MongoDB for the product using its stable productId
      const serverProduct = await Product.findOne({ productId: item.productId });
      
      // If product doesn't exist in MongoDB
      if (!serverProduct) {
        return res.status(400).json({ success: false, message: `Product item '${item.productId}' does not exist.` });
      }
      
      // If product is out of stock
      if (serverProduct.soldOut || serverProduct.stocks < item.quantity) {
        return res.status(400).json({ success: false, message: `'${serverProduct.productName}' is currently out of stock or has insufficient stock.` });
      }

      totalAmount += serverProduct.price * item.quantity;
      verifiedItems.push({
        productId: item.productId,
        productName: serverProduct.productName,
        unitPrice: serverProduct.price,
        quantity: item.quantity
      });

      // Atomically decrement stock to prevent overselling
      const stockUpdate = await Product.updateOne(
        { productId: item.productId, soldOut: { $ne: true }, stocks: { $gte: item.quantity } },
        { $inc: { stocks: -item.quantity } }
      );
      if (!stockUpdate.modifiedCount) {
        return res.status(409).json({ success: false, message: `'${serverProduct.productName}' is no longer available in the requested quantity.` });
      }
    }

    // E. Save the validated order and its private payment proof in MongoDB.
    const newOrder = new Order({
      customer: {
        fullName,
        email,
        contactNo,
        address,
        notes: notes1,
        consentGiven: true
      },
      items: verifiedItems,
      totalAmount,
      payment: {
        method: "GCash",
        referenceNumber: refNumber,
        dateSent,
        timeSent,
        notes: notes2,
        proof: {
          data: screenshotFile.buffer,
          contentType: exactMimeType
        }
      }
    });

    await newOrder.save();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully! We are verifying your GCash payment.",
      orderId: newOrder._id
    });

  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ success: false, message: "Failed to place order process." });
  }
});


// ==========================================
// 2. EXISTING ROUTE: Admin Approval Routing
// ==========================================
router.post('/approve/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find order and update status to Approved
    const order = await Order.findByIdAndUpdate(
      id,
      { status: 'Approved' },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // 2. Send GCash Confirmation Email via Nodemailer
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: order.customer.email,
      subject: `Payment Verified! Order #${order._id} Confirmed - Aureji Claws`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4CAF50;">Payment Confirmed!</h2>
          <p>Hi <strong>${order.customer.fullName}</strong>,</p>
          <p>We have verified your GCash payment for <strong>Order #${order._id}</strong>.</p>
          
          <hr />
          <h3>Order Details:</h3>
          <ul>
            <li><strong>Total Paid:</strong> ₱${order.totalAmount}</li>
            <li><strong>GCash Ref No:</strong> ${order.payment.referenceNumber}</li>
            <li><strong>Status:</strong> Payment Verified & Order Processed</li>
          </ul>
          <hr />
          
          <p>Thank you for choosing Aureji Claws! We will begin processing your set right away.</p>
        </div>
      `
    });

    return res.json({ 
      success: true, 
      message: 'Payment verified! Status updated and email sent to customer.' 
    });

  } catch (err) {
    console.error("Error approving order:", err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to process approval.' 
    });
  }
});

// Admin Dashboard Fetch Endpoint: Returns all stored store orders
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const allOrders = await Order.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    const orders = allOrders.map((order) => ({
      _id: order._id,
      customerName: order.customer.fullName,
      customerEmail: order.customer.email,
      contactNo: order.customer.contactNo,
      address: order.customer.address,
      items: order.items,
      totalAmount: order.totalAmount,
      gcashRefNumber: order.payment.referenceNumber,
      paymentScreenshot: `data:${order.payment.proof.contentType};base64,${order.payment.proof.data.toString("base64")}`,
      status: order.status === "Pending Review" ? "Pending" : order.status,
      createdAt: order.createdAt
    }));
    return res.json({ success: true, orders });
  } catch (err) {
    console.error("Error loading orders:", err);
    return res.status(500).json({ success: false, message: "Failed to grab system orders." });
  }
});

// ==========================================
// 3. NEW ROUTE: Admin Order Rejection
// ==========================================
router.post('/reject/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (!['Pending Review', 'Pending'].includes(order.status)) {
      return res.status(409).json({
        success: false,
        message: `This order cannot be rejected because its status is ${order.status}.`
      });
    }

    order.status = 'Rejected';
    await order.save();

    //Try sending the customer notification email
    let emailSent = true;
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: order.customer.email,
        subject: `Order #${order._id} Status Update - Aureji Claws`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #d9534f;">Order Update: Payment Not Verified</h2>
            <p>Hi <strong>${order.customer.fullName}</strong>,</p>
            <p>We reviewed your payment for <strong>Order #${order._id}</strong>, but we were unable to verify your GCash transaction.</p>
            
            <hr />
            <h3>Order Details:</h3>
            <ul>
              <li><strong>Total Amount:</strong> ₱${order.totalAmount}</li>
              <li><strong>GCash Ref No:</strong> ${order.payment.referenceNumber}</li>
              <li><strong>Status:</strong> Rejected</li>
            </ul>
            ${reason ? `<p><strong>Reason provided:</strong> ${reason}</p>` : ''}
            <hr />
            
            <p>If you believe this is a mistake, please reach out to us with a clear screenshot of your correct payment receipt.</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error("Failed to send rejection email:", emailErr);
      emailSent = false;
    }

    return res.json({ 
      success: true, 
      message: emailSent 
        ? 'Order marked as rejected and customer notified.' 
        : 'Order marked as rejected in database, but customer email notification failed to send.',
      notificationSent: emailSent,
      status: order.status 
    });

  } catch (err) {
    console.error("Error rejecting order:", err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to process rejection.' 
    });
  }
});

//4. ADMIN ROUTE: Soft delete an order (hides from dashboard, keeps in database)
router.delete('/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.json({ success: true, message: 'Order removed from dashboard and safely archived in the database.' });
  } catch (err) {
    console.error("Error archiving order:", err);
    return res.status(500).json({ success: false, message: 'Failed to process order deletion.' });
  }
});

module.exports = router;