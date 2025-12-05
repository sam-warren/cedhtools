import { NextRequest, NextResponse } from "next/server";

// Deck analysis API is being rebuilt to use our own database
// This is a placeholder that returns a message to users

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Deck analysis is currently being rebuilt with our new data pipeline. Please check back soon!",
      message: "We're building a custom analytics system that will provide more accurate recommendations based on real tournament data.",
    },
    { status: 503 }
  );
}
