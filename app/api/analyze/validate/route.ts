import { NextRequest, NextResponse } from "next/server";
import { validateDecklist, ScrollrackClientError } from "@/lib/scrollrack";

/**
 * POST /api/analyze/validate
 * 
 * Validates a decklist using the Scrollrack API
 * 
 * Request body:
 * {
 *   decklist: string  // TopDeck format decklist with ~~Commanders~~ and ~~Mainboard~~ sections
 * }
 * 
 * Response:
 * {
 *   valid: boolean,
 *   errors: string[],
 *   decklist: string,
 *   deckObj: object
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { decklist } = body;

    if (!decklist || typeof decklist !== "string") {
      return NextResponse.json(
        { error: "Decklist is required" },
        { status: 400 }
      );
    }

    if (decklist.trim().length === 0) {
      return NextResponse.json(
        { error: "Decklist cannot be empty" },
        { status: 400 }
      );
    }

    const result = await validateDecklist(decklist);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Validation error:", error);

    if (error instanceof ScrollrackClientError) {
      return NextResponse.json(
        { 
          error: "Validation service error",
          details: error.message 
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to validate decklist" },
      { status: 500 }
    );
  }
}

