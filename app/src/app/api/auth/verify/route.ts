import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=Invalid token`);
  }

  try {
    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=Invalid or expired token`);
    }

    // Check if token is expired
    if (new Date() > verificationToken.expires) {
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=Token expired`);
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

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?success=Email verified`);
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=Verification failed`);
  }
} 