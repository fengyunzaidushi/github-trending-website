import {
  PERIODS,
  createSupabaseReportClient,
  dedupeRows,
  fetchTrendingRowsForDates,
  getLatestDate,
  groupBy,
  parseCliArgs,
  parseNumber,
  printJson
} from './shared.mjs';

function makeRepoSnapshot(repoRowsByPeriod, periods) {
  const repoRows = periods
    .map((period) => repoRowsByPeriod.get(period))
    .filter(Boolean);
  const sample = repoRows[0];

  return {
    repository_id: sample.repository_id,
    name: sample.name,
    url: sample.url,
    language: sample.language,
    overview: sample.overview,
    github_created_at: sample.github_created_at,
    pushed_at: sample.pushed_at,
    periods,
    ranks: Object.fromEntries(
      periods.map((period) => [period, repoRowsByPeriod.get(period)?.rank ?? null])
    ),
    stars: Object.fromEntries(
      periods.map((period) => [period, repoRowsByPeriod.get(period)?.stars ?? null])
    )
  };
}

function sortSnapshots(left, right) {
  const leftScore = Object.values(left.ranks).reduce(
    (sum, rank) => sum + (rank ?? Number.MAX_SAFE_INTEGER / 10),
    0
  );
  const rightScore = Object.values(right.ranks).reduce(
    (sum, rank) => sum + (rank ?? Number.MAX_SAFE_INTEGER / 10),
    0
  );

  if (leftScore !== rightScore) return leftScore - rightScore;
  return (left.name || '').localeCompare(right.name || '');
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const category = args.category || 'all';
  const limit = parseNumber(args.limit, 20);

  const supabase = createSupabaseReportClient();
  const latestDate = await getLatestDate(supabase, { category });
  const rows = await fetchTrendingRowsForDates(supabase, {
    dates: [latestDate],
    periods: PERIODS,
    category
  });

  const dedupedRows = dedupeRows(
    rows,
    (row) => `${row.period}::${row.repository_id || row.name || 'unknown'}`
  );

  const rowsByPeriod = new Map(
    PERIODS.map((period) => [
      period,
      dedupedRows.filter((row) => row.period === period)
    ])
  );

  const repoPeriods = new Map();
  for (const row of dedupedRows) {
    const key = row.repository_id || row.name || 'unknown';
    const entry = repoPeriods.get(key) || new Map();
    entry.set(row.period, row);
    repoPeriods.set(key, entry);
  }

  const allThree = [];
  const dailyWeekly = [];
  const dailyMonthly = [];
  const weeklyMonthly = [];

  for (const repoRowsByPeriod of repoPeriods.values()) {
    const periods = [...repoRowsByPeriod.keys()].sort();
    const snapshot = makeRepoSnapshot(repoRowsByPeriod, periods);

    if (periods.length === 3) allThree.push(snapshot);
    if (repoRowsByPeriod.has('daily') && repoRowsByPeriod.has('weekly')) dailyWeekly.push(snapshot);
    if (repoRowsByPeriod.has('daily') && repoRowsByPeriod.has('monthly')) dailyMonthly.push(snapshot);
    if (repoRowsByPeriod.has('weekly') && repoRowsByPeriod.has('monthly')) weeklyMonthly.push(snapshot);
  }

  const uniqueByPeriod = Object.fromEntries(
    PERIODS.map((period) => {
      const others = new Set(
        PERIODS.filter((item) => item !== period)
          .flatMap((item) => (rowsByPeriod.get(item) || []).map((row) => row.repository_id || row.name || 'unknown'))
      );

      const uniqueRows = (rowsByPeriod.get(period) || []).filter(
        (row) => !others.has(row.repository_id || row.name || 'unknown')
      );

      return [
        period,
        uniqueRows.slice(0, limit).map((row) => ({
          repository_id: row.repository_id,
          name: row.name,
          url: row.url,
          language: row.language,
          rank: row.rank,
          stars: row.stars,
          stars_today: row.stars_today
        }))
      ];
    })
  );

  printJson({
    analysis: 'period_overlap_latest',
    latest_date: latestDate,
    category,
    summary: {
      total_repos_by_period: Object.fromEntries(
        PERIODS.map((period) => [period, (rowsByPeriod.get(period) || []).length])
      ),
      overlap_counts: {
        daily_weekly: dailyWeekly.length,
        daily_monthly: dailyMonthly.length,
        weekly_monthly: weeklyMonthly.length,
        all_three: allThree.length
      }
    },
    overlaps: {
      all_three: allThree.sort(sortSnapshots).slice(0, limit),
      daily_weekly: dailyWeekly.sort(sortSnapshots).slice(0, limit),
      daily_monthly: dailyMonthly.sort(sortSnapshots).slice(0, limit),
      weekly_monthly: weeklyMonthly.sort(sortSnapshots).slice(0, limit)
    },
    unique_by_period: uniqueByPeriod
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
