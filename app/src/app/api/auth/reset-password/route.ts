import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/email/email.service";
import bcrypt from "bcryptjs";

const requestResetSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = requestResetSchema.parse(json);

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json(
        { message: "If an account exists with this email, you will receive a password reset link." },
        { status: 200 }
      );
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Save reset token
    await prisma.passwordResetToken.create({
      data: {
        identifier: body.email.toLowerCase(),
        token,
        expires,
      },
    });

    // Send reset email
    await sendPasswordResetEmail(body.email.toLowerCase(), token);

    return NextResponse.json(
      { message: "If an account exists with this email, you will receive a password reset link." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in password reset request:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const json = await request.json();
    const body = resetPasswordSchema.parse(json);

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: body.token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > resetToken.expires) {
      await prisma.passwordResetToken.delete({
        where: { token: body.token },
      });
      return NextResponse.json(
        { message: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Update user's password
    await prisma.user.update({
      where: { email: resetToken.identifier },
      data: { password: hashedPassword },
    });

    // Delete the reset token
    await prisma.passwordResetToken.delete({
      where: { token: body.token },
    });

    return NextResponse.json(
      { message: "Password has been reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in password reset:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid password format" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Failed to reset password" },
      { status: 500 }
    );
  }
} 