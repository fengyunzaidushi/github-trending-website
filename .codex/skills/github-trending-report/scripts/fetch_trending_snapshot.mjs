import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(JSON.stringify({
    error: 'Missing Supabase credentials',
    required: ['SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY']
  }, null, 2));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function parseArgs(argv) {
  const result = {
    period: 'all',
    category: 'all',
    date: 'latest',
    limit: 10
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--period' && next) result.period = next;
    if (arg === '--category' && next) result.category = next;
    if (arg === '--date' && next) result.date = next;
    if (arg === '--limit' && next) result.limit = Number(next);
  }

  return result;
}

function normalizePeriods(period) {
  if (!period || period === 'all') {
    return ['daily', 'weekly', 'monthly'];
  }
  return [period];
}

async function getLatestDate() {
  const { data, error } = await supabase
    .from('trending_data')
    .select('date')
    .order('date', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('No trending_data rows found');
  }

  return data[0].date;
}

async function getPeriodRows({ date, period, category, limit }) {
  const { data, error } = await supabase
    .from('trending_data')
    .select(`
      date,
      period,
      category,
      rank,
      stars,
      forks,
      stars_today,
      repository_id,
      repositories (
        id,
        name,
        url,
        language,
        overview,
        github_created_at,
        pushed_at
      )
    `)
    .eq('date', date)
    .eq('period', period)
    .eq('category', category)
    .order('rank', { ascending: true })
    .limit(limit);

  if (error) throw error;

  const rows = (data || []).map((row) => ({
    date: row.date,
    period: row.period,
    category: row.category,
    rank: row.rank,
    stars: row.stars,
    forks: row.forks,
    stars_today: row.stars_today,
    name: row.repositories?.name || null,
    url: row.repositories?.url || null,
    language: row.repositories?.language || null,
    github_created_at: row.repositories?.github_created_at || null,
    pushed_at: row.repositories?.pushed_at || null,
    overview: row.repositories?.overview || null
  }));

  return {
    period,
    total_rows: rows.length,
    rows_with_overview: rows.filter((row) => row.overview).length,
    rows_missing_overview: rows.filter((row) => !row.overview).length,
    rows
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const latestDate = args.date === 'latest' ? await getLatestDate() : args.date;
  const periods = normalizePeriods(args.period);

  const snapshots = [];
  for (const period of periods) {
    snapshots.push(await getPeriodRows({
      date: latestDate,
      period,
      category: args.category,
      limit: args.limit
    }));
  }

  console.log(JSON.stringify({
    latest_date: latestDate,
    category: args.category,
    periods: snapshots
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    error: error.message,
    details: error
  }, null, 2));
  process.exit(1);
});
