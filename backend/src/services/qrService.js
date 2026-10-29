import QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { env } from '../config/env.js';

/** Cryptographically random public verification ID */
export const generateVerificationId = () => randomBytes(16).toString('hex');

/**
 * QR encodes the public verification URL.
 * Never encode raw IDs — always the /verify/:id path.
 */
export const generateQrDataUrl = async (verificationId, options = {}) => {
  const url = `${env.CLIENT_URL}/verify/${verificationId}`;
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 400,
    color: { dark: '#0f172a', light: '#ffffff' },
    ...options,
  });
};

export const generateQrBuffer = async (verificationId) => {
  const url = `${env.CLIENT_URL}/verify/${verificationId}`;
  return QRCode.toBuffer(url, { width: 600, margin: 1 });
};
