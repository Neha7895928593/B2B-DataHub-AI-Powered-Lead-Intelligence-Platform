import nodemailer from "nodemailer";

const createTransporter = () => {
  const host = process.env.SMTP_HOST;

  if (host) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }

  console.warn("SMTP not configured. Using in-memory mail transport for development.");
  return nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true,
  });
};

export const sendMail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "B2B DataHub <no-reply@b2bdatahub.com>";

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });
};
