import { Router } from 'express';
import multer from 'multer';
import { uploadDocument, getStorageStatus } from '../controllers/upload.controller.js';

const router = Router();

// Store files in memory buffer to stream directly to Cloudflare R2
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Allow standard business documents, receipts, spreadsheets, and images
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: Images (PNG, JPG, WEBP), PDF, Word, Excel, CSV.`));
    }
  },
});

// POST /api/upload - Single file upload
router.post('/', upload.single('file'), uploadDocument);

// GET /api/upload/status - R2 connection status check
router.get('/status', getStorageStatus);

export default router;
