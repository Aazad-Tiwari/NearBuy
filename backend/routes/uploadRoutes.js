const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { authenticate } = require('../middlewares/auth');
const { sendSuccess, sendError } = require('../utils/response');

// Configure Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (.jpg, .jpeg, .png, .webp) are allowed'));
  }
});

// Configure Cloudinary
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== 'dummy_cloud' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('✅ Cloudinary initialized for photo uploads.');
} else {
  console.log('⚠️ Cloudinary keys not set. Falling back to local storage.');
}

// POST /api/uploads
// Expects multipart form data field "image"
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Please upload an image file.');
    }

    // Attempt Cloudinary upload if configured
    if (isCloudinaryConfigured) {
      try {
        const uploadStream = () => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: 'nearbuy_uploads' },
              (error, result) => {
                if (result) resolve(result);
                else reject(error);
              }
            );
            stream.write(req.file.buffer);
            stream.end();
          });
        };

        const result = await uploadStream();
        return sendSuccess(res, 200, 'Image uploaded to Cloudinary successfully.', {
          imageUrl: result.secure_url,
          source: 'cloudinary'
        });
      } catch (cloudErr) {
        console.error('Cloudinary upload error, falling back to local:', cloudErr);
      }
    }

    // Local Storage Fallback
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `photo-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, req.file.buffer);

    // Build local URL path
    const localUrl = `/uploads/${filename}`;

    return sendSuccess(res, 200, 'Image uploaded to local storage successfully.', {
      imageUrl: localUrl,
      source: 'local'
    });

  } catch (err) {
    console.error('[Upload error]', err);
    return sendError(res, 500, err.message || 'Error processing image upload.');
  }
});

module.exports = router;
