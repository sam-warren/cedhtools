-- RPC function for fetching top players by win rate for a specific commander
-- This aggregates player stats from entries, filtered by date range
-- Uses a weighted score: win_rate * ln(entries + 1) to balance win rate with experience

CREATE OR REPLACE FUNCTION get_commander_top_players(
  commander_id_param INTEGER,
  date_filter DATE DEFAULT NULL,
  player_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  player_id INTEGER,
  player_name TEXT,
  topdeck_id TEXT,
  entries BIGINT,
  games_played BIGINT,
  wins BIGINT,
  draws BIGINT,
  losses BIGINT,
  win_rate DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  WITH player_stats AS (
    SELECT 
      p.id AS p_id,
      p.name AS p_name,
      p.topdeck_id AS p_topdeck_id,
      COUNT(e.id)::BIGINT AS total_entries,
      (COALESCE(SUM(e.wins_swiss + e.wins_bracket + e.losses_swiss + e.losses_bracket + e.draws), 0))::BIGINT AS total_games,
      (COALESCE(SUM(e.wins_swiss + e.wins_bracket), 0))::BIGINT AS total_wins,
      (COALESCE(SUM(e.draws), 0))::BIGINT AS total_draws,
      (COALESCE(SUM(e.losses_swiss + e.losses_bracket), 0))::BIGINT AS total_losses,
      CASE 
        WHEN SUM(e.wins_swiss + e.wins_bracket + e.losses_swiss + e.losses_bracket + e.draws) > 0 
        THEN (SUM(e.wins_swiss + e.wins_bracket)::DOUBLE PRECISION / 
              SUM(e.wins_swiss + e.wins_bracket + e.losses_swiss + e.losses_bracket + e.draws)::DOUBLE PRECISION)
        ELSE 0
      END AS calculated_win_rate
    FROM entries e
    INNER JOIN players p ON e.player_id = p.id
    INNER JOIN tournaments t ON e.tournament_id = t.id
    WHERE e.commander_id = commander_id_param
      AND (date_filter IS NULL OR t.tournament_date::DATE >= date_filter)
    GROUP BY p.id, p.name, p.topdeck_id
    HAVING SUM(e.wins_swiss + e.wins_bracket + e.losses_swiss + e.losses_bracket + e.draws) >= 4  -- Minimum 4 games to qualify
  )
  SELECT 
    ps.p_id AS player_id,
    ps.p_name AS player_name,
    ps.p_topdeck_id AS topdeck_id,
    ps.total_entries AS entries,
    ps.total_games AS games_played,
    ps.total_wins AS wins,
    ps.total_draws AS draws,
    ps.total_losses AS losses,
    ps.calculated_win_rate AS win_rate
  FROM player_stats ps
  -- Weight by entries using natural log: win_rate * ln(entries + 1)
  -- This gives diminishing returns for more entries while still heavily weighting experience
  ORDER BY (ps.calculated_win_rate * LN(ps.total_entries + 1)) DESC, ps.total_entries DESC
  LIMIT player_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_commander_top_players(INTEGER, DATE, INTEGER) IS 
  'Returns top players weighted by win rate and entries for a commander. Uses win_rate * ln(entries + 1) for ranking. Requires minimum 4 games to qualify.';
