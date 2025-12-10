import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

/**
 * GET /api/tournaments/filters
 * 
 * Returns unique filter values for the tournaments page:
 * - top_cut: Array of unique top cut sizes (sorted descending)
 * - sizes: Min and max tournament sizes
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get unique top cut values (excluding 0 which means Swiss-only)
    const { data: topCutData, error: topCutError } = await supabase
      .from("tournaments")
      .select("top_cut")
      .gt("top_cut", 0)
      .order("top_cut", { ascending: false });

    if (topCutError) throw topCutError;

    // Extract unique values
    const uniqueTopCuts = [...new Set(topCutData?.map((t) => t.top_cut) || [])].sort((a, b) => b - a);

    // Get min/max sizes
    const { data: sizeData, error: sizeError } = await supabase
      .from("tournaments")
      .select("size")
      .order("size", { ascending: true });

    if (sizeError) throw sizeError;

    const sizes = sizeData?.map((t) => t.size) || [];
    const minSize = sizes.length > 0 ? Math.min(...sizes) : 0;
    const maxSize = sizes.length > 0 ? Math.max(...sizes) : 0;

    return NextResponse.json({
      topCuts: uniqueTopCuts,
      sizeRange: { min: minSize, max: maxSize },
    });
  } catch (error) {
    console.error("Error fetching tournament filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament filters" },
      { status: 500 }
    );
  }
}





