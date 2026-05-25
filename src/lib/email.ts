import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'xfoundationcom@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || '';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_PASS) {
    console.warn('[Email] SMTP_PASS not configured. Email sending is disabled. Set SMTP_PASS in .env to enable.');
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
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
  const transport = getTransporter();
  if (!transport) return false;

  try {
    await transport.sendMail({
      from: `"X.Foundry Website" <${SMTP_USER}>`,
      to: 'xfoundationcom@gmail.com',
      subject: `[X.Foundry] New Inquiry: ${data.serviceType} from ${data.name}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #dc143c, #8b0000); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px;">X<span style="color: #fff;">.</span>Foundry</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 13px;">New Inquiry Received</p>
          </div>
          <div style="padding: 24px;">
            <h2 style="color: #1a1a1a; font-size: 18px; margin-bottom: 16px; border-bottom: 2px solid #dc143c; padding-bottom: 8px;">${data.serviceType}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #f8f8f8;">
                <td style="padding: 10px 12px; font-weight: 700; color: #555; font-size: 13px; border-bottom: 1px solid #eee; width: 140px;">Name</td>
                <td style="padding: 10px 12px; color: #1a1a1a; font-size: 14px; border-bottom: 1px solid #eee;">${data.name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 12px; font-weight: 700; color: #555; font-size: 13px; border-bottom: 1px solid #eee;">Email</td>
                <td style="padding: 10px 12px; color: #1a1a1a; font-size: 14px; border-bottom: 1px solid #eee;"><a href="mailto:${data.email}" style="color: #dc143c;">${data.email}</a></td>
              </tr>
              ${data.phone ? `<tr style="background: #f8f8f8;"><td style="padding: 10px 12px; font-weight: 700; color: #555; font-size: 13px; border-bottom: 1px solid #eee;">Phone</td><td style="padding: 10px 12px; color: #1a1a1a; font-size: 14px; border-bottom: 1px solid #eee;">${data.phone}</td></tr>` : ''}
              ${data.company ? `<tr><td style="padding: 10px 12px; font-weight: 700; color: #555; font-size: 13px; border-bottom: 1px solid #eee;">Company</td><td style="padding: 10px 12px; color: #1a1a1a; font-size: 14px; border-bottom: 1px solid #eee;">${data.company}</td></tr>` : ''}
              ${data.budget ? `<tr style="background: #f8f8f8;"><td style="padding: 10px 12px; font-weight: 700; color: #555; font-size: 13px; border-bottom: 1px solid #eee;">Budget</td><td style="padding: 10px 12px; color: #1a1a1a; font-size: 14px; border-bottom: 1px solid #eee;">${data.budget}</td></tr>` : ''}
            </table>
            <h3 style="color: #1a1a1a; font-size: 15px; margin: 20px 0 8px;">Project Details</h3>
            <p style="color: #333; font-size: 14px; line-height: 1.7; background: #f8f8f8; padding: 16px; border-radius: 6px; border-left: 3px solid #dc143c;">${data.description.replace(/\n/g, '<br>')}</p>
            <p style="color: #999; font-size: 11px; margin-top: 24px; text-align: center;">This inquiry was submitted through the X.Foundry website contact form.</p>
          </div>
        </div>
      `,
    });
    console.log('[Email] Inquiry email sent successfully to xfoundationcom@gmail.com');
    return true;
  } catch (error) {
    console.error('[Email] Failed to send inquiry email:', error);
    return false;
  }
}

export async function sendEnrollmentStatusEmail(data: {
  userName: string;
  userEmail: string;
  courseName: string;
  status: 'approved' | 'declined';
}): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  const isApproved = data.status === 'approved';
  const statusColor = isApproved ? '#22c55e' : '#ef4444';
  const statusLabel = isApproved ? 'Approved' : 'Declined';
  const statusIcon = isApproved ? '&#10003;' : '&#10007;';
  const message = isApproved
    ? `Great news! Your enrollment request for <strong>${data.courseName}</strong> has been <strong>approved</strong>. You now have full access to the course materials, modules, and community resources. Log in to your dashboard to start learning.`
    : `Your enrollment request for <strong>${data.courseName}</strong> has been <strong>declined</strong>. This could be due to high demand or eligibility criteria. You are welcome to re-apply or contact us at xfoundationcom@gmail.com for more information.`;

  try {
    await transport.sendMail({
      from: `"X.Foundry" <${SMTP_USER}>`,
      to: data.userEmail,
      subject: `[X.Foundry] Enrollment ${statusLabel}: ${data.courseName}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0a0a0a, #1a1a1a); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px;">X<span style="color: #dc143c;">.</span>Foundry</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px;">Enrollment Update</p>
          </div>
          <div style="padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 64px; height: 64px; border-radius: 50%; background: ${statusColor}15; border: 2px solid ${statusColor}; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 28px; color: ${statusColor};">${statusIcon}</span>
              </div>
              <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 4px;">Enrollment ${statusLabel}</h2>
              <p style="color: #666; font-size: 14px; margin: 0;">${data.courseName}</p>
            </div>
            <p style="color: #444; font-size: 15px; line-height: 1.8; margin: 0 0 24px;">Hello ${data.userName},<br><br>${message}</p>
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
              <a href="https://xfoundryy.vercel.app" style="display: inline-block; padding: 12px 32px; background: ${isApproved ? '#22c55e' : '#dc143c'}; color: white; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px;">${isApproved ? 'Go to Dashboard' : 'Visit X.Foundry'}</a>
            </div>
            <p style="color: #999; font-size: 11px; margin-top: 28px; text-align: center;">This is an automated email from X.Foundry. Please do not reply to this message.</p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Enrollment ${statusLabel} email sent to ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send enrollment ${statusLabel} email:`, error);
    return false;
  }
}

