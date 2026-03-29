## Why

目前数据库中 `repositories` 表的 `created_at` 和 `updated_at` 字段实际上记录的是数据抓取入库的时间。为了更好地展现开源仓库的新旧程度及活跃度（例如前端展示），我们需要获取并持久化该仓库在 GitHub 上真实的创建时间与最后更新时间。

## What Changes

- 修改数据采集/富化脚本，调用 GitHub API 拉取对应仓库真实的 `created_at` 和 `updated_at` 字段。
- 修改数据库落库逻辑，保存真实的时间信息。
- **建议（非破坏性）**：由于 Supabase/PostgreSQL 表默认包含记录的系统创建/更新时间，建议在 `repositories` 表中增加专门的 `github_created_at` 和 `github_updated_at` 两个字段，专门储存 GitHub 原始时间数据，避免与系统记录入库时间的逻辑冲突。

## Capabilities

### New Capabilities

- `github-repo-timestamps`: 从 GitHub API 拉取真实的仓库元数据（创建时间与更新时间）并持久化到 Supabase 的 `repositories` 表中。

### Modified Capabilities



## Impact

- **Database**: 需要在 `oavfrzhquoxhmbluwgny` 项目的 `repositories` 表中增加 `github_created_at` 和 `github_updated_at` 字段。
- **Python 爬虫/清洗脚本**: 需要在拉取或富化阶段（如 `github_trending_supabase.py` 或 `refill_overview.py`）增加对 GitHub API Repository 接口的调用。
- **前端页面**: 可能会根据新增加的时间字段进行渲染或排序展示。
