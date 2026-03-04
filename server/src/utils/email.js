import nodemailer from "nodemailer";
import crypto from "crypto";

const {
  SMTP_HOST = "",
  SMTP_PORT = "587",
  SMTP_SECURE = "false",
  SMTP_USER = "",
  SMTP_PASS = "",
  SMTP_FROM = "",
  SMTP_FROM_NAME = "Lakminda Fashion",
  MAIL_DOMAIN = ""
} = process.env;

const canSendEmail = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const extractDomain = (email) => {
  const parts = String(email || "").split("@");
  return parts.length > 1 ? parts[1].toLowerCase() : "";
};

const fromAddress = SMTP_FROM || SMTP_USER;
const fromDomain = extractDomain(fromAddress);
const mailDomain = (MAIL_DOMAIN || fromDomain).toLowerCase();

let transporter = null;
if (canSendEmail) {
  const transportConfig = {
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  };

  if (mailDomain && fromDomain && mailDomain !== fromDomain) {
    console.warn(
      `[Email Verification] MAIL_DOMAIN (${mailDomain}) does not match SMTP_FROM domain (${fromDomain}). ` +
        "Use the same custom domain for SPF/DKIM/DMARC alignment."
    );
  }

  transporter = nodemailer.createTransport(transportConfig);
}

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getVerificationEmailHtml = ({ name, verificationUrl }) => {
  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(verificationUrl);
  const safeDomain = escapeHtml(mailDomain || "lakmindafashion.com");

  return `
    <div style="margin:0;padding:0;background:#f4ede3;font-family:Arial,sans-serif;color:#1b1b1b;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #e3d5c6;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="background:#be5f2f;color:#fff6ef;padding:18px 24px;font-size:20px;font-weight:700;letter-spacing:.04em;">
                  LAKMINDA FASHION
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <h2 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#121212;">Verify Your Email Address</h2>
                  <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hi ${safeName},</p>
                  <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
                    Thanks for creating your account. Please verify your email to activate login and checkout access.
                  </p>
                  <p style="margin:0 0 22px;">
                    <a href="${safeUrl}" style="display:inline-block;background:#be5f2f;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">
                      Verify Email
                    </a>
                  </p>
                  <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#645446;">
                    This link expires in 24 hours.
                  </p>
                  <p style="margin:0;font-size:12px;line-height:1.5;color:#7a6b5d;word-break:break-all;">
                    If the button does not work, copy and paste this URL:<br />
                    <a href="${safeUrl}" style="color:#8f3812;">${safeUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 24px;background:#fbf6ef;border-top:1px solid #ece0d4;font-size:12px;color:#7a6b5d;">
                  Sent by ${safeDomain}. Please keep this email for your records.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
};

const getVerificationEmailText = ({ name, verificationUrl }) =>
  `Hi ${name || "there"},

Please verify your Lakminda Fashion account using this link:
${verificationUrl}

This link expires in 24 hours.`;

const getResetPasswordEmailHtml = ({ name, resetUrl }) => {
  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(resetUrl);
  const safeDomain = escapeHtml(mailDomain || "lakmindafashion.com");

  return `
    <div style="margin:0;padding:0;background:#f4ede3;font-family:Arial,sans-serif;color:#1b1b1b;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #e3d5c6;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="background:#2a2a2a;color:#fff;padding:18px 24px;font-size:20px;font-weight:700;letter-spacing:.04em;">
                  LAKMINDA FASHION
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <h2 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#121212;">Reset Your Password</h2>
                  <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hi ${safeName},</p>
                  <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
                    We received a request to reset your account password. Click below to continue.
                  </p>
                  <p style="margin:0 0 22px;">
                    <a href="${safeUrl}" style="display:inline-block;background:#be5f2f;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">
                      Reset Password
                    </a>
                  </p>
                  <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#645446;">
                    This link expires in 1 hour.
                  </p>
                  <p style="margin:0;font-size:12px;line-height:1.5;color:#7a6b5d;word-break:break-all;">
                    If the button does not work, copy and paste this URL:<br />
                    <a href="${safeUrl}" style="color:#8f3812;">${safeUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 24px;background:#fbf6ef;border-top:1px solid #ece0d4;font-size:12px;color:#7a6b5d;">
                  Sent by ${safeDomain}. If you did not request this, you can ignore this email.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
};

const getResetPasswordEmailText = ({ name, resetUrl }) =>
  `Hi ${name || "there"},

We received a request to reset your Lakminda Fashion account password.
Use this link to reset your password:
${resetUrl}

This link expires in 1 hour.
If you did not request this, ignore this email.`;

const buildMessageId = () => `<verify-${Date.now()}-${crypto.randomBytes(6).toString("hex")}@${mailDomain || "localhost"}>`;

if (!canSendEmail) {
  console.warn("[Email Verification] SMTP credentials are missing. Email sending is disabled.");
}

export const sendVerificationEmail = async ({ to, name, verificationUrl }) => {
  if (!transporter) {
    console.log(`[Email Verification] SMTP not configured. Open this URL manually for ${to}: ${verificationUrl}`);
    return { delivered: false };
  }

  await transporter.sendMail({
    from: `"${SMTP_FROM_NAME}" <${fromAddress}>`,
    replyTo: fromAddress,
    to,
    subject: "Verify your Lakminda Fashion account",
    text: getVerificationEmailText({ name, verificationUrl }),
    html: getVerificationEmailHtml({ name, verificationUrl }),
    messageId: buildMessageId(),
    headers: {
      "X-Auto-Response-Suppress": "All",
      "List-Unsubscribe": `<mailto:unsubscribe@${mailDomain || "localhost"}>`
    }
  });

  return { delivered: true };
};

export const sendResetPasswordEmail = async ({ to, name, resetUrl }) => {
  if (!transporter) {
    console.log(`[Password Reset] SMTP not configured. Open this URL manually for ${to}: ${resetUrl}`);
    return { delivered: false };
  }

  await transporter.sendMail({
    from: `"${SMTP_FROM_NAME}" <${fromAddress}>`,
    replyTo: fromAddress,
    to,
    subject: "Reset your Lakminda Fashion password",
    text: getResetPasswordEmailText({ name, resetUrl }),
    html: getResetPasswordEmailHtml({ name, resetUrl }),
    messageId: buildMessageId(),
    headers: {
      "X-Auto-Response-Suppress": "All"
    }
  });

  return { delivered: true };
};
