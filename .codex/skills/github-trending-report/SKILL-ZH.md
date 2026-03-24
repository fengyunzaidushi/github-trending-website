---
name: github-trending-report
description: 当用户希望基于 Supabase 的 GitHub Trending 数据做查看、总结、对比或趋势研判时使用，尤其适用于日/周/月榜、仓库概览、stars、创建时间、活跃时间、热门主题和产品灵感分析。
---

# GitHub Trending 报告技能（中文）

## 概述

本技能用于基于项目 Supabase 数据，快速理解 GitHub Trending 的变化与信号。
核心原则：榜单成员必须来自 `public.trending_data`，再通过 `public.repositories` 做信息补充与洞察解释。
不要从仓库元数据反推上榜关系。先用榜单事实确认“谁在榜上”，再解释“为什么在涨”。

## 工作流程

1. 先确定用户需求范围：
   - `daily`
   - `weekly`
   - `monthly`
   - 或多个周期对比
2. 从 `public.trending_data` 获取最新可用日期，并在输出中写明该日期。
3. 所有榜单查询都从 `public.trending_data` 出发。
4. 按 `td.repository_id = r.id` 联查 `public.repositories`。
5. 默认用中文输出（用户另有要求除外）。
6. `overview` 用于提炼决策信号，不是复述仓库介绍。
7. 绝不能用 `overview` 判断仓库是否“属于榜单”。

## 事实源（Source of Truth）

`daily`/`weekly`/`monthly` 的上榜事实都必须来自 `public.trending_data`。

应当这样做：
- 按 `date`、`category`、`period` 过滤 `trending_data`
- 通过 `trending_data.repository_id = repositories.id` 关联仓库信息

不要这样做：
- 从 `repositories` 起查
- 依据仓库名或 overview 文本推断上榜关系

## 实时数据字典（已通过 Supabase MCP 校验）

除非用户明确要求，否则本技能只使用以下两张表。

### `public.repositories`

- `id` uuid（主键）
- `name` varchar
- `url` varchar（唯一）
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

- `id` uuid（主键）
- `repository_id` uuid（外键 -> `repositories.id`）
- `date` date
- `category` varchar
- `period` varchar（`daily` / `weekly` / `monthly`）
- `stars` int
- `forks` int
- `stars_today` int
- `rank` int
- `created_at` timestamptz

## 标准联查写法

```sql
from public.trending_data td
join public.repositories r
  on r.id = td.repository_id
```

绝大多数报告默认使用该联查。

## 首选查询方式

优先使用 `Supabase MCP`（最适合读取线上实时数据）。

如果 MCP 不可用或不稳定，使用本地兜底脚本：

```bash
node .codex/skills/github-trending-report/scripts/fetch_trending_snapshot.mjs --period all --limit 10
```

该脚本会：
- 加载 `.env.local`
- 从 `trending_data` 获取最新日期
- 拉取 `daily`/`weekly`/`monthly`
- 联查 `repositories` 补充 `overview` 和元数据
- 输出结构化 JSON

对重复分析请求，优先使用场景脚本，而不是每次手写 SQL：

```bash
node .codex/skills/github-trending-report/scripts/fetch_trending_window.mjs --period monthly --category all --window 7
node .codex/skills/github-trending-report/scripts/analyze_recurring_repos.mjs --period monthly --category all --window 7 --min-appearances 2
node .codex/skills/github-trending-report/scripts/analyze_language_mix.mjs --period monthly --category all --window 7
node .codex/skills/github-trending-report/scripts/analyze_period_overlap_latest.mjs --category all
```

当 MCP 不方便时，优先用以下“视图风格”兜底脚本（可通过参数替换语言和周期）：

```bash
node .codex/skills/github-trending-report/scripts/fetch_latest_category_periods.mjs --category javascript --periods daily,weekly,monthly
node .codex/skills/github-trending-report/scripts/fetch_latest_period_board.mjs --period monthly --category all
node .codex/skills/github-trending-report/scripts/fetch_monthly_dedup.mjs --mode latest --category '*'
node .codex/skills/github-trending-report/scripts/fetch_monthly_dedup.mjs --mode window --category typescript --window-days 7
```

## 日期策略（重要）

- 默认“最新”应使用 `public.trending_data` 的 `max(td.date)`。
- `public.latest_trending` 视图采用 `CURRENT_DATE`，ETL 延迟时可能返回空。
- 因此除非用户明确要求“自然日今天”，都优先用 `max(td.date)`。
- 报告中必须写出使用的精确日期。

```sql
select max(date) as latest_trending_date
from public.trending_data;
```

## 参考视图提炼的查询蓝图

这些模式来源于现有 `public` 视图，但分析时仍建议直接查询基础表。

### 1）最新一天 + 单 category + 三周期（`all-dwn` / `js-dmn` / `python-dwn` / `ts-d-w-m` / `vue-dmn`）

适用于“某语言（或 all）在日/周/月三个周期的最新表现”。
`<category>` 可替换为 `all`、`javascript`、`python`、`typescript`、`vue` 或用户指定值。
推荐兜底脚本：

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

### 2）最新月榜（`monthly`）

适用于仅查看最新月榜。
推荐兜底脚本：

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

### 3）最新月榜按仓库去重（`rm-m`）

适用于同一仓库在多个 category 同时出现，但用户希望每仓库只保留一条记录。
推荐兜底脚本：

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

