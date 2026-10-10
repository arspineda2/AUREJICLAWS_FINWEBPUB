const express = require("express");
const mongoose = require("mongoose");
const SiteContent = require("../models/SiteContent");
const requireAdminAuth = require("../middleware/requireAdminAuth");

const router = express.Router();

const initialContent = {
  key: "main",
  heroSlides: [
    {
      slot: 1,
      title: "Amethyst Fang",
      description: "Inspired by the deep sea and its untamed beauty, Amethyst Fang blends deep ocean blues with dreamy amethyst purples for a set that feels both mysterious and enchanting. Delicate butterfly accents flutter across a shark-inspired edge, capturing the perfect balance of soft and fierce. Bold, oceanic, and unforgettable — this is a set made for those unafraid to dive into something different.",
      buttonText: "Shop Now",
      buttonHref: "PressonPage.html",
      imageUrl: "photos/herosecimg.png"
    },
    {
      slot: 2,
      title: "Bring Aureji Claws to Your Next Event",
      description: "Whether it's a campus fair, a pop-up market, or a brand collaboration, we'd love to set up shop at your event. Contact us or send an email to book Aureji Claws for your next booth.",
      buttonText: "Get in Touch",
      buttonHref: "ContactPage.html",
      imageUrl: "photos/herosecimg2.png"
    },
    {
      slot: 3,
      title: "Made by Hand. Made for You.",
      description: "Each set is crafted just for you — sized, styled, and ready to slay.",
      buttonText: "",
      buttonHref: "PressonPage.html",
      imageUrl: "photos/herosecimg3.png"
    }
  ],
  instagramPosts: [
    { slot: 1, link: "https://instagram.com/aurejiclaws", imageUrl: "photos/reel.png", label: "View Reel" },
    { slot: 2, link: "https://www.instagram.com/p/DXeI9ykkcBS/", imageUrl: "photos/igpost-one.png", label: "View Post" },
    { slot: 3, link: "https://www.instagram.com/p/DdE-oU_SEmh/", imageUrl: "photos/igpost-two.png", label: "View Post" },
    { slot: 4, link: "https://www.instagram.com/p/DXeI9ykkcBS/", imageUrl: "photos/igpost-three.png", label: "View Post" },
    { slot: 5, link: "https://instagram.com/aurejiclaws", imageUrl: "photos/igpost-four.png", label: "View Post" },
    { slot: 6, link: "https://instagram.com/aurejiclaws", imageUrl: "photos/igpost-five.png", label: "View Post" }
  ],
  serviceMenu: {
    title: "Service Menu",
    note: "For custom press-on nails, please message us via instagram dm: @aurejiclaws",
    buttonText: "Book a service",
    categories: [
      { id: "nails", title: "Nails:", items: [
        { id: "gel-manicure", name: "Gel Manicure", price: "₱300" },
        { id: "cat-eye-magnet-gel-manicure", name: "Cat Eye (Magnet) Gel Manicure", price: "₱400" },
        { id: "gel-french-manicure", name: "Gel French Manicure", price: "₱400" }
      ] },
      { id: "nail-extensions", title: "Nail Extensions:", items: [
        { id: "custom-press-on", name: "Custom Press-on", price: "starting price: ₱600+" },
        { id: "gel-x", name: "Gel-X", price: "₱1300" }
      ] },
      { id: "nail-arts-add-ons", title: "Nail Arts and other add ons:", items: [
        { id: "cat-eye", name: "Cat Eye", price: "₱100" },
        { id: "nail-sticker", name: "Nail Sticker", price: "₱100" },
        { id: "chrome", name: "Chrome", price: "₱100" },
        { id: "french-tip", name: "French Tip", price: "₱150" },
        { id: "ombre", name: "Ombre", price: "₱100" },
        { id: "3d-nail-art", name: "3D Nail Art", price: "₱200" },
        { id: "gel-nail-art", name: "Gel Nail Art", price: "₱300" },
        { id: "nail-stones", name: "Nail Stones", price: "₱100" }
      ] },
      { id: "removal", title: "Removal:", items: [
        { id: "gel-x-removal", name: "Gel-X Removal", price: "₱50" },
        { id: "external-gel-x-removal", name: "Gel-X Removal (for extensions not done at Aurejiclaws)", price: "₱100" }
      ] }
    ]
  },
  contact: { email: "aureji2025@gmail.com", phone: "969-514-7202", instagram: "aurejiclaws" }
};

