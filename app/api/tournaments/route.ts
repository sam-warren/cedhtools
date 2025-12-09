import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { getTimePeriodDateFilter, type TimePeriod } from "@/lib/utils/time-period";

export type SortBy = "date" | "size" | "top_cut";
export type SortOrder = "asc" | "desc";

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
    const timePeriod = (searchParams.get("timePeriod") as TimePeriod) ?? "6_months";
    
    // New filters
    const search = searchParams.get("search") ?? undefined;
    const minSize = searchParams.has("minSize")
      ? parseInt(searchParams.get("minSize")!)
      : undefined;
    const maxSize = searchParams.has("maxSize")
      ? parseInt(searchParams.get("maxSize")!)
      : undefined;
    const topCut = searchParams.has("topCut")
      ? parseInt(searchParams.get("topCut")!)
      : undefined;
    
    // Sorting
    const sortBy = (searchParams.get("sortBy") as SortBy) ?? "date";
    const sortOrder = (searchParams.get("sortOrder") as SortOrder) ?? "desc";

    // Calculate date filter
    const dateFilter = getTimePeriodDateFilter(timePeriod);

    // Build query
    let query = supabase
      .from("tournaments")
      .select("*", { count: "exact" });

    // Apply date filter
    if (dateFilter) {
      query = query.gte("tournament_date", dateFilter);
    }
    
    // Apply search filter
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    
    // Apply size filters
    if (minSize !== undefined) {
      query = query.gte("size", minSize);
    }
    if (maxSize !== undefined) {
      query = query.lte("size", maxSize);
    }
    
    // Apply top cut filter
    if (topCut !== undefined) {
      query = query.eq("top_cut", topCut);
    }
    
    // Apply sorting
    const sortColumn = sortBy === "date" ? "tournament_date" : sortBy === "size" ? "size" : "top_cut";
    query = query.order(sortColumn, { ascending: sortOrder === "asc" });
    
    // Secondary sort by date if not already sorting by date
    if (sortBy !== "date") {
      query = query.order("tournament_date", { ascending: false });
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
