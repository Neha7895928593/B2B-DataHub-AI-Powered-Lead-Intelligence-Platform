import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/db.js";
import { sendMail } from "../config/mailer.js";

const signToken = (user) =>
  jwt.sign(
    {
      id: user.user_id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

const sanitizeUser = (user) => ({
  id: user.user_id,
  fullName: user.full_name,
  email: user.email,
  role: user.role,
  createdAt: user.created_at,
});

export const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await pool.query("SELECT user_id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (existingUser.rows.length) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, full_name, email, role, created_at`,
      [fullName, email.toLowerCase(), passwordHash, "user"],
    );

    const user = result.rows[0];
    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ success: false, message: "Unable to create account" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      `SELECT user_id, full_name, email, role, created_at, password_hash
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()],
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Unable to login" });
  }
};

export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
};

const hashResetToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await pool.query(
      `SELECT user_id, full_name, email FROM users WHERE email = $1`,
      [email.toLowerCase()],
    );

    if (!result.rows.length) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, a reset link has been generated.",
      });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = hashResetToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.user_id, resetTokenHash, expiresAt],
    );

    const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:8080,http://localhost:8081";
    const origins = frontendOrigin.split(",").map((origin) => origin.trim()).filter(Boolean);
    const appOrigin = origins[0] || "http://localhost:8081";
    const resetLink = `${appOrigin}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    await sendMail({
      to: user.email,
      subject: "Reset your B2B DataHub password",
      text: `Reset your password using this link: ${resetLink}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
          <h2 style="margin:0 0 12px">Reset your password</h2>
          <p style="margin:0 0 12px">We received a password reset request for <strong>${user.email}</strong>.</p>
          <p style="margin:0 0 16px">Use the link below to set a new password. This link expires in 1 hour.</p>
          <p><a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Reset Password</a></p>
          <p style="margin-top:16px;color:#666;font-size:12px;word-break:break-all">${resetLink}</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset email sent.",
    });
  } catch (error) {
    console.error("Request password reset error:", error);
    return res.status(500).json({ success: false, message: "Unable to generate reset link" });
  }
};

export const resetPassword = async (req, res) => {
  const client = await pool.connect();
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Token, email, and new password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const userResult = await pool.query(
      `SELECT user_id, email FROM users WHERE email = $1`,
      [email.toLowerCase()],
    );

    if (!userResult.rows.length) {
      return res.status(400).json({ success: false, message: "Invalid reset link" });
    }

    const tokenHash = hashResetToken(token);
    const resetResult = await pool.query(
      `SELECT reset_id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token_hash = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [tokenHash, userResult.rows[0].user_id],
    );

    if (!resetResult.rows.length) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    const resetRow = resetResult.rows[0];
    if (resetRow.used_at || new Date(resetRow.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await client.query("BEGIN");
    await client.query(`UPDATE users SET password_hash = $1 WHERE user_id = $2`, [
      passwordHash,
      resetRow.user_id,
    ]);
    await client.query(
      `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE reset_id = $1`,
      [resetRow.reset_id],
    );
    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Unable to reset password" });
  } finally {
    client.release();
  }
};
