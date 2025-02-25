import { requestPasswordReset, resetPassword } from "@/services/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

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

    const result = await requestPasswordReset(body.email);

    return NextResponse.json(
      { message: result.message },
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
      { message: error instanceof Error ? error.message : "Failed to process password reset request" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const json = await request.json();
    const body = resetPasswordSchema.parse(json);

    const result = await resetPassword(body.token, body.password);

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: result.message },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to reset password" },
      { status: 500 }
    );
  }
}