## Context

目前 overview 数据分两步产生：
1. 每日爬虫 `github_trending_supabase.py` 只写入基础的 trending 数据到 `repositories` 表（名称、语言、description 等）
2. 独立的补充脚本 `refill_overview.py` 异步运行，从 zread.ai 拉取 overview，写入单独的 `repo_overviews` 表

这样两表分离造成了：查询需要额外 JOIN，数据新鲜度不一致，且前端需要维护两个数据源。

## Goals / Non-Goals

**Goals:**
- 在 `repositories` 表新增 `overview` TEXT 列，将 overview 数据就近存储
- 一次性将 `repo_overviews.overview` 中的现有数据迁移至 `repositories.overview`
- 改造 `github_trending_supabase.py`，在发现新 repo 时尝试从 zread.ai / GitHub README 获取 overview 并一并写入

**Non-Goals:**
- 不删除 `repo_overviews` 表（保留历史 readme 等额外字段，只是不作为 overview 首选来源了）
- 不修改 `refill_overview.py`（作为兜底补全手段继续运行）
- 不实现 overview 的自动刷新（只写入 overview 为空的新 repo）

## Decisions

- **Decision 1:** overview 存放位置
  `repositories.overview` 而非新建中间表。理由：overview 是仓库最核心的文字描述，应与主体表共存，便于前端单次查询获取所有数据。

- **Decision 2:** 爬虫如何获取 overview
  复用 `refill_overview.py` 的策略：先请求 zread.ai `/{owner}/{repo}/1-overview`，失败时 fallback 用 GitHub API 的 README base64 解码后取前 2000 字节作为 overview。
  不新增外部依赖，代码可直接从 refill_overview.py 提取为独立函数。

- **Decision 3:** 爬虫中 overview 请求的时机
  在 repo upsert 成功后，仅对 `overview` 当前为空的 repo 发起请求，避免重复覆盖已有内容。

## Risks / Trade-offs

- **[Risk] 爬虫速度变慢**
  每个新 repo 多 1-2 次 HTTP 请求（zread + GitHub README）。
  Mitigation: 仅对当天新增 / overview 为空的 repo 发起，且控制并发不超原有上限。

- **[Risk] 数据迁移时 repo_overviews 与 repositories 有 id 对应不全**
  `repo_overviews.repository_id` 是 FK 到 repositories.id，直接 UPDATE JOIN 即可，不影响无记录的老数据。

## Migration Plan

1. 执行 DDL：`ALTER TABLE repositories ADD COLUMN IF NOT EXISTS overview TEXT`
2. 执行数据同步 SQL：将 `repo_overviews.overview` 批量更新到 `repositories.overview`（WHERE repositories.overview IS NULL）
3. 改造爬虫脚本并部署
4. 验证：查询 `repositories` 样本行，确认 `overview` 字段有值
