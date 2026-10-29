import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

export const generateVerificationId = () => randomBytes(16).toString('hex');

export const generateQrDataUrl = async (verificationId) => {
  const url = `${process.env.CLIENT_URL}/verify/${verificationId}`;
  return QRCode.toDataURL(url, { width: 400, margin: 1 });
};
