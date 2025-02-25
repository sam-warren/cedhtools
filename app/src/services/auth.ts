'use server';

import { authConfig } from "@/lib/config/auth.config";
import { prisma } from '@/lib/db/prisma';
import { sendPasswordResetEmail, sendVerificationEmail } from "@/services/email";
import { DeleteAccountResult, RegisterUserParams, RequestPasswordResetResult, ResetPasswordResult, VerifyEmailResult } from "@/types/api/auth";
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getServerSession } from "next-auth";
import { withErrorHandling, withValidation } from "./apiUtils";
import { PrismaClient } from "@prisma/client";

// Session and authentication utilities
export const getSession = withErrorHandling(async () => {
  return await getServerSession(authConfig);
});

export const getCurrentUser = withErrorHandling(async () => {
  const session = await getSession();
  return session?.user;
});

export const isAuthenticated = withErrorHandling(async () => {
  const session = await getSession();
  return !!session?.user;
});

export const clearAuthData = withErrorHandling(async () => {
  'use client';
  const authKeys = [
    'lastKnownSession',
  ];

  authKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove ${key} from localStorage:`, e);
    }
  });
});

// Validation functions
const validateEmail = (email: string): { valid: boolean; errors?: string[] } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, errors: ['Invalid email format'] };
  }
  return { valid: true };
};

const validatePassword = (password: string): { valid: boolean; errors?: string[] } => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }
  
  return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
};

const validateRegistration = ({ email, password, name }: RegisterUserParams): { valid: boolean; errors?: string[] } => {
  const errors: string[] = [];
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.push(...(emailValidation.errors || []));
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.push(...(passwordValidation.errors || []));
  }
  
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
};

// Helper functions
async function createVerificationToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

// Service functions
export const verifyEmail = withErrorHandling(
  withValidation(
    (token: string) => ({ valid: !!token, errors: token ? undefined : ['Token is required'] }),
    async (token: string): Promise<VerifyEmailResult> => {
      const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken) {
        return {
          success: false,
          message: 'Invalid or expired token',
          redirect: `/login?error=Invalid or expired token`,
        };
      }

      if (verificationToken.expires < new Date()) {
        await prisma.verificationToken.delete({
          where: { token },
        });

        return {
          success: false,
          message: 'Token has expired',
          redirect: `/login?error=Token has expired`,
        };
      }

      const user = await prisma.user.findFirst({
        where: { email: verificationToken.identifier },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
          redirect: `/login?error=User not found`,
        };
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });

      await prisma.verificationToken.delete({
        where: { token },
      });

      return {
        success: true,
        message: 'Email verified successfully',
        redirect: `/login?success=Email verified successfully`,
      };
    }
  )
);

export const registerUser = withErrorHandling(
  withValidation(
    validateRegistration,
    async ({ email, password, name }: RegisterUserParams) => {
      try {
        // Start a transaction
        return await prisma.$transaction(async (tx) => {
          const existingUser = await tx.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            return {
              success: false,
              message: 'User with this email already exists',
              redirect: `/register?error=User with this email already exists`,
            };
          }

          const hashedPassword = await bcrypt.hash(password, 10);

          const user = await tx.user.create({
            data: {
              name,
              email,
              password: hashedPassword,
            },
          });

          const verificationToken = await createVerificationToken(email);
          await sendVerificationEmail(email, verificationToken);

          return {
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
            redirect: `/login?success=Registration successful. Please check your email to verify your account.`,
          };
        });
      } catch (error) {
        console.error('Registration error:', error);
        return {
          success: false,
          message: 'Registration failed. Please try again later.',
          redirect: `/register?error=Registration failed. Please try again later.`,
        };
      }
    }
  )
);

export async function deleteAccount(userId: string): Promise<DeleteAccountResult> {
  try {
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return {
      success: true,
      message: 'Account deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting account:', error);
    throw new Error('Failed to delete account');
  }
}

export async function requestPasswordReset(email: string): Promise<RequestPasswordResetResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      };
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Save reset token
    await prisma.passwordResetToken.create({
      data: {
        identifier: email.toLowerCase(),
        token,
        expires,
      },
    });

    // Send reset email
    await sendPasswordResetEmail(email.toLowerCase(), token);

    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    };
  } catch (error) {
    console.error('Error in password reset request:', error);
    throw new Error('Failed to process password reset request');
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult> {
  try {
    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return {
        success: false,
        message: 'Invalid or expired reset token',
      };
    }

    // Check if token is expired
    if (new Date() > resetToken.expires) {
      await prisma.passwordResetToken.delete({
        where: { token },
      });
      return {
        success: false,
        message: 'Reset token has expired',
      };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await prisma.user.update({
      where: { email: resetToken.identifier },
      data: { password: hashedPassword },
    });

    // Delete the reset token
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    throw new Error('Failed to reset password');
  }
}