export async function sendCertificateEmail(data: {
  userName: string;
  userEmail: string;
  courseName: string;
  certificateId: string;
  completionDate: string;
  pdfBuffer?: Buffer;
}): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  const safeFileName = `XFoundry_Certificate_${data.courseName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.certificateId}.pdf`;

  const attachments = data.pdfBuffer ? [{
    filename: safeFileName,
    content: data.pdfBuffer,
    contentType: 'application/pdf',
  }] : [];

  try {
    await transport.sendMail({
      from: `"X.Foundry" <${SMTP_USER}>`,
      to: data.userEmail,
      subject: `[X.Foundry] Certificate of Completion: ${data.courseName}`,
      attachments,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0a0a0a, #1a1a1a); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px;">X<span style="color: #dc143c;">.</span>Foundry</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px;">Certificate of Completion</p>
          </div>
          <div style="padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(220,20,60,0.08); border: 3px solid #dc143c; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 36px; color: #dc143c;">&#127942;</span>
              </div>
              <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 4px;">Congratulations, ${data.userName}!</h2>
              <p style="color: #666; font-size: 14px; margin: 0;">You have successfully completed the course</p>
            </div>
            <div style="background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="color: #dc143c; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 8px; font-weight: 700;">Course</p>
              <h3 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px; font-weight: 700;">${data.courseName}</h3>
              <div style="width: 60px; height: 1px; background: #dc143c; margin: 0 auto 16px;"></div>
              <p style="color: #999; font-size: 12px; margin: 0 0 4px;">Completed on</p>
              <p style="color: #1a1a1a; font-size: 15px; font-weight: 700; margin: 0 0 12px;">${data.completionDate}</p>
              <p style="color: #999; font-size: 12px; margin: 0 0 4px;">Certificate ID</p>
              <p style="color: #dc143c; font-size: 14px; font-weight: 900; letter-spacing: 2px; font-family: 'Courier New', monospace; margin: 0;">${data.certificateId}</p>
            </div>
            <p style="color: #444; font-size: 14px; line-height: 1.8; text-align: center;">This certificate confirms that <strong>${data.userName}</strong> has successfully completed all required modules of <strong>${data.courseName}</strong> and demonstrated proficiency in the subject matter.</p>
            ${data.pdfBuffer ? `
            <div style="background: #f0fdf4; border: 1px solid #22c55e33; border-radius: 8px; padding: 16px; text-align: center; margin-top: 20px;">
              <p style="color: #166534; font-size: 13px; margin: 0;"><strong>PDF Certificate Attached</strong></p>
              <p style="color: #166534; font-size: 12px; margin: 4px 0 0;">Your official certificate is attached to this email as a PDF file. You can save, print, or share it.</p>
            </div>` : ''}
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; margin-top: 20px;">
              <p style="color: #999; font-size: 11px; margin: 0;">This is an automated email from X.Foundry. Please do not reply to this message.</p>
            </div>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Certificate email sent to ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send certificate email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(data: {
  userEmail: string;
  name: string;
  code: string;
}): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  try {
    await transport.sendMail({
      from: `"X.Foundry" <${SMTP_USER}>`,
      to: data.userEmail,
      subject: '[X.Foundry] Password Reset Code',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0a0a0a, #1a1a1a); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px;">X<span style="color: #dc143c;">.</span>Foundry</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px;">Password Reset</p>
          </div>
          <div style="padding: 32px 24px; text-align: center;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(220,20,60,0.08); border: 2px solid #dc143c; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="font-size: 28px; color: #dc143c;">&#128273;</span>
            </div>
            <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 8px;">Password Reset Request</h2>
            <p style="color: #666; font-size: 14px; margin: 0 0 24px; line-height: 1.7;">Hello ${data.name},<br>We received a request to reset your password. Use the verification code below to proceed.</p>
            <div style="background: #f8f8f8; border: 2px dashed #dc143c; border-radius: 8px; padding: 20px; margin: 0 auto 24px; display: inline-block; min-width: 200px;">
              <p style="color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px; font-weight: 700;">Verification Code</p>
              <p style="color: #dc143c; font-size: 36px; font-weight: 900; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${data.code}</p>
            </div>
            <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 0 0 24px;">This code will expire in <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
            <div style="padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 11px; margin: 0;">This is an automated email from X.Foundry. Please do not reply to this message.</p>
            </div>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Password reset email sent to ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
    return false;
  }
}
