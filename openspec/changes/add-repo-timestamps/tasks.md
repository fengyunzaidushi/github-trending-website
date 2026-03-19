## 1. 数据库更新 (Database)

- [x] 1.1 在 Supabase 的 `repositories` 表中新增 `github_created_at` 和 `github_updated_at` 字段，类型均为带时区的时间戳 (timestamptz)。

## 2. 爬虫脚本更新 (Crawler)

- [x] 2.1 修改 `github_trending_supabase.py`（实则迁移至 `refill_overview.py`），遍历 Trending 列表时遇到未完全收录的库，通过 GitHub API 获取原始 Repository 信息。
- [x] 2.2 剥离或复用之前已写好的 Token 轮换并发逻辑，防止触发 GitHub Rate Limit 限速。
- [x] 2.3 将拉取到的官方 `created_at` 与 `updated_at` 映射，并在写入 `repositories` 记录时一并 Upsert 到表里。
