// Upload route — handles image uploads to Cloudinary
// Images are sent as multipart form data from the frontend
// Multer processes the file, then we send it to Cloudinary
// Cloudinary returns a URL which we send back to the frontend

const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

// -------------------------------------------------------------------
// 🎓 WHAT IS MULTER?
// When you upload a file from a browser it arrives at the server
// as raw binary data — basically a stream of 1s and 0s.
// Multer is a middleware that intercepts that data and makes it
// usable in our route handler.
//
// Think of it like a mail room worker. When a package (the image)
// arrives at the building (our server) the mail room worker (multer)
// opens it, organizes it, and puts it somewhere useful before
// passing it to the right person (our route handler).
//
// memoryStorage() means multer keeps the file in memory (RAM)
// temporarily instead of saving it to disk. We don't need it on
// disk because we're immediately sending it to Cloudinary.
// -------------------------------------------------------------------
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// @route   POST /api/upload
// @desc    Upload a single image to Cloudinary
// @access  Private (must be logged in)
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    // -------------------------------------------------------------------
    // 🎓 WHAT IS req.file?
    // After multer processes the upload req.file contains the image data.
    // req.file.buffer is the raw image data in memory.
    //
    // If no file was sent req.file will be undefined — we check for
    // that and return an error message.
    // -------------------------------------------------------------------
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // -------------------------------------------------------------------
    // 🎓 UPLOADING TO CLOUDINARY
    // Cloudinary's upload_stream method accepts a stream of data.
    // We wrap it in a Promise so we can use async/await with it.
    //
    // Think of it like a water pipe:
    // - upload_stream opens the pipe on Cloudinary's end
    // - end(req.file.buffer) pushes our image data through the pipe
    // - When it reaches Cloudinary they store it and send back a result
    //
    // The result.secure_url is the HTTPS URL of our uploaded image.
    // This is what we save in MongoDB.
    // -------------------------------------------------------------------
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'farm-to-table', // organize uploads in a folder
          transformation: [
            { width: 1200, crop: 'limit' }, // max width 1200px
            { quality: 'auto' },            // auto optimize quality
            { fetch_format: 'auto' },       // auto choose best format
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Push the image buffer through the upload stream
      uploadStream.end(req.file.buffer);
    });

    // Send the Cloudinary URL back to the frontend
    res.status(200).json({
      success: true,
      url: uploadResult.secure_url,
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Image upload failed' });
  }
});

module.exports = router;