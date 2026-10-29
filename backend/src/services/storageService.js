import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';

const LOCAL_UPLOAD_DIR = path.resolve('./uploads');

/* =========================================================
   LOCAL DRIVER
   ========================================================= */
const localSave = async (buffer, key) => {
  const fullPath = path.join(LOCAL_UPLOAD_DIR, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  
  // Use SERVER_URL if available, otherwise fallback to localhost
  const baseUrl = env.SERVER_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${key}`;
};

/* =========================================================
   S3 DRIVER
   ========================================================= */
const s3Save = async (buffer, key, contentType) => {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: env.STORAGE_KEY,
      secretAccessKey: env.STORAGE_SECRET,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType, // ✅ Dynamic content type
    })
  );
  return `https://${env.STORAGE_BUCKET}.s3.amazonaws.com/${key}`;
};

/* =========================================================
   CLOUDINARY DRIVER
   ========================================================= */
const cloudinarySave = async (buffer, key, isPdf) => {
  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({
    cloud_name: env.STORAGE_BUCKET,
    api_key: env.STORAGE_KEY,
    api_secret: env.STORAGE_SECRET,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        // Cloudinary requires 'raw' for PDFs, but 'image' for photos
        resource_type: isPdf ? 'raw' : 'image', 
        public_id: key, 
        folder: 'cards' // Note: you might want to change this folder dynamically later
      },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
};

/* =========================================================
   PUBLIC DISPATCHER (Generic)
   ========================================================= */
export const uploadFile = async (buffer, key, mimeType) => {
  const isPdf = mimeType === 'application/pdf';
  switch (env.STORAGE_DRIVER) {
    case 's3':
      return s3Save(buffer, key, mimeType);
    case 'cloudinary':
      return cloudinarySave(buffer, key, isPdf);
    case 'local':
    default:
      return localSave(buffer, key);
  }
};

/* =========================================================
   CONVENIENCE WRAPPERS
   ========================================================= */

// For Card Generation Job
export const uploadCardPdf = async (buffer, cardId) => {
  const key = `cards/${cardId}/${Date.now()}.pdf`;
  return uploadFile(buffer, key, 'application/pdf');
};

// For Member Controller (Photos)
export const uploadMemberPhoto = async (buffer, originalName, memberId) => {
  const ext = path.extname(originalName) || '.jpg';
  // e.g. members/clxyz123/16789012.jpg
  const key = `members/${memberId}/${Date.now()}${ext}`;
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  return uploadFile(buffer, key, mimeType);
};
