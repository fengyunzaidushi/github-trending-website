import {
  PERIODS,
  createSupabaseReportClient,
  fetchTrendingRowsForDates,
  getLatestDate,
  parseCliArgs,
  parseNumber,
  printJson
} from './shared.mjs';

function parsePeriodsArg(value) {
  if (!value || value === 'all') return [...PERIODS];

  const periods = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const unsupported = periods.filter((item) => !PERIODS.includes(item));
  if (unsupported.length > 0) {
    throw new Error(`Unsupported periods: ${unsupported.join(', ')}`);
  }

  return periods;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const category = args.category || 'all';
  const date = args.date || 'latest';
  const periods = parsePeriodsArg(args.periods || 'all');
  const limitPerPeriod = parseNumber(args['limit-per-period'], 50);

  const supabase = createSupabaseReportClient();
  const latestDate =
    date === 'latest'
      ? await getLatestDate(supabase, { category })
      : date;

  const rows = await fetchTrendingRowsForDates(supabase, {
    dates: [latestDate],
    periods,
    category
  });

  const rowsByPeriod = new Map(periods.map((period) => [period, []]));
  for (const row of rows) {
    const bucket = rowsByPeriod.get(row.period) || [];
    bucket.push(row);
    rowsByPeriod.set(row.period, bucket);
  }

  const limitedRows = periods.flatMap((period) => {
    const bucket = rowsByPeriod.get(period) || [];
    return limitPerPeriod > 0 ? bucket.slice(0, limitPerPeriod) : bucket;
  });

  printJson({
    analysis: 'latest_category_periods',
    latest_date: latestDate,
    category,
    periods,
    total_rows: limitedRows.length,
    rows_per_period: periods.map((period) => ({
      period,
      total_rows: (rowsByPeriod.get(period) || []).length,
      rows_with_overview: (rowsByPeriod.get(period) || []).filter((row) => Boolean(row.overview)).length
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
