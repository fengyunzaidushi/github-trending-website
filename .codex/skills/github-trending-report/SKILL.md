---
name: github-trending-report
description: Use when the user asks to inspect, summarize, compare, or report this project's GitHub Trending data from Supabase, especially for daily, weekly, or monthly rankings, repo overviews, stars, created dates, pushed dates, hot themes, or product inspiration.
---

# GitHub Trending Report

## Overview

Use this skill to quickly understand GitHub Trending momentum from the project's Supabase data.
Core principle: leaderboard membership must come from `public.trending_data`, then enrich by joining `public.repositories`.
Do not start from repository metadata and infer ranking. Start from ranking facts, then explain why those repos are moving.

## Workflow

1. Determine the scope the user wants:
   - `daily`
   - `weekly`
   - `monthly`
   - or a comparison across multiple periods
2. Find the latest available date from `public.trending_data` and use that exact date in the response.
3. Start every leaderboard query from `public.trending_data`.
4. Join `public.repositories` on `td.repository_id = r.id`.
5. Summarize the result in Chinese unless the user asked otherwise.
6. Use `overview` to extract decision-useful signals, not to restate what the repo is.
7. Never use `overview` to decide whether a repo belongs on the leaderboard.

## Source Of Truth

For `daily`, `weekly`, and `monthly`, leaderboard membership must come from `public.trending_data`.

Do this:
- Filter `trending_data` by `date`, `category`, and `period`
- Join `repositories` with `trending_data.repository_id = repositories.id`

Do not do this:
- Start from `repositories`
- Infer leaderboard membership from repo names or overview text

## Live Data Dictionary (Verified From Supabase MCP)

Only use these two tables for this skill unless the user explicitly asks otherwise.

### `public.repositories`

- `id` uuid (PK)
- `name` varchar
- `url` varchar (unique)
- `description` text
- `zh_description` text
- `language` varchar
- `owner` varchar
- `repo_name` varchar
- `created_at` timestamptz
- `updated_at` timestamptz
- `github_created_at` timestamptz
- `github_updated_at` timestamptz
- `pushed_at` timestamptz
- `overview` text

### `public.trending_data`

- `id` uuid (PK)
- `repository_id` uuid (FK -> `repositories.id`)
- `date` date
- `category` varchar
- `period` varchar (`daily` / `weekly` / `monthly`)
- `stars` int
- `forks` int
- `stars_today` int
- `rank` int
- `created_at` timestamptz

## Canonical Join

```sql
from public.trending_data td
join public.repositories r
  on r.id = td.repository_id
```

This join is the default for almost every report.

## Preferred Query Method

Use `Supabase MCP` first when it is available. It is the cleanest way to inspect the live project database.

If MCP is unavailable or flaky, run the local fallback script:

```bash
node .codex/skills/github-trending-report/scripts/fetch_trending_snapshot.mjs --period all --limit 10
```

The fallback script:
- loads `.env.local`
- finds the latest date from `trending_data`
- fetches `daily`, `weekly`, and `monthly`
- pulls repo metadata and `overview` from `repositories`
- returns structured JSON

For repeated analysis requests, prefer these scenario scripts before hand-writing ad hoc queries:

```bash
node .codex/skills/github-trending-report/scripts/fetch_trending_window.mjs --period monthly --category all --window 7
node .codex/skills/github-trending-report/scripts/analyze_recurring_repos.mjs --period monthly --category all --window 7 --min-appearances 2
node .codex/skills/github-trending-report/scripts/analyze_language_mix.mjs --period monthly --category all --window 7
node .codex/skills/github-trending-report/scripts/analyze_period_overlap_latest.mjs --category all
```

For view-style fallback (especially when MCP is not convenient), prefer these reusable scripts:

```bash
node .codex/skills/github-trending-report/scripts/fetch_latest_category_periods.mjs --category javascript --periods daily,weekly,monthly
node .codex/skills/github-trending-report/scripts/fetch_latest_period_board.mjs --period monthly --category all
node .codex/skills/github-trending-report/scripts/fetch_monthly_dedup.mjs --mode latest --category '*'
node .codex/skills/github-trending-report/scripts/fetch_monthly_dedup.mjs --mode window --category typescript --window-days 7
```

## Date Strategy (Important)

