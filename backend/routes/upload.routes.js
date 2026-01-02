import express from 'express';
import { uploader } from '../config/cloudinary.js';
import handleUpload from '../controllers/upload.controller.js';

const router = express.Router();

// Error handling middleware for multer
const uploadMiddleware = (req, res, next) => {
  uploader.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: 'File upload failed', details: err.message });
    }
    next();
  });
};

router.post('/', uploadMiddleware, handleUpload);

export default router;
