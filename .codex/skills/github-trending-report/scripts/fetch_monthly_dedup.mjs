import {
  createSupabaseReportClient,
  fetchTrendingRowsForDates,
  getLatestDate,
  parseCliArgs,
  parseNumber,
  printJson
} from './shared.mjs';

function compareLatestMonthly(left, right) {
  const leftStars = left.stars ?? 0;
  const rightStars = right.stars ?? 0;
  if (leftStars !== rightStars) return rightStars - leftStars;

  const leftRank = left.rank ?? Number.MAX_SAFE_INTEGER;
  const rightRank = right.rank ?? Number.MAX_SAFE_INTEGER;
  if (leftRank !== rightRank) return leftRank - rightRank;

  return (left.repository_id || '').localeCompare(right.repository_id || '');
}

function compareRollingMonthly(left, right) {
  if (left.date !== right.date) {
    return left.date > right.date ? -1 : 1;
  }

  const leftStars = left.stars ?? 0;
  const rightStars = right.stars ?? 0;
  if (leftStars !== rightStars) return rightStars - leftStars;

  const leftRank = left.rank ?? Number.MAX_SAFE_INTEGER;
  const rightRank = right.rank ?? Number.MAX_SAFE_INTEGER;
  if (leftRank !== rightRank) return leftRank - rightRank;

  return (left.repository_id || '').localeCompare(right.repository_id || '');
}

function dedupeByName(rows, chooser) {
  const keyed = new Map();

  for (const row of rows) {
    const key = row.name || row.repository_id || 'unknown';
    const existing = keyed.get(key);
    if (!existing) {
      keyed.set(key, row);
      continue;
    }

    keyed.set(key, chooser(existing, row) <= 0 ? existing : row);
  }

  return [...keyed.values()];
}

function toWindowStartDate(latestDate, windowDays) {
  const cursor = new Date(`${latestDate}T00:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() - (windowDays - 1));
  return cursor.toISOString().slice(0, 10);
}

async function getDistinctDatesInWindow(
  supabase,
  { period, category, latestDate, windowDays, pageSize = 1000 }
) {
  const startDate = toWindowStartDate(latestDate, windowDays);
  const dates = [];
  const seen = new Set();
  let offset = 0;

  while (true) {
    let query = supabase
      .from('trending_data')
      .select('date')
      .eq('period', period)
      .gte('date', startDate)
      .lte('date', latestDate)
      .order('date', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (category && category !== '*') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (!seen.has(row.date)) {
        seen.add(row.date);
        dates.push(row.date);
      }
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return dates;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const mode = args.mode || 'latest'; // latest | window
  const category =
    args.category || (mode === 'window' ? 'all' : '*');
  const windowDays = parseNumber(args['window-days'], 7);
  const limit = parseNumber(args.limit, 200);

  if (!['latest', 'window'].includes(mode)) {
    throw new Error(`Unsupported mode: ${mode}. Expected one of: latest, window`);
  }

  const supabase = createSupabaseReportClient();
  const latestDate = await getLatestDate(supabase, { period: 'monthly', category });

  const captureDates =
    mode === 'window'
      ? await getDistinctDatesInWindow(supabase, {
          period: 'monthly',
          category,
          latestDate,
          windowDays
        })
      : [latestDate];

  const rows = await fetchTrendingRowsForDates(supabase, {
    dates: captureDates,
    periods: ['monthly'],
    category
  });

  const chooser = mode === 'window' ? compareRollingMonthly : compareLatestMonthly;
  const dedupedRows = dedupeByName(rows, chooser)
    .sort((left, right) => {
      const leftStars = left.stars ?? 0;
      const rightStars = right.stars ?? 0;
      if (leftStars !== rightStars) return rightStars - leftStars;
      return (left.name || '').localeCompare(right.name || '');
    });

  const limitedRows = limit > 0 ? dedupedRows.slice(0, limit) : dedupedRows;

  printJson({
    analysis: 'monthly_dedup',
    mode,
    period: 'monthly',
    category,
    latest_date: latestDate,
    capture_dates: captureDates,
    raw_rows: rows.length,
    deduped_rows: limitedRows.length,
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
