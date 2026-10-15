import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { uploadToR2, isR2Configured } from '../config/r2.js';
import { config } from '../config/env.js';

// Local uploads directory fallback if R2 is not configured
let cachedUploadsDir: string | null = null;

export function getLocalUploadsDir(): string {
  if (cachedUploadsDir && fs.existsSync(cachedUploadsDir)) {
    return cachedUploadsDir;
  }

  const primaryDir = process.env.UPLOADS_DIR || path.resolve(process.cwd(), 'uploads');
  try {
    if (!fs.existsSync(primaryDir)) {
      fs.mkdirSync(primaryDir, { recursive: true });
    }
    cachedUploadsDir = primaryDir;
    return primaryDir;
  } catch (err) {
    console.warn(`[Upload] Cannot write to ${primaryDir} (${(err as Error).message}). Falling back to /tmp/uploads.`);
    const fallbackDir = path.resolve('/tmp', 'uploads');
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      cachedUploadsDir = fallbackDir;
      return fallbackDir;
    } catch (fallbackErr) {
      console.error('[Upload] Failed to create fallback /tmp/uploads directory:', fallbackErr);
      return fallbackDir;
    }
  }
}

// Pre-initialize on boot safely without throwing fatal error
try {
  getLocalUploadsDir();
} catch (err) {
  console.warn('[Upload] Deferred directory creation until first upload:', (err as Error).message);
}

/**
 * POST /api/upload
 * Handles document, invoice, receipt, and payment proof uploads
 */
export async function uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded. Please provide a file in the multipart "file" field.',
      });
      return;
    }

    // Sanitize filename & extension
    const originalExt = path.extname(file.originalname).toLowerCase() || '.bin';
    const baseName = path.basename(file.originalname, originalExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    const folder = (req.body.folder as string) || 'documents';

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uniqueKey = `${folder}/${year}/${month}/${crypto.randomUUID()}-${baseName}${originalExt}`;

    let fileUrl: string;
    let storageType: 'cloudflare-r2' | 'local-fallback';

    if (isR2Configured) {
      // 1. Upload directly to Cloudflare R2
      fileUrl = await uploadToR2(file.buffer, uniqueKey, file.mimetype);
      storageType = 'cloudflare-r2';
    } else {
      // 2. Safe local fallback if R2 credentials are not yet configured in .env
      const targetDir = getLocalUploadsDir();
      const localFilePath = path.join(targetDir, uniqueKey);
      const localFileDir = path.dirname(localFilePath);
      if (!fs.existsSync(localFileDir)) {
        fs.mkdirSync(localFileDir, { recursive: true });
      }

      fs.writeFileSync(localFilePath, file.buffer);
      fileUrl = `/uploads/${uniqueKey}`;
      storageType = 'local-fallback';
    }

    res.status(201).json({
      success: true,
      message: storageType === 'cloudflare-r2' 
        ? 'File uploaded to Cloudflare R2 successfully' 
        : 'File uploaded locally (Cloudflare R2 credentials not configured in .env)',
      data: {
        url: fileUrl,
        key: uniqueKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storage: storageType,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/upload/status
 * Returns Cloudflare R2 integration status and instructions
 */
export function getStorageStatus(_req: Request, res: Response): void {
  res.json({
    success: true,
    data: {
      r2Configured: isR2Configured,
      bucketName: config.r2.bucketName || null,
      publicUrl: config.r2.publicUrl || null,
      storageType: isR2Configured ? 'cloudflare-r2' : 'local-fallback',
      help: !isR2Configured
        ? 'To connect Cloudflare R2, add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME to backend/.env'
        : 'Cloudflare R2 is fully connected and ready for uploads.',
    },
  });
}
