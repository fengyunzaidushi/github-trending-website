# Query Patterns

Use these patterns when analyzing GitHub Trending in this repository.

## Core rule

Every leaderboard starts from `public.trending_data`.

Never derive membership from:
- `public.repositories`

## Data scope

Use only:
- `public.trending_data`
- `public.repositories`

## Required joins

```sql
from public.trending_data td
join public.repositories r
  on r.id = td.repository_id
```

## Date strategy

Default "latest" should use `max(td.date)` from `public.trending_data`.
Only use `current_date` when the user explicitly asks for strict calendar "today".

### Latest available date

```sql
select max(date) as latest_trending_date
from public.trending_data;
```

### Strict today snapshot date

```sql
select current_date as today_date;
```

## Latest day, one category, all periods

Replace `<category>` with `all`, `javascript`, `python`, `typescript`, `vue`, or another requested category.

```sql
with latest_date as (
  select max(td.date) as date
  from public.trending_data td
)
select
  td.date,
  td.period,
  td.category,
  td.rank,
  td.stars,
  td.forks,
  td.stars_today,
  r.id as repository_id,
  r.url,
  r.owner,
  r.repo_name,
  r.name,
  r.language,
  r.github_created_at,
  r.pushed_at,
  r.overview
from public.trending_data td
join latest_date ld
  on td.date = ld.date
join public.repositories r
  on r.id = td.repository_id
where td.category = '<category>'
  and td.period in ('daily', 'weekly', 'monthly')
order by td.period, td.rank asc;
```

## Latest one-period leaderboard

Replace `<period>` with `daily`, `weekly`, or `monthly`.

```sql
with latest_date as (
  select max(td.date) as date
  from public.trending_data td
)
select
  td.date,
  td.period,
  td.category,
  td.rank,
  td.stars,
  td.forks,
  td.stars_today,
  r.id as repository_id,
  r.name,
  r.url,
  r.language,
  r.github_created_at,
  r.pushed_at,
  r.overview
from public.trending_data td
join latest_date ld
  on td.date = ld.date
join public.repositories r
  on r.id = td.repository_id
where td.category = 'all'
  and td.period = '<period>'
order by td.rank asc;
```

## Latest monthly with dedup across categories

```sql
with latest_date as (
  select max(td.date) as date
  from public.trending_data td
),
deduped as (
  select
    td.date,
    td.period,
    td.category,
    td.rank,
    td.stars,
    td.forks,
    td.stars_today,
    r.id as repository_id,
    r.name,
    r.url,
    r.language,
    r.github_created_at,
    r.pushed_at,
    r.overview,
    row_number() over (
      partition by r.name
      order by td.stars desc, td.rank asc, r.id
    ) as rn
  from public.trending_data td
  join latest_date ld
    on td.date = ld.date
  join public.repositories r
    on r.id = td.repository_id
  where td.period = 'monthly'
)
select *
from deduped
where rn = 1
order by stars desc, name asc;
```

## Strict today snapshot (may be empty if ETL is delayed)

```sql
select
  td.date,
  td.period,
  td.category,
  td.rank,
  td.stars,
  td.forks,
  td.stars_today,
  r.id as repository_id,
  r.name,
  r.url,
  r.language,
  r.github_created_at,
  r.pushed_at,
  r.overview
from public.trending_data td
join public.repositories r
  on r.id = td.repository_id
where td.date = current_date
order by td.category, td.period, td.rank;
```

## Overview coverage check

```sql
with latest_date as (
  select max(td.date) as date
  from public.trending_data td
)
select
  td.period,
  count(*) as total_rows,
  count(r.overview) as rows_with_overview,
  count(*) - count(r.overview) as rows_missing_overview
from public.trending_data td
join latest_date ld
  on td.date = ld.date
join public.repositories r
  on r.id = td.repository_id
where td.category = 'all'
  and td.period in ('daily', 'weekly', 'monthly')
group by td.period
order by td.period;
```

## Reporting reminders

- Always show the exact date used.
- Include `stars`, `forks`, `github_created_at`, and `pushed_at` whenever present.
- Use `overview` to extract useful judgment: target user, pain point, product wedge, reason for momentum, and reusable takeaway.
- Do not paraphrase `overview` line by line.
- Turn long technical overviews into implications, not summaries.
- Say when a conclusion is inferred from `overview` rather than directly stated.
- Say a field is missing when it is missing.

## Script shortcuts (MCP fallback)

```bash
node .codex/skills/github-trending-report/scripts/fetch_latest_category_periods.mjs --category javascript --periods daily,weekly,monthly
node .codex/skills/github-trending-report/scripts/fetch_latest_period_board.mjs --period monthly --category all
node .codex/skills/github-trending-report/scripts/fetch_monthly_dedup.mjs --mode latest --category '*'
node .codex/skills/github-trending-report/scripts/fetch_monthly_dedup.mjs --mode window --category typescript --window-days 7
```
