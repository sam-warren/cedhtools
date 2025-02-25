import { registerUser } from "@/services/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = registerSchema.parse(json);
    console.log('Registration attempt for email:', body.email);

    const result = await registerUser({
      email: body.email,
      password: body.password,
      name: body.name,
    });

    return NextResponse.json({
      user: result.user,
      message: result.message,
      redirect: result.redirect,
    });
  } catch (error) {
    console.error('Error during registration:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
