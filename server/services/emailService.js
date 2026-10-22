import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(email, resetUrl) {
  if (!process.env.GMAIL_USER) {
    throw new Error("GMAIL_USER is missing from server/.env");
  }

  if (!process.env.GMAIL_APP_PASSWORD) {
    throw new Error("GMAIL_APP_PASSWORD is missing from server/.env");
  }

  try {
    const info = await transporter.sendMail({
      from: {
        name: "KisanVision AI",
        address: process.env.GMAIL_USER,
      },
      to: email,
      subject: "Reset your KisanVision AI password",
      text: `We received a request to reset your KisanVision AI password.

Reset your password using this link:
${resetUrl}

This link expires in 15 minutes and can only be used once.

If you did not request a password reset, you can ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#183528">
          <h2 style="color:#166534">KisanVision AI</h2>
          <h3>Password reset request</h3>
          <p>We received a request to reset the password for your account.</p>
          <p>
            <a href="${resetUrl}"
               style="display:inline-block;background:#166534;color:white;text-decoration:none;padding:12px 20px;border-radius:8px">
              Reset password
            </a>
          </p>
          <p>This link expires in 15 minutes and can only be used once.</p>
          <p>If you didn't request a password reset, you can ignore this email.</p>
          <hr style="border:0;border-top:1px solid #ddd;margin-top:28px" />
          <small>KisanVision AI account security</small>
        </div>
      `,
    });

    console.log("Password reset email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Gmail email error:", error.message);
    throw new Error("Password reset email could not be sent.");
  }
}
