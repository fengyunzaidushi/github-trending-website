## Why

目前 `overview` 数据单独存储在 `repo_overviews` 表里，每次查询仓库信息都需要额外 JOIN 一张表才能获取 overview，增加了查询复杂度。同时日常爬虫写入的 trending 数据也没有附带 overview，导致需要两套独立流程来维护数据完整性。将 `overview` 合并到主表 `repositories` 可以简化查询，同时让每日爬虫一次性完成全部字段的写入。

## What Changes

- 在 `repositories` 表新增 `overview` 字段（text，nullable）
- 将 `repo_overviews` 表中现有的 `overview` 数据迁移到 `repositories.overview`
- 修改 `github_trends` 项目中的每日爬虫脚本（`github_trending_supabase.py`），在爬取 trending 仓库后，一次性写入 4 个字段：`github_created_at`、`github_updated_at`、`pushed_at`、`overview`

## Capabilities

### New Capabilities
- `overview-in-repositories`: 在 `repositories` 主表中直接存储 overview 文本，简化查询并统一写入路径。

### Modified Capabilities

## Impact

- **Database**: `repositories` 表新增 `overview` (text) 列；需要迁移脚本将 `repo_overviews.overview` 复制至 `repositories.overview`
- **Crawler**: `github_trends/github_trending_supabase.py` 需要在爬取完成后，新增从 GitHub / zread.ai 获取 overview 并写入的逻辑
- **Downstream**: 前端或后续分析脚本可直接从 `repositories` 表读取 `overview`，无需 JOIN `repo_overviews`
