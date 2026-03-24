import {
  createSupabaseReportClient,
  fetchTrendingRowsForDates,
  getLatestDate,
  parseCliArgs,
  parseNumber,
  printJson
} from './shared.mjs';

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const period = args.period || 'monthly';
  const category = args.category || '*';
  const date = args.date || 'latest';
  const limit = parseNumber(args.limit, 200);

  const supabase = createSupabaseReportClient();
  const latestDate =
    date === 'latest'
      ? await getLatestDate(supabase, { period, category })
      : date;

  const rows = await fetchTrendingRowsForDates(supabase, {
    dates: [latestDate],
    periods: [period],
    category
  });

  const limitedRows = limit > 0 ? rows.slice(0, limit) : rows;

  printJson({
    analysis: 'latest_period_board',
    latest_date: latestDate,
    period,
    category,
    total_rows: limitedRows.length,
    rows_with_overview: limitedRows.filter((row) => Boolean(row.overview)).length,
    rows_missing_overview: limitedRows.filter((row) => !row.overview).length,
    rows: limitedRows
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
