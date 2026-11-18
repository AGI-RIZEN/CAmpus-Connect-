import { Router } from 'express';
import { validateBody } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth, requireAuthAnyStatus } from '../../middleware/auth';
import {
  signupSchema,
  otpVerifySchema,
  otpResendSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshSchema,
  logoutSchema,
} from './auth.schema';
import * as authService from './auth.service';

export const authRouter = Router();

authRouter.post(
  '/signup',
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  })
);

authRouter.post(
  '/otp/verify',
  validateBody(otpVerifySchema),
  asyncHandler(async (req, res) => {
    const result = await authService.verifyOtpAndIssueTokens(req.body.userId, req.body.code);
    res.json(result);
  })
);

authRouter.post(
  '/otp/resend',
  validateBody(otpResendSchema),
  asyncHandler(async (req, res) => {
    await authService.resendOtp(req.body.userId);
    res.json({ message: 'OTP resent' });
  })
);

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  })
);

authRouter.get(
  '/me/status',
  requireAuthAnyStatus,
  asyncHandler(async (req, res) => {
    const result = await authService.getStatus(req.user!.id);
    res.json(result);
  })
);

authRouter.post(
  '/refresh',
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken);
    res.json(result);
  })
);

authRouter.post(
  '/logout',
  requireAuth,
  validateBody(logoutSchema),
  asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.json({ message: 'Logged out' });
  })
);

authRouter.post(
  '/password/forgot',
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    res.json({ message: 'If that email exists, a reset link has been sent' });
  })
);

authRouter.post(
  '/password/reset',
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    res.json({ message: 'Password updated' });
  })
);

authRouter.post(
  '/password/change',
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.changePassword(req.user!.id, req.body.oldPassword, req.body.newPassword);
    res.json({ message: 'Password updated' });
  })
);
