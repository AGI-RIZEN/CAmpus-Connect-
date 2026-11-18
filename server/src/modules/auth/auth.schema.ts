import { z } from 'zod';

export const signupSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(72),
  course: z.string().min(1),
  semester: z.coerce.number().int().min(1).max(8),
  role: z.enum(['Student', 'Teacher', 'Alumni']),
  agreedToTerms: z.boolean().refine((v) => v === true, { message: 'You must agree to the terms' }),
  signupCode: z.string().trim().min(1, 'A signup code is required'),
});

export const otpVerifySchema = z.object({
  userId: z.string().min(1),
  code: z.string().length(6),
});

export const otpResendSchema = z.object({
  userId: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6).max(72),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6).max(72),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});
