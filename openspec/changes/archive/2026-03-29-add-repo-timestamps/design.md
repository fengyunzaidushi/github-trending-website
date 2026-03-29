## Context

当前 Supabase `repositories` 表中的 `created_at` 和 `updated_at` 记录的是后端脚本落库的时间。用户需要知道该仓库**在 GitHub 原本**的创建时间以及最近的更新时间，以便于后续功能分析仓库年龄和生命周期。

## Goals / Non-Goals

**Goals:**
- 将仓库原始的 `created_at`、`updated_at` 记录到 Supabase 中。
- 在后续采集或补充的时候，顺带用 GitHub API 取出这两个时间戳。

**Non-Goals:**
- 不破坏原有的 Supabase 系统字段（行级数据插入时间和更新时间）。
- 不立即强制更新以前所有的历史数据（可以通过 `refill` 脚本跑批，或者随每日任务逐渐更新）。

## Decisions

- **Decision 1: 新增专用的实体列**  
  在 `repositories` 表中新增 `github_created_at` 和 `github_updated_at` (timestamptz) 两个字段。  
  **Rationale**: 强行覆盖表级别的 `created_at` / `updated_at` 虽然省事，但容易干扰系统排查问题（例如“我们是什么时候收录某条数据的？”）。使用带 `github_` 前缀的专设字段语义最清晰。

- **Decision 2: 抓取时机放到 `github_trending_supabase.py` 环节还是 `refill_overview.py` 环节？**  
  **Rationale**: 出于性能考虑，爬虫 `github_trending_supabase.py` 可以顺带调用 `https://api.github.com/repos/{owner}/{repo}` 获取这俩字段。如果是以前的老数据，也可以写个专门的修补脚本或者在合并脚本里带上。

## Risks / Trade-offs

- **[Risk] GitHub API 限速与延迟**  
  爬虫列表如果拿到 50 个趋势仓库，逐个访问 API 会触发 Rate Limit 并拖慢效率。  
  **Mitigation**: 借鉴 `batch_enrich.py` 和 `refill_overview.py` 的多 Token 轮换策略和适当的 delay，以规避 403 限流；或利用并发请求（asyncio）。
