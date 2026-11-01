import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { uploadCardPdf } from './storageService.js';
import { generateQrBuffer } from './qrService.js';
import { logger } from '../config/logger.js';

export const generateCardPdf = async ({ card, member, organization }) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([242.6, 153]); // CR80 Size (3.375in x 2.125in)

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const truncate = (str, maxLength) => {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  };

  // Background
  page.drawRectangle({ x: 0, y: 0, width: 242.6, height: 153, color: rgb(1, 1, 1) });

  // Header
  page.drawRectangle({ x: 0, y: 113, width: 242.6, height: 40, color: rgb(0.06, 0.09, 0.16) });
  page.drawText(truncate(organization.name || 'Organization', 35), {
    x: 15, y: 128, size: 12, font: boldFont, color: rgb(1, 1, 1),
  });
  
  if (organization.cacNumber || organization.tin) {
    const orgIdText = organization.cacNumber ? `RC: ${organization.cacNumber}` : `TIN: ${organization.tin}`;
    page.drawText(orgIdText, {
      x: 15, y: 118, size: 7, font: font, color: rgb(0.6, 0.6, 0.6),
    });
  }

  // Member Info
  page.drawText(truncate(`${member.firstName} ${member.lastName}`, 25), {
    x: 90, y: 95, size: 16, font: boldFont, color: rgb(0, 0, 0),
  });
  
  page.drawText(truncate(member.position || 'Member', 30), {
    x: 90, y: 83, size: 10, font: font, color: rgb(0.4, 0.4, 0.4),
  });
  
  // 👇 Truncate the ID so it doesn't hit the QR code
  page.drawText(truncate(`ID: ${member.memberNumber}`, 20), {
    x: 90, y: 71, size: 9, font: font, color: rgb(0, 0, 0),
  });

  // 👇 Address, TIN, and NIN
  if (member.address) {
    page.drawText(`Addr: ${truncate(member.address, 28)}`, {
      x: 90, y: 59, size: 7, font: font, color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (member.tin || member.nin) {
    const tinNinText = [
      member.tin ? `TIN: ${member.tin}` : null,
      member.nin ? `NIN: ${member.nin}` : null
    ].filter(Boolean).join(' | ');
    
    page.drawText(truncate(tinNinText, 32), {
      x: 90, y: 47, size: 7, font: font, color: rgb(0.4, 0.4, 0.4),
    });
  }
  
  // Footer
  page.drawRectangle({ x: 0, y: 0, width: 242.6, height: 20, color: rgb(0.06, 0.09, 0.16) });
  page.drawText(`Valid Until: ${card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : 'N/A'}`, {
    x: 15, y: 6, size: 8, font: font, color: rgb(1, 1, 1),
  });

  // QR Code (Moved slightly right and made smaller to prevent overlap)
  try {
    const qrBuffer = await generateQrBuffer(card.verificationId);
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    
    page.drawImage(qrImage, { 
      x: 185, // Moved to the right (was 175)
      y: 25,  // Moved down slightly
      width: 45, // Smaller (was 50)
      height: 45 // Smaller
    });

    page.drawText('Scan to Verify', {
      x: 186, y: 17, size: 6, font: font, color: rgb(0.4, 0.4, 0.4),
    });
  } catch (err) {
    logger.warn('Could not embed QR code in PDF', err);
  }

  // Photo
  if (member.photoUrl && member.photoUrl.startsWith('http')) {
    try {
      const photoResponse = await fetch(member.photoUrl);
      const photoBuffer = await photoResponse.arrayBuffer();
      const isPng = member.photoUrl.toLowerCase().endsWith('.png');
      const image = isPng ? await pdfDoc.embedPng(photoBuffer) : await pdfDoc.embedJpg(photoBuffer);
        
      page.drawImage(image, { x: 15, y: 35, width: 60, height: 70 });
    } catch (err) {
      logger.warn('Could not embed photo in PDF');
    }
  }

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);
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
