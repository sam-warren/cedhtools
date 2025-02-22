import { prisma } from "@/lib/db/prisma";
import { sendVerificationEmail } from "@/lib/email/email.service";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: "Error fetching users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = registerSchema.parse(json);
    console.log('Registration attempt for email:', body.email);

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (existingUser) {
      console.log('User already exists:', body.email);
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        name: body.name,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });
    console.log('User created successfully:', newUser.id);

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    console.log('Generated verification token:', token.substring(0, 8) + '...');

    // Save verification token
    await prisma.verificationToken.create({
      data: {
        identifier: body.email.toLowerCase(),
        token,
        expires,
      },
    });
    console.log('Verification token saved to database');

    // Send verification email
    try {
      console.log('Attempting to send verification email...');
      console.log('SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM,
      });

      await sendVerificationEmail(body.email.toLowerCase(), token);
      console.log('Verification email sent successfully');
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails, but log it
    }

    // After registration, redirect to verification page
    return NextResponse.json(
      {
        message: "User created successfully. Please check your email to verify your account.",
        user: newUser,
        redirect: "/verify"
      },
      { status: 201 }
    );
  } catch (error) {
    // Safe error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in registration process:', { message: errorMessage });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid request data",
          errors: error.errors
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 