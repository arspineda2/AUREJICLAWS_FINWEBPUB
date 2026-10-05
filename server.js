// Load local configuration before reading process.env; .env stays outside public/.
require("dotenv").config();
const express = require("express");
const path = require("node:path");
const dns = require("node:dns/promises");
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");

// Parse ordinary API bodies. The order endpoint uses Multer for its multipart screenshot.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve only public site files. Payment screenshots are deliberately not exposed as static files.
app.use(express.static(publicDir));

// Page routes use files and assets from the same public/ directory.
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "HomePage.html"));
});

// Explicit page routes make the case-sensitive navigation links resolve consistently.
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

// The readiness response lets developers confirm the app and database connection state.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

// Keep database operations out of the static frontend and behind server-side routes.
const orderRoutes = require("./routes/orders");
app.use("/api/orders", orderRoutes);

// Keep the website pages available even when the optional database is not ready.
app.listen(PORT, () => {
  console.log(`Aureji Claws site running at http://localhost:${PORT}`);
});

async function connectToAtlas() {
  if (!process.env.MONGO_URI) {
    console.warn("MongoDB is not configured. Website pages are available; order saving is disabled.");
    return;
  }

  try {
    if (/^mongodb\+srv:\/\//i.test(process.env.MONGO_URI)) {
      const connectionUrl = new URL(process.env.MONGO_URI);
      // SRV DNS must work before the MongoDB driver can discover Atlas servers.
      await dns.resolveSrv(`_mongodb._tcp.${connectionUrl.hostname}`);
    }

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || "aureji_claws",
      serverSelectionTimeoutMS: 10000
    });
    console.log("Successfully connected to MongoDB Atlas.");
  } catch (error) {
    // Do not print the connection string; database errors can otherwise expose credentials.
    const code = error.code || (error.cause && error.cause.code);
    if (["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"].includes(code)) {
      console.error(`Atlas DNS lookup failed (${code}): check your network DNS settings or try another network.`);
    } else if (code === 18 || code === 8000) {
      console.error("Atlas authentication failed: verify the database username and password in MONGO_URI.");
    } else {
      const detail = typeof error.message === "string"
        ? error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi, "[redacted MongoDB URI]")
        : "No error details available.";
      console.error(`Atlas connection failed (${error.name}): ${detail}`);
    }
  }
}

connectToAtlas();
