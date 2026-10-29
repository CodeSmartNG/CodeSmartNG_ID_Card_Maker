import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';
import { generateQrDataUrl } from './qrService.js';
import { logger } from '../config/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');
const STYLES_DIR = path.join(TEMPLATES_DIR, 'styles');

/* ---------- compile & cache templates ---------- */
const templateCache = new Map();
const styleCache = new Map();

const loadTemplate = (name) => {
  if (!templateCache.has(name)) {
    const file = readFileSync(path.join(TEMPLATES_DIR, `${name}.hbs`), 'utf-8');
    templateCache.set(name, Handlebars.compile(file, { noEscape: false }));
  }
  return templateCache.get(name);
};

const loadStyle = (templateName) => {
  const valid = ['classic', 'modern', 'minimal'];
  const safe = valid.includes(templateName) ? templateName : 'classic';
  if (!styleCache.has(safe)) {
    const css = readFileSync(path.join(STYLES_DIR, `${safe}.css`), 'utf-8');
    styleCache.set(safe, css);
  }
  return styleCache.get(safe);
};

/* ---------- placeholder photo (data URL, no network) ---------- */
const PLACEHOLDER_PHOTO =
  'data:image/svg+xml;base64,' +
  Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="260" viewBox="0 0 220 260">
      <rect width="220" height="260" fill="#e2e8f0"/>
      <circle cx="110" cy="100" r="45" fill="#94a3b8"/>
      <path d="M30 260 Q30 180 110 180 Q190 180 190 260 Z" fill="#94a3b8"/>
    </svg>
  `).toString('base64');

/* ---------- prepare view-model ---------- */
const buildView = async ({ card, member, organization }) => {
  const qrDataUrl = await generateQrDataUrl(card.verificationId);

  return {
    card: {
      cardNumber: card.cardNumber,
      verificationId: card.verificationId,
    },
    member: {
      firstName: member.firstName,
      lastName: member.lastName,
      memberNumber: member.memberNumber,
      position: member.position || '—',
      department: member.department || '—',
      email: member.email,
      phone: member.phone,
      photoUrl: member.photoUrl,
    },
    organization: {
      name: organization.name,
      tagline: organization.tagline || 'Excellence · Integrity · Service',
      logoUrl: organization.logoUrl,
      website: organization.website || 'www.example.com',
      email: organization.email || '—',
      phone: organization.phone || '—',
      address: organization.address || '—',
    },
    qrDataUrl,
    placeholderPhoto: PLACEHOLDER_PHOTO,
    formattedIssued: format(card.issuedAt || new Date(), 'dd MMM yyyy'),
    formattedExpiry: format(
      card.expiresAt || new Date(Date.now() + 2 * 365 * 86400 * 1000),
      'dd MMM yyyy'
    ),
  };
};

/* ---------- render one side to HTML ---------- */
const renderSideHtml = (side, view, templateName) => {
  const template = loadTemplate(`card-${side}`);
  const styles = loadStyle(templateName);
  return template({ ...view, injectedStyles: styles });
};

/* ---------- generate PDF (front + back) ---------- */
let browserPromise = null;
const getBrowser = async () => {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
      ],
    });
    logger.info('Puppeteer browser launched');
  }
  return browserPromise;
};

export const closeBrowser = async () => {
  if (browserPromise) {
    const b = await browserPromise;
    await b.close();
    browserPromise = null;
    logger.info('Puppeteer browser closed');
  }
};

/**
 * Generate a PDF (2 pages: front + back) for an ID card.
 * Returns { buffer, pageWidthIn, pageHeightIn }
 */
export const generateCardPdf = async ({ card, member, organization, templateName = 'classic' }) => {
  const view = await buildView({ card, member, organization });

  const frontHtml = renderSideHtml('front', view, templateName);
  const backHtml = renderSideHtml('back', view, templateName);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1013, height: 638, deviceScaleFactor: 1 });

    // Front page
    await page.setContent(frontHtml, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');
    const frontPdf = await page.pdf({
      width: '3.375in',
      height: '2.125in',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: false,
    });

    // Back page
    await page.setContent(backHtml, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');
    const backPdf = await page.pdf({
      width: '3.375in',
      height: '2.125in',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    // Merge front + back → 2-page PDF
    const merged = await mergePdfs([frontPdf, backPdf]);

    return {
      buffer: merged,
      template: templateName,
      widthIn: 3.375,
      heightIn: 2.125,
    };
  } finally {
    await page.close();
  }
};

/**
 * Generate a print-sheet PDF: N cards tiled on A4.
 * Useful for bulk printing.
 */
export const generatePrintSheet = async (cardsData, templateName = 'classic') => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const renderedCards = await Promise.all(
      cardsData.map(async (data) => {
        const view = await buildView(data);
        const front = renderSideHtml('front', view, templateName);
        const back = renderSideHtml('back', view, templateName);
        return { front, back };
      })
    );

    // Interleave: front1, back1, front2, back2...
    const pages = renderedCards.flatMap((c) => [c.front, c.back]).join(
      '<div style="page-break-after:always"></div>'
    );

    await page.setContent(
      `<html><body style="margin:0">${pages}</body></html>`,
      { waitUntil: 'networkidle0' }
    );
    await page.emulateMediaType('print');

    return await page.pdf({
      width: '3.375in',
      height: '2.125in',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  } finally {
    await page.close();
  }
};

/* ---------- PDF merge (lightweight, no system deps) ---------- */
import { PDFDocument } from 'pdf-lib';

const mergePdfs = async (buffers) => {
  const merged = await PDFDocument.create();
  for (const buf of buffers) {
    const doc = await PDFDocument.load(buf);
    const [page] = await merged.copyPages(doc, [0]);
    merged.addPage(page);
  }
  return Buffer.from(await merged.save());
};

/* ---------- preview (base64 for browser) ---------- */
export const generateCardPreview = async (data) => {
  const result = await generateCardPdf(data);
  return {
    pdfBase64: result.buffer.toString('base64'),
    template: result.template,
  };
};
