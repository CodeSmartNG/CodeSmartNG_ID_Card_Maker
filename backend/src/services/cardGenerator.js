import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { uploadCardPdf } from './storageService.js';
import { generateQrBuffer } from './qrService.js'; // 👈 Import QR Service
import { logger } from '../config/logger.js';

export const generateCardPdf = async ({ card, member, organization }) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([242.6, 153]); // CR80 Size (3.375in x 2.125in)

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Background
  page.drawRectangle({ x: 0, y: 0, width: 242.6, height: 153, color: rgb(1, 1, 1) });

  // Header
  page.drawRectangle({ x: 0, y: 113, width: 242.6, height: 40, color: rgb(0.06, 0.09, 0.16) });
  page.drawText(organization.name || 'Organization', {
    x: 15, y: 125, size: 12, font: boldFont, color: rgb(1, 1, 1),
  });

  // Member Info
  page.drawText(`${member.firstName} ${member.lastName}`, {
    x: 90, y: 90, size: 16, font: boldFont, color: rgb(0, 0, 0),
  });
  page.drawText(member.position || 'Member', {
    x: 90, y: 75, size: 10, font: font, color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText(`ID: ${member.memberNumber}`, {
    x: 90, y: 60, size: 10, font: font, color: rgb(0, 0, 0),
  });
  
  // Footer
  page.drawRectangle({ x: 0, y: 0, width: 242.6, height: 20, color: rgb(0.06, 0.09, 0.16) });
  page.drawText(`Valid Until: ${card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : 'N/A'}`, {
    x: 15, y: 6, size: 8, font: font, color: rgb(1, 1, 1),
  });

  // 👇 ADD THE QR CODE HERE
  try {
    const qrBuffer = await generateQrBuffer(card.verificationId);
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    
    // Draw QR code in the bottom right corner
    page.drawImage(qrImage, { 
      x: 175, // X position
      y: 30,  // Y position
      width: 50, // Width of QR code
      height: 50 // Height of QR code
    });

    // Add a tiny "Scan to Verify" text under the QR code
    page.drawText('Scan to Verify', {
      x: 178, y: 22, size: 6, font: font, color: rgb(0.4, 0.4, 0.4),
    });
  } catch (err) {
    logger.warn('Could not embed QR code in PDF', err);
  }

  // 👇 ADD THE PHOTO HERE
  if (member.photoUrl && member.photoUrl.startsWith('http')) {
    try {
      const photoResponse = await fetch(member.photoUrl);
      const photoBuffer = await photoResponse.arrayBuffer();
      
      // Check if it's PNG or JPG
      const isPng = member.photoUrl.toLowerCase().endsWith('.png');
      const image = isPng 
        ? await pdfDoc.embedPng(photoBuffer) 
        : await pdfDoc.embedJpg(photoBuffer);
        
      page.drawImage(image, { x: 15, y: 35, width: 60, height: 70 });
    } catch (err) {
      logger.warn('Could not embed photo in PDF');
    }
  }

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  // Upload to Cloudinary (or local)
  const pdfUrl = await uploadCardPdf(buffer, card.id);
  return { buffer, pdfUrl };
};

export const generateCardPreview = async (data) => {
  const result = await generateCardPdf(data);
  return {
    pdfBase64: result.buffer.toString('base64'),
    template: 'classic',
  };
};
