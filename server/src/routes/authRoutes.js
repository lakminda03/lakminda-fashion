import { Router } from "express";
import {
  forgotPassword,
  getCurrentUser,
  loginUser,
  registerUser,
  resetPassword,
  resendVerificationEmail,
  verifyEmail
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", requireAuth, getCurrentUser);

export default router;
