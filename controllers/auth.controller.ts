import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { registerSchema, loginSchema } from '../types/schema.js';
import { storage } from '../services/storage.service.js';
import { generateToken, AuthRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config/environment.js';
import { sendOtpEmail } from '../utils/mailer.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  const existing = await storage.getUserByEmail(data.email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const user = await storage.createUser({
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: data.password,
    role: data.role,
    verified: false,
    profilePhotoUrl: null
  });

  if (data.role === 'broker') {
    await storage.createBroker({
      userId: user.id,
      verified: false
    });
  }

  const accessToken = generateToken(user.id);
  const refreshToken = generateToken(user.id);

  res.status(201).json({
    user,
    tokens: { accessToken, refreshToken }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const user = await storage.validatePassword(data.email, data.password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const accessToken = generateToken(user.id);
  const refreshToken = generateToken(user.id);

  const { passwordHash, ...safeUser } = user;

  res.json({
    user: safeUser,
    tokens: { accessToken, refreshToken }
  });
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await storage.getUser(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwtSecret) as { userId: string };

    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const newAccessToken = generateToken(user.id);
    const newRefreshToken = generateToken(user.id);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({ success: true });
});

// Step 1 — send OTP to email
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email?.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = await storage.getUserByEmail(email.toLowerCase().trim());
  // Always return success to avoid email enumeration
  if (!user) {
    return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
  }

  const otp = String(crypto.randomInt(100000, 999999));
  const otpHash = await bcrypt.hash(otp, 10);
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await storage.setUserResetOtp(email.toLowerCase().trim(), otpHash, expiry);

  try {
    await sendOtpEmail(email.toLowerCase().trim(), otp, user.name);
  } catch (err) {
    console.error('Mail error:', err);
    return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
  }

  res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
});

// Step 2 — verify OTP, return a short-lived reset token
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email?.trim() || !otp?.trim()) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const user = await storage.getUserByEmailWithOtp(email.toLowerCase().trim());
  if (!user) return res.status(400).json({ error: 'Invalid or expired OTP' });

  if (!user.resetOtp || !user.resetOtpExpiry) {
    return res.status(400).json({ error: 'No OTP requested. Please request a new one.' });
  }

  if (new Date() > new Date(user.resetOtpExpiry)) {
    await storage.clearUserResetOtp(user._id.toString());
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  const MAX_ATTEMPTS = 5;
  if ((user.resetOtpAttempts ?? 0) >= MAX_ATTEMPTS) {
    await storage.clearUserResetOtp(user._id.toString());
    return res.status(429).json({ error: 'Too many failed attempts. Please request a new OTP.' });
  }

  const valid = await bcrypt.compare(otp.trim(), user.resetOtp);
  if (!valid) {
    await storage.incrementOtpAttempts(user._id.toString());
    const remaining = MAX_ATTEMPTS - (user.resetOtpAttempts ?? 0) - 1;
    return res.status(400).json({ error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` });
  }

  // OTP is correct — issue a short-lived reset token (10 min)
  const resetToken = jwt.sign(
    { userId: user._id.toString(), purpose: 'password-reset' },
    config.jwtSecret,
    { expiresIn: '10m' }
  );

  // Clear OTP so it can't be reused
  await storage.clearUserResetOtp(user._id.toString());

  res.json({ success: true, resetToken });
});

// Step 3 — set new password using the reset token
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken?.trim() || !newPassword?.trim()) {
    return res.status(400).json({ error: 'resetToken and newPassword are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  let decoded: { userId: string; purpose: string };
  try {
    decoded = jwt.verify(resetToken, config.jwtSecret) as typeof decoded;
  } catch {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  if (decoded.purpose !== 'password-reset') {
    return res.status(400).json({ error: 'Invalid reset token' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await storage.updateUserPassword(decoded.userId, passwordHash);

  res.json({ success: true, message: 'Password updated successfully. You can now log in.' });
});
