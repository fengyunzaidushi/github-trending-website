import {
  createSupabaseReportClient,
  dedupeRows,
  fetchTrendingRowsForDates,
  getDistinctDates,
  groupBy,
  parseCliArgs,
  parseNumber,
  printJson,
  safeAverage
} from './shared.mjs';

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const period = args.period || 'monthly';
  const category = args.category || 'all';
  const window = parseNumber(args.window, 7);
  const limit = parseNumber(args.limit, 20);

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
  const grouped = groupBy(dedupedRows, (row) => row.language || 'Unknown');

  const languages = [...grouped.entries()]
    .map(([language, languageRows]) => {
      const repos = groupBy(languageRows, (row) => row.repository_id || row.name || 'unknown');
      const ranks = languageRows.map((row) => row.rank).filter((rank) => Number.isFinite(rank));

      return {
        language,
        appearance_count: languageRows.length,
        repo_count: repos.size,
        appearance_share: Number((languageRows.length / dedupedRows.length).toFixed(4)),
        avg_rank: ranks.length ? Number(safeAverage(ranks).toFixed(2)) : null,
        best_rank: ranks.length ? Math.min(...ranks) : null,
        top_repos: [...repos.values()]
          .map((repoRows) => ({
            name: repoRows[0].name,
            url: repoRows[0].url,
            appearances: repoRows.length,
            best_rank: Math.min(
              ...repoRows.map((row) => row.rank ?? Number.MAX_SAFE_INTEGER)
            )
          }))
          .sort((left, right) => {
            if (left.appearances !== right.appearances) return right.appearances - left.appearances;
            return left.best_rank - right.best_rank;
          })
          .slice(0, 5)
      };
    })
    .sort((left, right) => {
      if (left.appearance_count !== right.appearance_count) {
        return right.appearance_count - left.appearance_count;
      }
      return (left.best_rank ?? Number.MAX_SAFE_INTEGER) - (right.best_rank ?? Number.MAX_SAFE_INTEGER);
    })
    .slice(0, limit);

  printJson({
    analysis: 'language_mix',
    period,
    category,
    requested_window: window,
    actual_window: captureDates.length,
    capture_dates: captureDates,
    summary: {
      total_rows: dedupedRows.length,
      unique_languages: grouped.size
    },
    languages
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
