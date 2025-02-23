import { authConfig } from "@/lib/config/auth.config";
import { prisma } from '@/lib/db/prisma';
import { sendPasswordResetEmail, sendVerificationEmail } from "@/services/email";
import { DeleteAccountResult, RegisterUserParams, RequestPasswordResetResult, ResetPasswordResult, VerifyEmailResult } from "@/types/api/auth";
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getServerSession } from "next-auth";

export async function getSession() {
    return await getServerSession(authConfig);
}

export async function getCurrentUser() {
    const session = await getSession();
    return session?.user;
}

export async function isAuthenticated() {
    const session = await getSession();
    return !!session?.user;
}

export function clearAuthData() {
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
}

export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
    try {
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

        // Check if token is expired
        if (new Date() > verificationToken.expires) {
            await prisma.verificationToken.delete({
                where: { token },
            });
            return {
                success: false,
                message: 'Token expired',
                redirect: `/login?error=Token expired`,
            };
        }

        // Update user's email verification status
        await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() },
        });

        // Delete the verification token
        await prisma.verificationToken.delete({
            where: { token },
        });

        return {
            success: true,
            message: 'Email verified successfully',
            redirect: `/login?success=Email verified`,
        };
    } catch (error) {
        console.error('Error verifying email:', error);
        return {
            success: false,
            message: 'Verification failed',
            redirect: `/login?error=Verification failed`,
        };
    }
}

export async function registerUser({ email, password, name }: RegisterUserParams) {
    const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });

    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await prisma.user.create({
        data: {
            email: email.toLowerCase(),
            name,
            password: hashedPassword,
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
        },
    });

    // Generate and save verification token
    const token = await createVerificationToken(email);

    // Send verification email
    try {
        await sendVerificationEmail(email.toLowerCase(), token);
    } catch (error) {
        console.error('Failed to send verification email:', error);
    }

    return {
        user: newUser,
        message: 'Registration successful. Please check your email for verification.',
        redirect: '/verify',
    };
}

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

export async function createVerificationToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
        data: {
            identifier: email.toLowerCase(),
            token,
            expires,
        },
    });

    return token;
}
