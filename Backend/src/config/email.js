import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "neharani78959@gmail.com",
    pass: process.env.SMTP_PASS || "your_password",
  },
});

// Wrapper for sending email
export const sendEmail = async (options) => {
  await transporter.sendMail({
    from: options.from || '"System" <system@example.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};

export default transporter;