### 4）近 N 天滚动月榜去重（`rm-m-all` / `rm-m-js` / `rm-m-ts` / `tm-m-python`）

适用于“最近 7 次抓取”类问题和重复上榜分析。
推荐兜底脚本：

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

### 5）严格“今天”快照（`latest_trending`）

仅在用户明确要求“自然日今天”时使用。

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

### 6）仓库元数据盘点（`repo`）

用于补充“仓库年龄/活跃度”背景，不可用于决定榜单归属。

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

## 场景路由

先把用户问题映射到最接近的脚本，再解读 JSON 输出。

- 最近滚动窗口原始数据：
  运行 `scripts/fetch_trending_window.mjs`
- 最近多次抓取中的重复上榜：
  运行 `scripts/analyze_recurring_repos.mjs`
- 最近窗口的语言构成：
  运行 `scripts/analyze_language_mix.mjs`
- 最新一次日/周/月交集：
  运行 `scripts/analyze_period_overlap_latest.mjs`

常见问题与脚本映射：

- “最近 7 天抓取的 7 次上过月榜的 repo”
  使用 `analyze_recurring_repos.mjs --period monthly --window 7`
- “最近 7 次月榜的语言分布”
  使用 `analyze_language_mix.mjs --period monthly --window 7`
- “最新一次有哪些 repo 同时上日榜和周榜”
  使用 `analyze_period_overlap_latest.mjs`
- “把最近 14 次周榜原始数据拉出来”
  使用 `fetch_trending_window.mjs --period weekly --window 14`

## 数据范围约束

默认仅使用：
- `public.trending_data`
- `public.repositories`

不要使用：
- `repo_overviews`

## 必备输出字段

每个被提及仓库尽量包含以下字段（若存在）：
- `rank`
- `name`
- `language`
- `stars`
- `forks`
- `stars_today`
- `github_created_at`
- `pushed_at`
- `overview`

字段缺失时必须明确说明缺失，不得编造。

## 如何使用 `overview`

当 `overview` 存在时，优先提炼以下信号：
- 服务对象（用户/买方）是谁
- 解决的具体痛点是什么
- 产品切入点或分发抓手是什么
- 为什么它在当前时间点走热
- 可复用的产品思路、工作流或功能点
- 成熟度信号：新发布/基础设施/成熟工具/教学项目/热点实验

不必机械覆盖所有维度，只提炼文本支持的结论。

## `overview` 的禁区

不要：
- 把 README 换种说法再复述
- 只写“这是一个 AI 工具/框架”这类空泛标签
- 堆技术细节却不解释其增长意义
- 所有仓库都用同一个模板平铺
- 把基于 `overview` 的推断写成确定事实

不佳示例：
- “这个仓库是一个离线知识管理平台。”

更好示例：
- “这个仓库把离线知识、本地 AI 与 Docker 编排打包成面向普通用户的一体化自托管方案，信号是用户在追求‘主权式一站式产品’，而不只是单点工具。”

## 报告结构（默认）

除非用户要求更窄范围，按以下结构组织：

```markdown
**日期**
- 明确写出本次使用的最新趋势日期。

**总览**
- 3-6 条要点总结主信号。

**日榜**
- 简短总结。
- 给出重点仓库：stars、创建时间、最近活跃时间，并附 1-2 行有价值解读。

**周榜**
- 简短总结。
- 按同样字段给出重点仓库。

**月榜**
- 简短总结。
- 按同样字段给出重点仓库。

**产品启发**
- 扁平要点列出值得借鉴、跟踪、学习的方向。
```

## 分析规则

- 只要存在歧义风险，就使用精确日期，不用“今天/昨天”等相对表达。
- 基于 `overview` 的结论要明确标注为推断（inference）。
- `overview` 用来提炼产品、人群、工作流、市场信号。
- 不要只复述仓库名和分类。
- 每个重点仓库都尽量回答：“这件事为什么重要？”或“读者可以据此做什么？”
- 多仓库指向同一信号时，优先做对比与聚类。
- `overview` 很技术化时，压缩为业务含义，不做架构复读。
- 若 overview 覆盖不完整，要明确说明。
- 用户只看一个周期时可以聚焦该周期，但榜单事实源仍是 `trending_data`。
- 只要有推断，就显式写“推断”。

## 输出风格偏好

追求“洞察密度”而非“信息堆砌”。

优先使用这类表达：
- “这说明……”
- “这里真正有用的信号是……”
- “值得持续跟踪，因为……”
- “很可能在借势……”
- “对产品团队可复用的点是……”

尽量避免这类空泛表达：
- “它是一个……”
- “这个仓库提供了……”
- “这个项目使用了……”

除非这些细节确实支撑核心结论。

## 参考资料

- SQL 模式与模板：`references/query-patterns.md`
- 场景查询：`references/scenario-queries.md`
- 兜底快照脚本：`scripts/fetch_trending_snapshot.mjs`
- 窗口抓取脚本：`scripts/fetch_trending_window.mjs`
- 重复上榜分析：`scripts/analyze_recurring_repos.mjs`
- 语言分布分析：`scripts/analyze_language_mix.mjs`
- 周期交集分析：`scripts/analyze_period_overlap_latest.mjs`
- 视图风格（最新分类三周期）：`scripts/fetch_latest_category_periods.mjs`
- 视图风格（最新单周期榜单）：`scripts/fetch_latest_period_board.mjs`
- 视图风格（月榜去重/滚动去重）：`scripts/fetch_monthly_dedup.mjs`
