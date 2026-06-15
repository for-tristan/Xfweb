import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';


const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';


const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';


function createSmtpTransporter(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null {
  if (!SMTP_PASS) {
    return null;
  }
  const options: SMTPTransport.Options = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    connectionTimeout: 5_000,
    greetingTimeout: 3_000,
    socketTimeout: 8_000,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  };
  return nodemailer.createTransport(options);
}


function isGmailConfigured(): boolean {
  return SMTP_HOST.length > 0 && SMTP_USER.length > 0 && SMTP_PASS.length > 0;
}

function isResendConfigured(): boolean {
  return RESEND_API_KEY.length > 0;
}

function getConfiguredProviders(): string {
  const providers: string[] = [];
  if (isGmailConfigured()) providers.push('Gmail');
  if (isResendConfigured()) providers.push('Resend');
  return providers.length > 0 ? providers.join(' + Resend fallback') : 'None';
}

console.log(`[Email] Provider: ${getConfiguredProviders()}`);


interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}


async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const toStr = Array.isArray(payload.to) ? payload.to.join(', ') : payload.to;

  if (isGmailConfigured()) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const transport = createSmtpTransporter();
      if (!transport) break;

      try {
        await transport.sendMail({
          from: payload.from || `"XFoundry" <${SMTP_USER}>`,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          attachments: payload.attachments,
        });
        transport.close();
        console.log(`[Email] Sent via Gmail${attempt > 1 ? ` (attempt ${attempt})` : ''}`);
        return true;
      } catch (error: any) {
        try { transport.close(); } catch {}
        const code = error?.code || '';

        if (code === 'EAUTH') {
          console.error('[Email] Gmail auth failed — check SMTP_PASS is an App Password (not your Gmail password)');
          break;
        }

        console.error(`[Email] Gmail attempt ${attempt}/3 failed: ${error?.message || error}`);

        if (attempt < 3) {
          const delay = code === 'ECONNREFUSED' || code === 'ETIMEDOUT' ? 1500 : 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  if (isResendConfigured()) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      const resendPayload: any = {
        from: payload.from || `"XFoundry" <${RESEND_FROM_EMAIL}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      };
      if (payload.attachments && payload.attachments.length > 0) {
        resendPayload.attachments = payload.attachments.map(a => ({
          filename: a.filename,
          content: a.content.toString('base64'),
          contentType: a.contentType,
        }));
      }
      const { error } = await resend.emails.send(resendPayload);
      if (error) {
        console.error('[Email] Resend fallback error:', error.message);
      } else {
        console.log('[Email] Sent via Resend (fallback)');
        return true;
      }
    } catch (err: any) {
      console.error('[Email] Resend fallback exception:', err?.message || err);
    }
  }

  console.error(
    '[Email] All providers failed! Configure:\n' +
    '  - SMTP_PASS = Gmail App Password (primary) — https://myaccount.google.com/apppasswords\n' +
    '  - RESEND_API_KEY (fallback) — https://resend.com'
  );
  return false;
}


function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}


const EMAIL_FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
const COLOR_ACCENT = '#dc143c';
const COLOR_TEXT = '#1a1a1a';
const COLOR_LIGHT = '#737373';
const COLOR_BG = '#fafafa';
const COLOR_BORDER = '#e5e5e5';

function emailWrapper(content: string): string {
  return `
    <div style="font-family: ${EMAIL_FONT}; max-width: 560px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
      <div style="margin-bottom: 36px;">
        <span style="font-size: 20px; font-weight: 700; color: ${COLOR_TEXT}; letter-spacing: -0.5px;">XFoundry</span>
      </div>
      ${content}
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid ${COLOR_BORDER};">
        <p style="color: #a3a3a3; font-size: 12px; line-height: 1.5; margin: 0;">XFoundry<br>${process.env.NEXT_PUBLIC_BASE_URL || 'xfoundryy.vercel.app'}</p>
      </div>
    </div>
  `;
}

function codeBlock(code: string): string {
  return `
    <div style="background: ${COLOR_BG}; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
      <p style="font-family: 'SF Mono', 'Courier New', monospace; font-size: 32px; font-weight: 600; letter-spacing: 6px; color: ${COLOR_TEXT}; margin: 0;">${code}</p>
    </div>
  `;
}

function button(text: string, url: string): string {
  return `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${url}" style="display: inline-block; padding: 12px 28px; background: ${COLOR_TEXT}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">${text}</a>
    </div>
  `;
}


export async function sendInquiryEmail(data: {
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  serviceType: string;
  budget?: string | null;
  description: string;
}): Promise<boolean> {
  return sendEmail({
    to: 'xfoundationcom@gmail.com',
    subject: `New Inquiry: ${sanitizeHtml(data.serviceType)}`,
    html: emailWrapper(`
      <h1 style="font-size: 18px; font-weight: 600; color: ${COLOR_TEXT}; margin: 0 0 24px;">New Inquiry</h1>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: ${COLOR_LIGHT}; width: 100px; vertical-align: top;">Name</td>
          <td style="padding: 8px 0; color: ${COLOR_TEXT}; font-weight: 500;">${sanitizeHtml(data.name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${COLOR_LIGHT}; vertical-align: top;">Email</td>
          <td style="padding: 8px 0;"><a href="mailto:${sanitizeHtml(data.email)}" style="color: ${COLOR_ACCENT}; text-decoration: none;">${sanitizeHtml(data.email)}</a></td>
        </tr>
        ${data.phone ? `<tr><td style="padding: 8px 0; color: ${COLOR_LIGHT}; vertical-align: top;">Phone</td><td style="padding: 8px 0; color: ${COLOR_TEXT};">${sanitizeHtml(data.phone)}</td></tr>` : ''}
        ${data.company ? `<tr><td style="padding: 8px 0; color: ${COLOR_LIGHT}; vertical-align: top;">Company</td><td style="padding: 8px 0; color: ${COLOR_TEXT};">${sanitizeHtml(data.company)}</td></tr>` : ''}
        <tr>
          <td style="padding: 8px 0; color: ${COLOR_LIGHT}; vertical-align: top;">Service</td>
          <td style="padding: 8px 0; color: ${COLOR_TEXT}; font-weight: 500;">${sanitizeHtml(data.serviceType)}</td>
        </tr>
        ${data.budget ? `<tr><td style="padding: 8px 0; color: ${COLOR_LIGHT}; vertical-align: top;">Budget</td><td style="padding: 8px 0; color: ${COLOR_TEXT};">${sanitizeHtml(data.budget)}</td></tr>` : ''}
      </table>
      <div style="margin-top: 20px; padding: 16px; background: ${COLOR_BG}; border-radius: 8px;">
        <p style="font-size: 12px; color: ${COLOR_LIGHT}; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
        <p style="font-size: 14px; color: ${COLOR_TEXT}; line-height: 1.6; margin: 0;">${sanitizeHtml(data.description).replace(/\n/g, '<br>')}</p>
      </div>
    `),
  });
}

export async function sendEnrollmentStatusEmail(data: {
  userName: string;
  userEmail: string;
  courseName: string;
  status: 'approved' | 'declined';
}): Promise<boolean> {
  const isApproved = data.status === 'approved';
  const statusLabel = isApproved ? 'Approved' : 'Declined';

  const message = isApproved
    ? `Your enrollment for <strong>${sanitizeHtml(data.courseName)}</strong> has been approved. You now have full access to the course materials and modules.`
    : `Your enrollment for <strong>${sanitizeHtml(data.courseName)}</strong> has been declined. This may be due to capacity or eligibility. Feel free to reach out if you have questions.`;

  return sendEmail({
    to: data.userEmail,
    subject: `Enrollment ${statusLabel}`,
    html: emailWrapper(`
      <h1 style="font-size: 18px; font-weight: 600; color: ${COLOR_TEXT}; margin: 0 0 6px;">Enrollment ${statusLabel}</h1>
      <p style="font-size: 14px; color: ${COLOR_LIGHT}; margin: 0 0 24px;">${sanitizeHtml(data.courseName)}</p>
      <p style="font-size: 15px; color: ${COLOR_TEXT}; line-height: 1.7; margin: 0 0 8px;">Hi ${sanitizeHtml(data.userName)},</p>
      <p style="font-size: 15px; color: #404040; line-height: 1.7; margin: 0 0 28px;">${message}</p>
      ${button(isApproved ? 'Go to Dashboard' : 'Visit XFoundry', process.env.NEXT_PUBLIC_BASE_URL || 'https://xfoundryy.vercel.app')}
    `),
  });
}

export async function sendCertificateEmail(data: {
  userName: string;
  userEmail: string;
  courseName: string;
  certificateId: string;
  completionDate: string;
  pdfBuffer?: Buffer;
}): Promise<boolean> {
  const safeFileName = `XFoundry_Certificate_${data.courseName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.certificateId}.pdf`;

  return sendEmail({
    to: data.userEmail,
    subject: `Certificate of Completion`,
    html: emailWrapper(`
      <h1 style="font-size: 18px; font-weight: 600; color: ${COLOR_TEXT}; margin: 0 0 24px;">Course Completed</h1>
      <p style="font-size: 15px; color: ${COLOR_TEXT}; line-height: 1.7; margin: 0 0 24px;">Hi ${sanitizeHtml(data.userName)},</p>
      <p style="font-size: 15px; color: #404040; line-height: 1.7; margin: 0 0 28px;">Congratulations on completing <strong>${sanitizeHtml(data.courseName)}</strong>. Your certificate is confirmed below.</p>
      <div style="background: ${COLOR_BG}; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <p style="font-size: 13px; color: ${COLOR_LIGHT}; margin: 0 0 4px;">Course</p>
        <p style="font-size: 15px; color: ${COLOR_TEXT}; font-weight: 500; margin: 0 0 16px;">${sanitizeHtml(data.courseName)}</p>
        <p style="font-size: 13px; color: ${COLOR_LIGHT}; margin: 0 0 4px;">Completed</p>
        <p style="font-size: 15px; color: ${COLOR_TEXT}; margin: 0 0 16px;">${sanitizeHtml(data.completionDate)}</p>
        <p style="font-size: 13px; color: ${COLOR_LIGHT}; margin: 0 0 4px;">Certificate ID</p>
        <p style="font-family: 'SF Mono', 'Courier New', monospace; font-size: 13px; color: ${COLOR_LIGHT}; margin: 0;">${sanitizeHtml(data.certificateId)}</p>
      </div>
      ${data.pdfBuffer ? `
      <p style="font-size: 14px; color: #404040; line-height: 1.6; margin: 24px 0 0;">Your PDF certificate is attached to this email.</p>
      ` : ''}
    `),
    attachments: data.pdfBuffer ? [{
      filename: safeFileName,
      content: data.pdfBuffer,
      contentType: 'application/pdf',
    }] : undefined,
  });
}

export async function sendPasswordResetEmail(data: {
  userEmail: string;
  name: string;
  code: string;
}): Promise<boolean> {
  return sendEmail({
    to: data.userEmail,
    subject: 'Reset your password',
    html: emailWrapper(`
      <h1 style="font-size: 18px; font-weight: 600; color: ${COLOR_TEXT}; margin: 0 0 24px;">Reset your password</h1>
      <p style="font-size: 15px; color: ${COLOR_TEXT}; line-height: 1.7; margin: 0 0 8px;">Hi ${sanitizeHtml(data.name)},</p>
      <p style="font-size: 15px; color: #404040; line-height: 1.7; margin: 0 0 4px;">Use this code to reset your password:</p>
      ${codeBlock(data.code)}
      <p style="font-size: 13px; color: ${COLOR_LIGHT}; line-height: 1.6; margin: 0;">This code expires in <strong>15 minutes</strong>. If you didn't request this, you can ignore this email.</p>
    `),
  });
}

export async function sendEmailVerificationEmail(data: {
  userEmail: string;
  name: string;
  code: string;
}): Promise<boolean> {
  return sendEmail({
    to: data.userEmail,
    subject: 'Verify your email',
    html: emailWrapper(`
      <h1 style="font-size: 18px; font-weight: 600; color: ${COLOR_TEXT}; margin: 0 0 24px;">Verify your email</h1>
      <p style="font-size: 15px; color: ${COLOR_TEXT}; line-height: 1.7; margin: 0 0 8px;">Hi ${sanitizeHtml(data.name)},</p>
      <p style="font-size: 15px; color: #404040; line-height: 1.7; margin: 0 0 4px;">Enter this code to verify your email address:</p>
      ${codeBlock(data.code)}
      <p style="font-size: 13px; color: ${COLOR_LIGHT}; line-height: 1.6; margin: 0;">This code expires in <strong>24 hours</strong>. If you didn't create an account, you can ignore this email.</p>
    `),
  });
}