- Default "latest" should use `max(td.date)` from `public.trending_data`.
- The `public.latest_trending` view uses `CURRENT_DATE`; this can be empty if ETL is delayed.
- Therefore, prefer `max(td.date)` for robust reporting unless the user explicitly asks for strict "today".
- Always print the exact date used in the report.

```sql
select max(date) as latest_trending_date
from public.trending_data;
```

## View-Inspired Query Blueprints

These `public` views encode useful patterns, but analysis should still be done directly from base tables.

### 1) Latest day, one category, all periods (`all-dwn` / `js-dmn` / `python-dwn` / `ts-d-w-m` / `vue-dmn`)

Use when user asks for one language/category across daily+weekly+monthly at latest capture.
Set `<category>` to `all`, `javascript`, `python`, `typescript`, `vue`, or another requested category.
Preferred fallback script:

```bash
node .codex/skills/github-trending-report/scripts/fetch_latest_category_periods.mjs --category <category> --periods daily,weekly,monthly
```

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
where td.category = '<category>'

  and td.period in ('daily', 'weekly', 'monthly')
order by td.period, td.rank;
```

### 2) Latest monthly board (`monthly`)

Use when user asks only for latest monthly leaderboard.
Preferred fallback script:

```bash
node .codex/skills/github-trending-report/scripts/fetch_latest_period_board.mjs --period monthly --category '*'
```

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
  td.stars_today,
  r.name,
  r.language,
  r.overview
from public.trending_data td
join latest_date ld
  on td.date = ld.date
join public.repositories r

  on r.id = td.repository_id
where td.period = 'monthly'
order by td.rank asc;
```

### 3) Latest monthly, dedup repeated repos across categories (`rm-m`)

Use when same repo appears in multiple monthly categories and user wants one row per repo.
Preferred fallback script:

```bash
node .codex/skills/github-trending-report/scripts/fetch_monthly_dedup.mjs --mode latest --category '*'
```

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

### 4) Rolling recent N days monthly snapshot with dedup (`rm-m-all` / `rm-m-js` / `rm-m-ts` / `tm-m-python`)

Use for "recent 7 captures" style questions and recurring repo detection.
Preferred fallback script:

```bash
node .codex/skills/github-trending-report/scripts/fetch_monthly_dedup.mjs --mode window --category all --window-days 7
```

```sql
with latest_date as (
  select max(td.date) as date
  from public.trending_data td
),
windowed as (
  select
    td.date,
    td.period,
    td.category,
    td.rank,
    td.stars,
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
      order by td.date desc, td.stars desc, td.rank asc, r.id
    ) as rn
  from public.trending_data td
  join latest_date ld
    on td.date between (ld.date - interval '6 days') and ld.date
  join public.repositories r
    on r.id = td.repository_id
  where td.period = 'monthly'
    and td.category = 'all'
)
select *
from windowed
where rn = 1
order by stars desc, name asc;
```

### 5) Today-only strict snapshot (`latest_trending`)

Use only when user explicitly asks for calendar "today" and not "latest available".

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

### 6) Repository metadata inventory (`repo`)

Use when user asks about repo age/activity context without changing leaderboard membership.

```sql
select
  r.id,
  r.name,
  r.url,
  r.language,
  r.github_created_at,
  r.github_updated_at,
  r.pushed_at,
  r.overview
from public.repositories r
order by r.created_at desc;
```

## Scenario Routing

Map the user's question to the closest script first, then analyze the returned JSON.

- Recent rolling window raw data:
  Run `scripts/fetch_trending_window.mjs`
- Repeated leaderboard membership across recent captures:
  Run `scripts/analyze_recurring_repos.mjs`
- Language composition or stack concentration across recent captures:
  Run `scripts/analyze_language_mix.mjs`
- Latest daily/weekly/monthly overlap or intersection:
  Run `scripts/analyze_period_overlap_latest.mjs`

Common prompts and matching script:

- "最近 7 天抓取的 7 次上过月榜的 repo"
  Use `analyze_recurring_repos.mjs --period monthly --window 7`
- "最近 7 次月榜的语言分布"
  Use `analyze_language_mix.mjs --period monthly --window 7`
- "最新一次有哪些 repo 同时上日榜和周榜"
  Use `analyze_period_overlap_latest.mjs`
