# Scenario Queries

These SQL snippets are distilled from the extracted history in `.history_sql_test` and aligned to the current schema: use only `public.trending_data` and `public.repositories`.
Default "latest" in this file means `max(td.date)` from `public.trending_data` unless a query explicitly says `current_date`.

## Last N Capture Dates For One Leaderboard

Use this pattern when you need the most recent `N` distinct snapshots for one `period` and `category`.

```sql
with latest_dates as (
  select distinct td.date
  from public.trending_data td
  where td.period = 'monthly'
    and td.category = 'all'
  order by td.date desc
  limit 7
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
  r.overview,
  r.github_created_at,
  r.pushed_at
from public.trending_data td
join latest_dates ld
  on ld.date = td.date
join public.repositories r
  on r.id = td.repository_id
where td.period = 'monthly'
  and td.category = 'all'
order by td.date desc, td.rank asc;
```

## Repos That Recur Across The Last N Monthly Captures

Use this when the user asks things like:
- "最近 7 天抓取的 7 次上过月榜的 repo"
- "最近 N 次重复上榜的仓库"
- "连续出现在月榜里的 repo"

```sql
with latest_dates as (
  select distinct td.date
  from public.trending_data td
  where td.period = 'monthly'
    and td.category = 'all'
  order by td.date desc
  limit 7
),
windowed as (
  select
    td.date,
    td.rank,
    td.stars,
    td.forks,
    td.stars_today,
    r.id as repository_id,
    r.name,
    r.url,
    r.language,
    r.overview,
    r.github_created_at,
    r.pushed_at
  from public.trending_data td
  join latest_dates ld
    on ld.date = td.date
  join public.repositories r
    on r.id = td.repository_id
  where td.period = 'monthly'
    and td.category = 'all'
),
grouped as (
  select
    repository_id,
    max(name) as name,
    max(url) as url,
    max(language) as language,
    max(overview) as overview,
    max(github_created_at) as github_created_at,
    max(pushed_at) as pushed_at,
    count(*) as appearances,
    avg(forks) as avg_forks,
    min(rank) as best_rank,
    avg(rank) as avg_rank,
    max(date) as last_seen_date
  from windowed
  group by repository_id
)
select *
from grouped
where appearances >= 2
order by appearances desc, best_rank asc, last_seen_date desc;
```

## Latest Daily/Weekly/Monthly Overlap

Use this when the user asks which repos are simultaneously on multiple leaderboards.

```sql
with latest_date as (
  select max(td.date) as date
  from public.trending_data td
  where td.category = 'all'
),
latest_rows as (
  select
    td.period,
    td.rank,
    td.stars,
    td.forks,
    r.id as repository_id,
    r.name,
    r.url,
    r.language,
    r.overview
  from public.trending_data td
  join latest_date ld
    on ld.date = td.date
  join public.repositories r
    on r.id = td.repository_id
  where td.category = 'all'
    and td.period in ('daily', 'weekly', 'monthly')
)
select
  repository_id,
  max(name) as name,
  max(url) as url,
  max(language) as language,
  max(overview) as overview,
  bool_or(period = 'daily') as on_daily,
  bool_or(period = 'weekly') as on_weekly,
  bool_or(period = 'monthly') as on_monthly,
  min(rank) as best_rank
from latest_rows
group by repository_id
having count(*) >= 2
order by best_rank asc, name asc;
```

## Recent Language Mix For One Leaderboard Window

Use this when the user asks about language distribution across a recent rolling window.

```sql
with latest_dates as (
  select distinct td.date
  from public.trending_data td
  where td.period = 'monthly'
    and td.category = 'all'
  order by td.date desc
  limit 7
)
select
  coalesce(r.language, 'Unknown') as language,
  count(*) as appearance_count,
  count(distinct r.id) as repo_count,
  avg(td.forks) as avg_forks,
  avg(td.rank) as avg_rank,
  min(td.rank) as best_rank
from public.trending_data td
join latest_dates ld
  on ld.date = td.date
join public.repositories r
  on r.id = td.repository_id
where td.period = 'monthly'
  and td.category = 'all'
group by coalesce(r.language, 'Unknown')
order by appearance_count desc, best_rank asc;
```
