import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import path from 'path';

const templateCache = new Map();
const loadTemplate = (name) => {
  if (!templateCache.has(name)) {
    const file = readFileSync(path.resolve(`./src/templates/${name}.hbs`), 'utf-8');
    templateCache.set(name, Handlebars.compile(file));
  }
  return templateCache.get(name);
};

export const renderCardHtml = ({ member, organization, qrDataUrl, side }) => {
  const template = loadTemplate(`card-${side}`);
  return template({ member, organization, qrDataUrl });
};

export const generateCardPdf = async (data) => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const html = `
      <html><body style="margin:0">
        ${renderCardHtml({ ...data, side: 'front' })}
        <div style="page-break-before:always"></div>
        ${renderCardHtml({ ...data, side: 'back' })}
      </body></html>`;
    await page.setContent(html, { waitUntil: 'networkidle0' });
    return await page.pdf({
      width: '3.375in',
      height: '2.125in',
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
};
