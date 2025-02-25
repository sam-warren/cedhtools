import { verifyEmail } from "@/services/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=Invalid token`);
  }

  const result = await verifyEmail(token);
  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}${result.redirect}`);
}