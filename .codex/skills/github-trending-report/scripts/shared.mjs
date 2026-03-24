import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');

dotenv.config({ path: path.join(repoRoot, '.env.local'), quiet: true });

export const PERIODS = ['daily', 'weekly', 'monthly'];

export function createSupabaseReportClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. Expected SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local.'
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export function parseCliArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

export function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizePeriods(period) {
  if (!period || period === 'all') return [...PERIODS];
  if (!PERIODS.includes(period)) {
    throw new Error(`Unsupported period: ${period}`);
  }
  return [period];
}

export function periodRank(period) {
  switch (period) {
    case 'daily':
      return 1;
    case 'weekly':
      return 2;
    case 'monthly':
      return 3;
    default:
      return 99;
  }
}

export function safeAverage(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function unique(values) {
  return [...new Set(values)];
}

function unwrapRepository(repository) {
  if (Array.isArray(repository)) return repository[0] || null;
  return repository || null;
}

function normalizeRow(row) {
  const repository = unwrapRepository(row.repositories);

  return {
    date: row.date,
    period: row.period,
    category: row.category,
    rank: row.rank,
    stars: row.stars,
    forks: row.forks,
    stars_today: row.stars_today,
    repository_id: row.repository_id ?? repository?.id ?? null,
    name: repository?.name ?? null,
    url: repository?.url ?? null,
    description: repository?.description ?? null,
    zh_description: repository?.zh_description ?? null,
    language: repository?.language ?? null,
    owner: repository?.owner ?? null,
    repo_name: repository?.repo_name ?? null,
    overview: repository?.overview ?? null,
    github_created_at: repository?.github_created_at ?? null,
    pushed_at: repository?.pushed_at ?? null
  };
}

function buildTrendingSelect() {
  return `
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
      description,
      zh_description,
      language,
      owner,
      repo_name,
      overview,
      github_created_at,
      pushed_at
    )
  `;
}

export async function getLatestDate(supabase, { period, category = 'all' } = {}) {
  let query = supabase
    .from('trending_data')
    .select('date')
    .order('date', { ascending: false })
    .limit(1);

  if (period && period !== 'all') {
    query = query.eq('period', period);
  }

  if (category && category !== '*') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('No trending_data rows found');
  }

  return data[0].date;
}

export async function getDistinctDates(
  supabase,
  { period = 'monthly', category = 'all', count = 7, pageSize = 1000 } = {}
) {
  const dates = [];
  const seen = new Set();
  let offset = 0;

  while (dates.length < count) {
    let query = supabase
      .from('trending_data')
      .select('date')
      .order('date', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (period && period !== 'all') {
      query = query.eq('period', period);
    }

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
        if (dates.length >= count) break;
      }
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return dates;
}

export async function fetchTrendingRowsForDates(
  supabase,
  { dates, periods = PERIODS, category = 'all', pageSize = 1000 } = {}
) {
  if (!dates || dates.length === 0) return [];

  const rows = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from('trending_data')
      .select(buildTrendingSelect())
      .in('date', dates)
      .in('period', periods)
      .order('date', { ascending: false })
      .order('period', { ascending: true })
      .order('rank', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (category && category !== '*') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...data.map(normalizeRow));

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  rows.sort((left, right) => {
    if (left.date !== right.date) return left.date < right.date ? 1 : -1;
    if (left.period !== right.period) return periodRank(left.period) - periodRank(right.period);
    const leftRank = left.rank ?? Number.MAX_SAFE_INTEGER;
    const rightRank = right.rank ?? Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return (left.name || '').localeCompare(right.name || '');
  });

  return rows;
}

export function dedupeRows(rows, keyBuilder, chooser = preferBetterRank) {
  const keyed = new Map();

  for (const row of rows) {
    const key = keyBuilder(row);
    const existing = keyed.get(key);
    if (!existing) {
      keyed.set(key, row);
      continue;
    }
    keyed.set(key, chooser(existing, row));
  }

  return [...keyed.values()];
}

export function preferBetterRank(existing, incoming) {
  const existingRank = existing.rank ?? Number.MAX_SAFE_INTEGER;
  const incomingRank = incoming.rank ?? Number.MAX_SAFE_INTEGER;

  if (incomingRank < existingRank) return incoming;
  if (incomingRank > existingRank) return existing;

  if ((incoming.stars ?? 0) > (existing.stars ?? 0)) return incoming;
  return existing;
}

export function groupBy(rows, keyBuilder) {
  const groups = new Map();

  for (const row of rows) {
    const key = keyBuilder(row);
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  }

  return groups;
}

export function printJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}
