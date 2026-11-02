import { Resend } from 'resend';
import { logger } from '../config/logger.js';

// Initialize Resend (it will use process.env.RESEND_API_KEY)
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendCardReadyEmail = async ({ to, memberName, organizationName, cardNumber, pdfUrl }) => {
  if (!to) {
    logger.warn('No email address provided for member. Skipping email.');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      // ⚠️ IMPORTANT: Until you verify a custom domain on Resend, you MUST use onboarding@resend.dev
      from: 'CodeSmartNG <onboarding@resend.dev>', 
      to: [to],
      subject: `Your ID Card is Ready - ${organizationName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin: 0;">ID Card Ready 🎉</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <p style="font-size: 16px; color: #334155;">Hello <strong>${memberName}</strong>,</p>
            <p style="font-size: 16px; color: #334155; line-height: 1.5;">
              Your official ID card for <strong>${organizationName}</strong> has been successfully generated.
            </p>
            
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">Card Number</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-family: monospace; font-weight: bold; color: #0f172a;">${cardNumber}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${pdfUrl}" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Download Your ID Card
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CodeSmartNG. All rights reserved.</p>
            <p>If the button doesn't work, copy this link: <br/> <a href="${pdfUrl}" style="color: #6366f1;">${pdfUrl}</a></p>
          </div>
        </div>
      `,
    });

    if (error) {
      logger.error({ error }, 'Failed to send email via Resend');
      return;
    }

    logger.info({ emailId: data.id, to }, '✅ Email sent successfully');
  } catch (err) {
    logger.error({ err }, 'Email service crashed');
  }
};
