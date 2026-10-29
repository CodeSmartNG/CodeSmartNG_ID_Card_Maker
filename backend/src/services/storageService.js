import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';

const LOCAL_UPLOAD_DIR = path.resolve('./uploads');

/* ---------- local driver ---------- */
const localSave = async (buffer, key) => {
  const fullPath = path.join(LOCAL_UPLOAD_DIR, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return `${env.SERVER_URL || 'http://localhost:5000'}/uploads/${key}`;
};

/* ---------- s3 driver ---------- */
const s3Save = async (buffer, key) => {
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
      ContentType: 'application/pdf',
    })
  );
  return `https://${env.STORAGE_BUCKET}.s3.amazonaws.com/${key}`;
};

/* ---------- cloudinary driver ---------- */
const cloudinarySave = async (buffer, key) => {
  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({
    cloud_name: env.STORAGE_BUCKET,
    api_key: env.STORAGE_KEY,
    api_secret: env.STORAGE_SECRET,
  });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', public_id: key, folder: 'cards' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
};

/* ---------- dispatcher ---------- */
export const uploadCardPdf = async (buffer, cardId) => {
  const key = `cards/${cardId}/${Date.now()}.pdf`;
  switch (env.STORAGE_DRIVER) {
    case 's3':
      return s3Save(buffer, key);
    case 'cloudinary':
      return cloudinarySave(buffer, key);
    case 'local':
    default:
      return localSave(buffer, key);
  }
};
