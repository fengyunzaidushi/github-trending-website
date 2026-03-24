import {
  createSupabaseReportClient,
  dedupeRows,
  fetchTrendingRowsForDates,
  getDistinctDates,
  groupBy,
  parseCliArgs,
  parseNumber,
  printJson,
  safeAverage,
  unique
} from './shared.mjs';

function buildRepoReport(rows, captureDates) {
  const sortedRows = [...rows].sort((left, right) => left.date.localeCompare(right.date));
  const firstRow = sortedRows[0];
  const latestRow = sortedRows[sortedRows.length - 1];
  const ranks = sortedRows.map((row) => row.rank).filter((rank) => Number.isFinite(rank));

  return {
    repository_id: latestRow.repository_id,
    name: latestRow.name,
    url: latestRow.url,
    language: latestRow.language,
    overview: latestRow.overview,
    github_created_at: latestRow.github_created_at,
    pushed_at: latestRow.pushed_at,
    appearances: sortedRows.length,
    appearance_rate: Number((sortedRows.length / captureDates.length).toFixed(4)),
    first_seen_date: firstRow.date,
    last_seen_date: latestRow.date,
    best_rank: ranks.length ? Math.min(...ranks) : null,
    latest_rank: latestRow.rank,
    first_rank: firstRow.rank,
    avg_rank: ranks.length ? Number(safeAverage(ranks).toFixed(2)) : null,
    latest_stars: latestRow.stars,
    latest_stars_today: latestRow.stars_today,
    max_stars: Math.max(...sortedRows.map((row) => row.stars ?? 0)),
    rank_delta_first_to_latest:
      Number.isFinite(firstRow.rank) && Number.isFinite(latestRow.rank)
        ? latestRow.rank - firstRow.rank
        : null,
    dates: sortedRows.map((row) => row.date),
    entries: sortedRows.map((row) => ({
      date: row.date,
      rank: row.rank,
      stars: row.stars,
      stars_today: row.stars_today,
      category: row.category
    }))
  };
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const period = args.period || 'monthly';
  const category = args.category || 'all';
  const window = parseNumber(args.window, 7);
  const minAppearances = parseNumber(args['min-appearances'], 2);
  const limit = parseNumber(args.limit, 50);

  const supabase = createSupabaseReportClient();
  const captureDates = await getDistinctDates(supabase, { period, category, count: window });
  const rows = await fetchTrendingRowsForDates(supabase, {
    dates: captureDates,
    periods: [period],
    category
  });

  const dedupedRows = dedupeRows(
    rows,
    (row) => `${row.date}::${row.repository_id || row.name || 'unknown'}`
  );

  const grouped = groupBy(dedupedRows, (row) => row.repository_id || row.name || 'unknown');
  const repos = [...grouped.values()]
    .map((repoRows) => buildRepoReport(repoRows, captureDates))
    .filter((repo) => repo.appearances >= minAppearances)
    .sort((left, right) => {
      if (left.appearances !== right.appearances) return right.appearances - left.appearances;
      const leftBest = left.best_rank ?? Number.MAX_SAFE_INTEGER;
      const rightBest = right.best_rank ?? Number.MAX_SAFE_INTEGER;
      if (leftBest !== rightBest) return leftBest - rightBest;
      const leftLatest = left.latest_rank ?? Number.MAX_SAFE_INTEGER;
      const rightLatest = right.latest_rank ?? Number.MAX_SAFE_INTEGER;
      if (leftLatest !== rightLatest) return leftLatest - rightLatest;
      return (left.name || '').localeCompare(right.name || '');
    })
    .slice(0, limit);

  const languageAppearances = new Map();
  for (const repo of repos) {
    const language = repo.language || 'Unknown';
    languageAppearances.set(language, (languageAppearances.get(language) || 0) + repo.appearances);
  }

  printJson({
    analysis: 'recurring_repos',
    period,
    category,
    requested_window: window,
    actual_window: captureDates.length,
    capture_dates: captureDates,
    summary: {
      unique_repos_in_window: grouped.size,
      recurring_repos: repos.length,
      single_capture_repos: [...grouped.values()].filter((repoRows) => unique(repoRows.map((row) => row.date)).length === 1).length,
      top_languages_by_appearances: [...languageAppearances.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 10)
        .map(([language, appearances]) => ({ language, appearances }))
    },
    repos
  });
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        error: error.message,
        details: error
      },
      null,
      2
    )
  );
  process.exit(1);
});
