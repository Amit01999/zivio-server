import * as nodemailer from 'nodemailer';

function createTransporter() {
  const host = process.env.MAIL_HOST;
  const port = parseInt(process.env.MAIL_PORT || '587', 10);
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error('Mail configuration missing. Set MAIL_HOST, MAIL_USER, MAIL_PASS in environment.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendOtpEmail(to: string, otp: string, name: string): Promise<void> {
  const transporter = createTransporter();
  const from = `"ZivioLiving" <${process.env.MAIL_USER}>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset OTP</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#401F48;padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                ZivioLiving
              </h1>
              <p style="margin:4px 0 0;color:#d8bfe8;font-size:13px;">Real Estate Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#1a1a2e;font-weight:600;">
                Hello, ${name} 👋
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;">
                We received a request to reset your ZivioLiving account password.
                Use the OTP below to proceed. This code expires in <strong>5 minutes</strong>.
              </p>
              <!-- OTP Box -->
              <div style="background:#f7f3fa;border:2px dashed #401F48;border-radius:10px;padding:20px;text-align:center;margin:0 0 24px;">
                <p style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">
                  Your One-Time Password
                </p>
                <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#401F48;">
                  ${otp}
                </span>
              </div>
              <p style="margin:0 0 16px;font-size:13px;color:#666;line-height:1.6;">
                If you did not request a password reset, please ignore this email.
                Your account remains secure and no changes have been made.
              </p>
              <p style="margin:0;font-size:13px;color:#999;">
                For security reasons, do not share this OTP with anyone.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f7;padding:16px 40px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0;font-size:11px;color:#aaa;">
                © ${new Date().getFullYear()} ZivioLiving. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from,
    to,
    subject: `${otp} — Your ZivioLiving Password Reset OTP`,
    text: `Hello ${name},\n\nYour OTP for password reset is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, please ignore this email.\n\n— ZivioLiving Team`,
    html,
  });
}
