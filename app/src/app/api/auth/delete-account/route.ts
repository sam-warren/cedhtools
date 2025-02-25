import { authConfig } from "@/lib/config/auth.config";
import { deleteAccount } from "@/services/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await deleteAccount(session.user.id);

    return NextResponse.json(
      { message: result.message },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete account" },
      { status: 500 }
    );
  }
}