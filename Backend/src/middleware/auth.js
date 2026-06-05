import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      "SELECT user_id, full_name, email, role, created_at FROM users WHERE user_id = $1",
      [decoded.id],
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  if (!roles.length || roles.includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({ success: false, message: "Access denied" });
};
