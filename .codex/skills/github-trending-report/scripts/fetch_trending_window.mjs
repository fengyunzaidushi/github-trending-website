import {
  createSupabaseReportClient,
  fetchTrendingRowsForDates,
  getDistinctDates,
  parseCliArgs,
  parseNumber,
  printJson
} from './shared.mjs';

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const period = args.period || 'monthly';
  const category = args.category || 'all';
  const window = parseNumber(args.window, 7);
  const limitPerDate = parseNumber(args['limit-per-date'], 0);

  const supabase = createSupabaseReportClient();
  const captureDates = await getDistinctDates(supabase, { period, category, count: window });
  const rows = await fetchTrendingRowsForDates(supabase, {
    dates: captureDates,
    periods: [period],
    category
  });

  const rowsByDate = new Map();
  for (const row of rows) {
    const bucket = rowsByDate.get(row.date) || [];
    bucket.push(row);
    rowsByDate.set(row.date, bucket);
  }

  const limitedRows = [];
  for (const date of captureDates) {
    const bucket = rowsByDate.get(date) || [];
    limitedRows.push(...(limitPerDate > 0 ? bucket.slice(0, limitPerDate) : bucket));
  }

  printJson({
    period,
    category,
    requested_window: window,
    actual_window: captureDates.length,
    capture_dates: captureDates,
    total_rows: limitedRows.length,
    rows_per_date: captureDates.map((date) => ({
      date,
      row_count: (rowsByDate.get(date) || []).length
    })),
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
