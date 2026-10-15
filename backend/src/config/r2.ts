import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from './env.js';

export const isR2Configured = Boolean(
  config.r2.accountId &&
  config.r2.accessKeyId &&
  config.r2.secretAccessKey &&
  config.r2.bucketName
);

/**
 * Cloudflare R2 S3 Client
 * Uses S3-compatible protocol with region: 'auto'
 */
export const r2Client = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
      },
    })
  : null;

/**
 * Upload a binary buffer directly to Cloudflare R2
 */
export async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  if (!r2Client) {
    throw new Error('Cloudflare R2 is not configured. Please set R2 credentials in .env.');
  }

  const command = new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);

  // Return public URL or R2 dev/custom domain URL
  if (config.r2.publicUrl) {
    return `${config.r2.publicUrl}/${key}`;
  }

  // Fallback direct R2 endpoint path
  return `https://${config.r2.accountId}.r2.cloudflarestorage.com/${config.r2.bucketName}/${key}`;
}

/**
 * Delete an object from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  if (!r2Client) return;

  const command = new DeleteObjectCommand({
    Bucket: config.r2.bucketName,
    Key: key,
  });

  await r2Client.send(command);
}
