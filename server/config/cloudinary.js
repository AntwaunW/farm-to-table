// Cloudinary configuration
// Connects to our Cloudinary account using credentials from .env
// This file is imported anywhere we need to upload images

const cloudinary = require('cloudinary').v2;

// -------------------------------------------------------------------
// 🎓 WHAT IS cloudinary.config()?
// Think of this like logging into your Cloudinary account
// programmatically. We pass our credentials and Cloudinary
// knows which account to upload images to.
// We only need to do this once — then we can use cloudinary
// anywhere in our app.
// -------------------------------------------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;