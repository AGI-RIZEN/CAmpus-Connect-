import nodemailer from 'nodemailer';
import { env } from './env';

export const transporter = nodemailer.createTransport({
  host: env.BREVO_SMTP_HOST,
  port: env.BREVO_SMTP_PORT,
  secure: false, // Brevo uses STARTTLS on 587
  auth: {
    user: env.BREVO_SMTP_USER,
    pass: env.BREVO_SMTP_PASS,
  },
});

export type EmailTemplate =
  | 'otp-verify'
  | 'password-reset'
  | 'account-approved'
  | 'account-rejected'
  | 'account-banned';

interface TemplateData {
  'otp-verify': { fullName: string; code: string };
  'password-reset': { fullName: string; resetToken: string; resetUrl: string };
  'account-approved': { fullName: string };
  'account-rejected': { fullName: string; reason: string };
  'account-banned': { fullName: string; reason: string };
}

function renderTemplate<T extends EmailTemplate>(
  template: T,
  data: TemplateData[T]
): { subject: string; html: string } {
  switch (template) {
    case 'otp-verify': {
      const d = data as TemplateData['otp-verify'];
      return {
        subject: 'Your Campus Connect verification code',
        html: `<p>Hi ${d.fullName},</p><p>Your verification code is <strong>${d.code}</strong>. It expires in 5 minutes.</p>`,
      };
    }
    case 'password-reset': {
      const d = data as TemplateData['password-reset'];
      return {
        subject: 'Reset your Campus Connect password',
        html: `<p>Hi ${d.fullName},</p><p>Your reset code is <strong>${d.resetToken}</strong> — paste it into the app's "Reset code" field. It expires in 30 minutes.</p><p>Or tap this link on your phone: <a href="${d.resetUrl}">${d.resetUrl}</a></p>`,
      };
    }
    case 'account-approved': {
      const d = data as TemplateData['account-approved'];
      return {
        subject: 'Your Campus Connect account is approved',
        html: `<p>Hi ${d.fullName},</p><p>Your account has been approved. Welcome to Campus Connect!</p>`,
      };
    }
    case 'account-rejected': {
      const d = data as TemplateData['account-rejected'];
      return {
        subject: 'Your Campus Connect registration was not approved',
        html: `<p>Hi ${d.fullName},</p><p>Your registration was not approved.</p><p><strong>Reason:</strong> ${d.reason}</p>`,
      };
    }
    case 'account-banned': {
      const d = data as TemplateData['account-banned'];
      return {
        subject: 'Your Campus Connect account has been suspended',
        html: `<p>Hi ${d.fullName},</p><p>Your account has been suspended.</p><p><strong>Reason:</strong> ${d.reason}</p>`,
      };
    }
    default:
      throw new Error(`Unknown email template: ${template satisfies never}`);
  }
}

export async function sendMail<T extends EmailTemplate>(params: {
  to: string;
  template: T;
  data: TemplateData[T];
}): Promise<void> {
  const { subject, html } = renderTemplate(params.template, params.data);
  await transporter.sendMail({ from: env.MAIL_FROM, to: params.to, subject, html });
}