async function getContent() {
  return SiteContent.findOneAndUpdate(
    { key: "main" },
    { $setOnInsert: initialContent },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

function validText(value, maximum, allowEmpty = false) {
  return typeof value === "string" && value.length <= maximum
    && (allowEmpty || value.trim().length > 0);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validImageUrl(value) {
  return validText(value, 500) && (/^\/api\/media\/[a-f\d]{24}$/i.test(value)
    || (/^photos\/[a-z\d._/-]+$/i.test(value) && !value.includes("..")));
}

function validUrl(value) {
  if (!validText(value, 500)) return false;
  if (/^(?:[a-z\d_-]+\/)*[a-z\d_-]+\.html$/i.test(value)) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Site content is unavailable because MongoDB is disconnected." });
    }
    const content = await getContent();
    return res.json({ success: true, content });
  } catch (error) {
    console.error("Site content load failed:", error);
    return res.status(500).json({ success: false, message: "Failed to load site content." });
  }
});

router.put("/:section", requireAdminAuth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Site content is unavailable because MongoDB is disconnected." });
    }
    if (!isRecord(req.body)) {
      return res.status(400).json({ success: false, message: "Enter valid site content." });
    }
    const content = await getContent();
    const body = req.body;

    if (req.params.section === "hero") {
      const valid = Array.isArray(body.slides) && body.slides.length === 3
        && body.slides.every((slide, index) => isRecord(slide) && slide.slot === index + 1
          && validText(slide.title, 120)
          && validText(slide.description, 1500, true)
          && validText(slide.buttonText, 60, true)
          && validUrl(slide.buttonHref)
          && validImageUrl(slide.imageUrl));
      if (!valid) return res.status(400).json({ success: false, message: "Enter valid content for all three hero slides." });
      content.heroSlides = body.slides.map((slide) => ({
        slot: slide.slot,
        title: slide.title.trim(),
        description: slide.description.trim(),
        buttonText: slide.buttonText.trim(),
        buttonHref: slide.buttonHref.trim(),
        imageUrl: slide.imageUrl
      }));
    } else if (req.params.section === "instagram") {
      const valid = Array.isArray(body.posts) && body.posts.length === 6
        && body.posts.every((post, index) => isRecord(post) && post.slot === index + 1
          && validUrl(post.link) && validImageUrl(post.imageUrl));
      if (!valid) return res.status(400).json({ success: false, message: "Enter a valid link and image for all six Instagram slots." });
      content.instagramPosts = body.posts.map((post) => ({ ...post, label: post.slot === 1 ? "View Reel" : "View Post" }));
    } else if (req.params.section === "services") {
      const categories = body.categories;
      const categoryIds = new Set();
      const serviceIds = new Set();
      const valid = validText(body.title, 120)
        && validText(body.note, 500, true)
        && validText(body.buttonText, 60)
        && Array.isArray(categories) && categories.length <= 30
        && categories.every((category) => {
          if (!isRecord(category)
            || !/^[a-z0-9-]{1,80}$/i.test(category.id)
            || categoryIds.has(category.id.toLowerCase())
            || !validText(category.title, 120)
            || !Array.isArray(category.items) || category.items.length > 100) {
            return false;
          }
          categoryIds.add(category.id.toLowerCase());
          return category.items.every((item) => {
            if (!isRecord(item)
              || !/^[a-z0-9-]{1,80}$/i.test(item.id)
              || serviceIds.has(item.id.toLowerCase())
              || !validText(item.name, 100)
              || !validText(item.price, 80)) {
              return false;
            }
            serviceIds.add(item.id.toLowerCase());
            return true;
          });
        });
      if (!valid) return res.status(400).json({ success: false, message: "Enter valid service menu content." });
      const savedCategories = content.serviceMenu.categories;
      const categoriesUnchanged = categories.length === savedCategories.length
        && categories.every((category, index) => category.id === savedCategories[index].id
          && category.title.trim() === savedCategories[index].title);
      if (!categoriesUnchanged) {
        return res.status(400).json({ success: false, message: "Service categories are fixed; you can only edit or add services within them." });
      }
      content.serviceMenu = {
        title: body.title.trim(),
        note: body.note.trim(),
        buttonText: body.buttonText.trim(),
        categories: categories.map((category) => ({
          id: category.id,
          title: category.title.trim(),
          items: category.items.map((item) => ({ id: item.id, name: item.name.trim(), price: item.price.trim() }))
        }))
      };
    } else if (req.params.section === "contact") {
      const { email, phone, instagram } = body;
      if (!validText(email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        || !validText(phone, 40) || typeof instagram !== "string" || !/^@?[a-z\d._]{1,30}$/i.test(instagram)) {
        return res.status(400).json({ success: false, message: "Enter a valid email, phone number, and Instagram handle." });
      }
      content.contact = { email: email.trim(), phone: phone.trim(), instagram: instagram.trim().replace(/^@/, "") };
    } else {
      return res.status(404).json({ success: false, message: "Unknown site content section." });
    }

    await content.save();
    return res.json({ success: true, content });
  } catch (error) {
    console.error("Site content save failed:", error);
    return res.status(500).json({ success: false, message: "Failed to save site content." });
  }
});

module.exports = router;
