import express from "express";
import {
  getCurrentUser,
  login,
  requestPasswordReset,
  resetPassword,
  signup,
} from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.get("/me", auth, getCurrentUser);

export default router;
