import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { sendResetPasswordEmail, sendVerificationEmail } from "../utils/email.js";

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || "lakminda_dev_secret", { expiresIn: "7d" });

const normalizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  isEmailVerified: Boolean(user.isEmailVerified)
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const assertPlainString = (value, fieldName) => {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }
  return value;
};

const sanitizeText = (value) =>
  String(value)
    .replace(/[<>]/g, "")
    .replace(/\0/g, "")
    .trim();

const normalizeEmailInput = (value) => sanitizeText(assertPlainString(value, "email")).toLowerCase();

const createEmailVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return { rawToken, tokenHash, expiresAt };
};

const createResetPasswordToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  return { rawToken, tokenHash, expiresAt };
};

const buildClientBaseUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

const sendUserVerification = async (user) => {
  const { rawToken, tokenHash, expiresAt } = createEmailVerificationToken();
  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpiresAt = expiresAt;
  await user.save();

  const verificationUrl = `${buildClientBaseUrl()}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    verificationUrl
  });
};

const sendUserResetPassword = async (user) => {
  const { rawToken, tokenHash, expiresAt } = createResetPasswordToken();
  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpiresAt = expiresAt;
  await user.save();

  const resetUrl = `${buildClientBaseUrl()}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
  await sendResetPasswordEmail({
    to: user.email,
    name: user.name,
    resetUrl
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const cleanName = sanitizeText(assertPlainString(name, "name"));
    const normalizedEmail = normalizeEmailInput(email);
    const cleanPassword = assertPlainString(password, "password");

    if (!cleanName || cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({ message: "Name must be between 2 and 80 characters" });
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      if (!existing.isEmailVerified) {
        await sendUserVerification(existing);
        return res.status(200).json({
          message: "Email already registered but not verified. New verification email sent."
        });
      }
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const user = await User.create({
      name: cleanName,
      email: normalizedEmail,
      passwordHash,
      isEmailVerified: false
    });

    await sendUserVerification(user);
    return res.status(201).json({
      message: "Registration successful. Please verify your email before logging in."
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const normalizedEmail = normalizeEmailInput(email);
    const cleanPassword = assertPlainString(password, "password");

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED"
      });
    }

    const isValidPassword = await bcrypt.compare(cleanPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(user._id);
    return res.status(200).json({ token, user: normalizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login user", error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get current user", error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const rawToken = sanitizeText(assertPlainString(token, "token")).toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(rawToken)) {
      return res.status(400).json({ message: "Invalid verification token format" });
    }

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = "";
    user.emailVerificationExpiresAt = null;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify email", error: error.message });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = normalizeEmailInput(email);
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    await sendUserVerification(user);
    return res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to resend verification email", error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = normalizeEmailInput(email);
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (user && user.isEmailVerified) {
      await sendUserResetPassword(user);
    }

    return res.status(200).json({
      message: "If this email is registered and verified, a password reset link has been sent."
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to process forgot password", error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ message: "token and newPassword are required" });
    }

    const rawToken = sanitizeText(assertPlainString(token, "token")).toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(rawToken)) {
      return res.status(400).json({ message: "Invalid reset token format" });
    }

    const cleanPassword = assertPlainString(newPassword, "newPassword");
    if (cleanPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.passwordHash = await bcrypt.hash(cleanPassword, 10);
    user.resetPasswordTokenHash = "";
    user.resetPasswordExpiresAt = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reset password", error: error.message });
  }
};
