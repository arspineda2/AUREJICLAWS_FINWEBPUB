const mongoose = require("mongoose");

const siteContentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: "main" },
  heroSlides: { type: [mongoose.Schema.Types.Mixed], default: [] },
  instagramPosts: { type: [mongoose.Schema.Types.Mixed], default: [] },
  serviceMenu: {
    title: { type: String, default: "Service Menu" },
    note: { type: String, default: "For custom press-on nails, please message us via instagram dm: @aurejiclaws" },
    buttonText: { type: String, default: "Book a service" },
    categories: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  contact: {
    email: { type: String, default: "aureji2025@gmail.com" },
    phone: { type: String, default: "969-514-7202" },
    instagram: { type: String, default: "aurejiclaws" }
  }
}, { timestamps: true });

module.exports = mongoose.models.SiteContent || mongoose.model("SiteContent", siteContentSchema);
