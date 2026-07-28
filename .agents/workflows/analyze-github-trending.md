---
description: analyze github trending data from supabase
---

# Analyze GitHub Trending Data Workflow

This workflow provides standard operating procedures for analyzing the scraped GitHub trending and topic data using the Supabase MCP.

### Prerequisites
- The `supabase-mcp-server` MCP must be active.

### Steps

1. **Target Supabase Project**:
   Always use the following Supabase project ID for executing queries on the GitHub Trending database:
   - **Project ID**: `oavfrzhquoxhmbluwgny` (Name: mcp-server)

2. **Understand the Core Schema**:
   The `public` schema contains all the scraped data. The core tables you will frequently interact with are:
   - `repositories`: 存储仓库元数据，包含 `overview` 字段（AI 生成的中文简介摘要）。
   - `trending_data`: 存储每日快照（Date、Category、Period、Rank、Stars_Today），通过 `repository_id` 与 `repositories` Join。
   - `repo_overviews`: **核心分析表**，每个仓库一条记录，包含：
     - `overview`（TEXT）: AI 生成的仓库功能概要，**是进行深度语义分析的主要依据**
     - `readme`（TEXT）: 仓库 README 原始内容
     - `zread_available`（BOOL）: overview 是否可用
     - `readme_available`（BOOL）: readme 是否可用
     - 通过 `repository_id` 关联 `repositories.id`
   - `topic_repositories`: 按话题抓取的仓库，含 `readme_content` 字段，可用于 RAG 分析。
   - `users` / `user_repositories`: GitHub 用户/组织及其仓库信息。

3. **Executing Analysis Queries**:
   Use the `mcp_supabase-mcp-server_execute_sql` tool, ensuring the `project_id` is passed correctly.

   **⚠️ 分析优先级**: 查询时应优先 JOIN `repo_overviews` 获取 `overview` 字段，它包含比 `description` 更丰富的项目语义信息，是洞察仓库用途和价值的核心依据。`repositories.overview` 与 `repo_overviews.overview` 内容相同，可按需选择 Join 方式。

   *示例一 - 获取今日 Top 热门仓库（含 overview）:*
   ```sql
   SELECT
     r.name,
     r.url,
     r.language,
     t.category,
     t.rank,
     t.stars_today,
     COALESCE(ro.overview, r.description) AS overview
   FROM trending_data t
   JOIN repositories r ON t.repository_id = r.id
   LEFT JOIN repo_overviews ro ON ro.repository_id = r.id
   WHERE t.date = CURRENT_DATE
     AND t.category = 'all'
     AND t.period = 'daily'
   ORDER BY t.stars_today DESC
   LIMIT 15;
   ```

   *示例二 - 按日期获取最新一批 trending（当天无数据则自动取最近日期）:*
   ```sql
   SELECT
     r.name,
     r.url,
     r.language,
     t.category,
     t.rank,
     t.stars_today,
     COALESCE(ro.overview, r.description) AS overview
   FROM trending_data t
   JOIN repositories r ON t.repository_id = r.id
   LEFT JOIN repo_overviews ro ON ro.repository_id = r.id
   WHERE t.date = (SELECT MAX(date) FROM trending_data)
     AND t.category = 'all'
     AND t.period = 'daily'
   ORDER BY t.stars_today DESC
   LIMIT 15;
   ```

   *示例三 - 基于 overview 语义搜索 AI/Agent 相关仓库:*
   ```sql
   SELECT
     r.name,
     r.url,
     r.language,
     MAX(t.stars_today) AS max_stars_today,
     MAX(t.stars) AS total_stars,
     ro.overview
   FROM trending_data t
   JOIN repositories r ON t.repository_id = r.id
   LEFT JOIN repo_overviews ro ON ro.repository_id = r.id
   WHERE
     ro.overview ILIKE '%agent%'
     OR ro.overview ILIKE '%大模型%'
     OR ro.overview ILIKE '%LLM%'
     OR ro.overview ILIKE '%AI%'
   GROUP BY r.name, r.url, r.language, ro.overview
   ORDER BY max_stars_today DESC
   LIMIT 10;
   ```

   *示例四 - 统计 overview 覆盖率（确认数据质量）:*
   ```sql
   SELECT
     COUNT(*) AS total_repos,
     COUNT(ro.overview) AS repos_with_overview,
     ROUND(COUNT(ro.overview) * 100.0 / COUNT(*), 1) AS overview_coverage_pct
   FROM repositories r
   LEFT JOIN repo_overviews ro ON ro.repository_id = r.id;
   ```

4. **Formatting the Output**:
   - 优先使用 `overview` 字段进行仓库描述，而非简短的 `description`。
   - 根据用户隐含意图对结果分类（如：按编程语言、应用领域、技术方向等）。
   - 输出格式：可读 Markdown，包含可点击的链接 `[Repo Name](url)`，并突出显示 `stars_today` 和 `overview` 摘要。
   - 对 overview 内容进行总结提炼，而非原文照搬，使分析结论更具洞察力。