- "把最近 14 次周榜原始数据拉出来"
  Use `fetch_trending_window.mjs --period weekly --window 14`

## Data Scope

Use only these two tables for this skill unless the user explicitly asks for something else:

- `public.trending_data`
- `public.repositories`

Do not use:
- `repo_overviews`

## Required Fields

For each repo you mention, include these fields whenever available:
- `rank`
- `name`
- `language`
- `stars`
- `forks`
- `stars_today`
- `github_created_at`
- `pushed_at`
- `overview`

If a field is missing, say it is missing. Do not invent values.

## What To Extract From `overview`

When `overview` is present, try to extract the following kinds of signal:
- the user or buyer this repo serves
- the concrete pain point it removes
- the product wedge or distribution hook
- the reason it may be trending now
- the adjacent product idea, workflow, or feature worth borrowing
- the maturity signal: new launch, infrastructure layer, polished tool, educational project, or hype experiment

Do not force every category for every repo. Use only what the text can support.

## What Not To Do With `overview`

Do not:
- rewrite the README in shorter words
- repeat the repo name plus a generic label such as "an AI tool" or "a framework"
- dump architecture details unless they explain adoption, differentiation, or traction
- present all repos in the same flat template with no judgment
- imply certainty when the conclusion is only an inference from `overview`

Bad:
- "This repo is a platform for offline knowledge management."

Better:
- "This repo is packaging offline knowledge, local AI, and Docker orchestration into a consumer-friendly self-hosted bundle, which suggests demand for all-in-one sovereignty products rather than another single-purpose tool."

## Report Structure

Use this structure unless the user asked for something narrower:

```markdown
**Date**
- State the exact latest trending date used.

**Overview**
- 3-6 bullets summarizing the main signals.

**Daily**
- Short summary.
- Mention standout repos with stars, created date, pushed date, and one or two lines of useful interpretation.

**Weekly**
- Short summary.
- Mention standout repos with the same fields.

**Monthly**
- Short summary.
- Mention standout repos with the same fields.

**Product Takeaways**
- Flat bullets on what is worth borrowing, watching, or learning from.
```

## Analysis Rules

- Prefer exact dates over relative wording like "today" if there is any chance of ambiguity.
- Be explicit when a conclusion is inferred from `overview`.
- Use `overview` to extract product, audience, workflow, and market signals.
- Do not just restate the repo name or its top-level category.
- For each highlighted repo, answer some version of: "why does this matter?" or "what should the reader do with this?"
- Prefer comparisons and clustering when multiple repos point at the same trend.
- If the `overview` is long and technical, compress it into implications, not architecture recaps.
- If overview coverage is incomplete, call it out.
- If the user asks only for one period, focus there but still keep `trending_data` as the leaderboard source.
- If you use any inference from `overview`, label it clearly as inference.

## Preferred Output Style

Aim for insight density over completeness.

Prefer wording like:
- "This suggests..."
- "The useful signal here is..."
- "Worth watching because..."
- "Likely riding..."
- "A reusable idea for product teams is..."

Avoid wording like:
- "It is a..."
- "This repository provides..."
- "This project uses..."

unless those details are necessary to support the insight.

## References

- SQL and query patterns: [references/query-patterns.md](references/query-patterns.md)
- Scenario queries: [references/scenario-queries.md](references/scenario-queries.md)
- Fallback script: [scripts/fetch_trending_snapshot.mjs](scripts/fetch_trending_snapshot.mjs)
- Window fetcher: [scripts/fetch_trending_window.mjs](scripts/fetch_trending_window.mjs)
- Recurring analysis: [scripts/analyze_recurring_repos.mjs](scripts/analyze_recurring_repos.mjs)
- Language mix analysis: [scripts/analyze_language_mix.mjs](scripts/analyze_language_mix.mjs)
- Period overlap analysis: [scripts/analyze_period_overlap_latest.mjs](scripts/analyze_period_overlap_latest.mjs)
- View-style latest category periods: [scripts/fetch_latest_category_periods.mjs](scripts/fetch_latest_category_periods.mjs)
- View-style latest period board: [scripts/fetch_latest_period_board.mjs](scripts/fetch_latest_period_board.mjs)
- View-style monthly dedup: [scripts/fetch_monthly_dedup.mjs](scripts/fetch_monthly_dedup.mjs)
