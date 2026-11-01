import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { uploadCardPdf } from './storageService.js';
import { generateQrBuffer } from './qrService.js';
import { logger } from '../config/logger.js';

export const generateCardPdf = async ({ card, member, organization }) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([242.6, 153]); // CR80 Size (3.375in x 2.125in)

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper to cut off text that is too long so it doesn't overlap the QR code
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
  
  // Organization CAC / TIN in Header
  if (organization.cacNumber || organization.tin) {
    const orgIdText = organization.cacNumber ? `RC: ${organization.cacNumber}` : `TIN: ${organization.tin}`;
    page.drawText(orgIdText, {
      x: 15, y: 118, size: 7, font: font, color: rgb(0.6, 0.6, 0.6), // Gray text
    });
  }

  // Member Info
  page.drawText(truncate(`${member.firstName} ${member.lastName}`, 25), {
    x: 90, y: 90, size: 16, font: boldFont, color: rgb(0, 0, 0),
  });
  
  page.drawText(truncate(member.position || 'Member', 30), {
    x: 90, y: 78, size: 10, font: font, color: rgb(0.4, 0.4, 0.4),
  });
  
  page.drawText(`ID: ${member.memberNumber}`, {
    x: 90, y: 65, size: 9, font: font, color: rgb(0, 0, 0),
  });

  // 👇 NEW: Address, TIN, and NIN
  if (member.address) {
    page.drawText(`Addr: ${truncate(member.address, 28)}`, {
      x: 90, y: 52, size: 7, font: font, color: rgb(0.4, 0.4, 0.4),
    });
  }

  if (member.tin || member.nin) {
    const tinNinText = [
      member.tin ? `TIN: ${member.tin}` : null,
      member.nin ? `NIN: ${member.nin}` : null
    ].filter(Boolean).join(' | ');
    
    page.drawText(truncate(tinNinText, 35), {
      x: 90, y: 40, size: 7, font: font, color: rgb(0.4, 0.4, 0.4),
    });
  }
  
  // Footer
  page.drawRectangle({ x: 0, y: 0, width: 242.6, height: 20, color: rgb(0.06, 0.09, 0.16) });
  page.drawText(`Valid Until: ${card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : 'N/A'}`, {
    x: 15, y: 6, size: 8, font: font, color: rgb(1, 1, 1),
  });

  // QR Code
  try {
    const qrBuffer = await generateQrBuffer(card.verificationId);
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    
    // Draw QR code in the bottom right corner
    page.drawImage(qrImage, { 
      x: 175, // X position
      y: 28,  // Y position
      width: 50, // Width of QR code
      height: 50 // Height of QR code
    });

    // Add a tiny "Scan to Verify" text under the QR code
    page.drawText('Scan to Verify', {
      x: 178, y: 20, size: 6, font: font, color: rgb(0.4, 0.4, 0.4),
    });
  } catch (err) {
    logger.warn('Could not embed QR code in PDF', err);
  }

  // Photo
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
