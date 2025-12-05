import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

export type TimePeriod = "1_month" | "3_months" | "6_months" | "1_year" | "all_time";

function getTimePeriodDays(period: TimePeriod): number | null {
  switch (period) {
    case "1_month":
      return 30;
    case "3_months":
      return 90;
    case "6_months":
      return 180;
    case "1_year":
      return 365;
    case "all_time":
      return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const supabase = await createClient();

    const limit = searchParams.has("limit")
      ? parseInt(searchParams.get("limit")!)
      : 20;
    const offset = searchParams.has("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;
    const timePeriod = (searchParams.get("timePeriod") as TimePeriod) ?? "3_months";

    // Calculate date filter
    const days = getTimePeriodDays(timePeriod);
    const dateFilter = days
      ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Build query
    let query = supabase
      .from("tournaments")
      .select("*", { count: "exact" })
      .order("tournament_date", { ascending: false });

    if (dateFilter) {
      query = query.gte("tournament_date", dateFilter);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: tournaments, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      tournaments: tournaments || [],
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    );
  }
}
