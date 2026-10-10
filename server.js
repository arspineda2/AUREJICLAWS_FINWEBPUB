// Load local configuration before reading process.env; .env stays outside public/.
require("dotenv").config();
const express = require("express");
const path = require("node:path");
const dns = require("node:dns/promises");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");

// Parse ordinary API bodies. The order endpoint uses Multer for its multipart screenshot.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve only public site files. Payment screenshots are deliberately not exposed as static files.
app.use(express.static(publicDir));

// Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
}));

// Email Transporter (Nodemailer)
// Replace the old const transporter = nodemailer.createTransport({...}) with this:
const transporter = require("./config/email");


// Admin Schema & Model for Atlas Lookup (Targets 'admins' collection explicitly)
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true }
});
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema, 'admins');

// Step A: Admin requests OTP / Logs in
app.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const cleanEmail = email ? email.trim() : '';
    const cleanPassword = password ? password.trim() : '';

    // Search email in Atlas case-insensitively using Regex
    const admin = await Admin.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') }
    });

    // Check if admin exists and password matches
    if (!admin || admin.password !== cleanPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Generate 6-digit OTP
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    req.session.pendingAdminEmail = cleanEmail;
    req.session.otp = generatedOTP;
    req.session.otpExpires = Date.now() + 5 * 60 * 1000;

    // Send email via Nodemailer
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: cleanEmail,
      subject: 'Your Admin Login OTP',
      text: `Your OTP code is: ${generatedOTP}. It expires in 5 minutes.`
    });

    return res.json({ success: true, message: 'OTP sent to email.' });

  } catch (err) {
    console.error("Login processing error:", err);
    return res.status(500).json({ success: false, message: 'Failed to process login.' });
  }
});

// Step B: Verify OTP
app.post('/admin/verify-otp', (req, res) => {
  const { userOTP } = req.body;

  if (!req.session.otp || Date.now() > req.session.otpExpires) {
    return res.status(400).json({ success: false, message: 'OTP expired or invalid session.' });
  }

  if (userOTP === req.session.otp) {
    req.session.isAdminAuthenticated = true;
    delete req.session.otp;
    delete req.session.otpExpires;

    return res.json({ success: true, redirectUrl: '/admin' });
  }

  res.status(400).json({ success: false, message: 'Incorrect OTP.' });
});

// Authentication Middleware[cite: 2]
const requireAdminAuth = require("./middleware/requireAdminAuth");

const adminPageFiles = {
  hero: 'HeroPage.html',
  instagram: 'post.html',
  products: 'products.html',
  orders: 'orders.html',
  services: 'servicesList.html',
  bookings: 'booked.html'
};

function requireAdminPage(req, res, next) {
  if (req.session && req.session.isAdminAuthenticated) {
    return next();
  }
  return res.redirect('/login.html');
}

app.get('/admin', requireAdminPage, (req, res) => {
  res.redirect('/admin/hero');
});

app.get('/admin/:page', requireAdminPage, (req, res) => {
  const pageFile = Object.hasOwn(adminPageFiles, req.params.page)
    ? adminPageFiles[req.params.page]
    : null;
  if (!pageFile) {
    return res.status(404).send('Admin page not found.');
  }
  return res.sendFile(path.join(__dirname, 'views', 'admin', pageFile));
});

//Admint Logout Route
app.post('/admin/logout', requireAdminAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Could not log out.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, redirectUrl: '/login.html' });
  });
});

// Page routes
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "HomePage.html"));
});

app.get("/ServicesPage.html", (req, res) => {
  res.sendFile(path.join(publicDir, "ServicesPage.html"));
});

app.get("/PressonPage.html", (req, res) => {
  res.sendFile(path.join(publicDir, "PressonPage.html"));
});

app.get("/AboutPage.html", (req, res) => {
  res.sendFile(path.join(publicDir, "AboutPage.html"));
});

app.get("/style.css", (req, res) => {
  res.sendFile(path.join(publicDir, "style.css"));
});

app.get("/script.js", (req, res) => {
  res.sendFile(path.join(publicDir, "script.js"));
});

// Readiness route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

// Order Routes
const orderRoutes = require("./routes/orders");
app.use("/api/orders", orderRoutes);

// Booking Routes
const bookingRoutes = require("./routes/bookings");
app.use("/api/bookings", bookingRoutes);

const productRoutes = require("./routes/products");
app.use("/api/products", productRoutes);

const siteContentRoutes = require("./routes/site-content");
app.use("/api/site-content", siteContentRoutes);

const mediaRoutes = require("./routes/media");
app.use("/api/media", mediaRoutes);

// Database Connection Function
async function connectToAtlas() {
  if (!process.env.MONGO_URI) {
    console.warn("MongoDB is not configured. Website pages are available; order saving is disabled.");
    return;
  }

  try {
    if (/^mongodb\+srv:\/\//i.test(process.env.MONGO_URI)) {
      const connectionUrl = new URL(process.env.MONGO_URI);
      await dns.resolveSrv(`_mongodb._tcp.${connectionUrl.hostname}`);
    }

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || "aureji_claws",
      serverSelectionTimeoutMS: 10000
    });
    console.log("Successfully connected to MongoDB Atlas.");
  } catch (error) {
    const code = error.code || (error.cause && error.cause.code);
    if (["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"].includes(code)) {
      console.error(`Atlas DNS lookup failed (${code}): check network DNS settings.`);
    } else if (code === 18 || code === 8000) {
      console.error("Atlas authentication failed: verify MONGO_URI username/password.");
    } else {
      const detail = typeof error.message === "string"
        ? error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi, "[redacted MongoDB URI]")
        : "No error details available.";
      console.error(`Atlas connection failed (${error.name}): ${detail}`);
    }
  }
}

// Single Express App Listener
app.listen(PORT, async () => {
  console.log(`Aureji Claws site running at http://localhost:${PORT}`);
  await connectToAtlas();
});