## Context

当前对于判断一个项目是否为活跃项目，仅依赖于 Supabase 记录的最后抓取更新时间 (`updated_at` / `github_updated_at`) 是不够精确的。因为项目的 README 会被修改、Star 会涨跌，但如果不涉及核心代码的维护与合并，依然是一个“代码停滞状态”的项目。因此需要引入官方的 `pushed_at` 字段作为度量标准。

目前我们上线的 `backfill_timestamps.py` 本身在执行 `fetch_repo_metadata()` 时就已经把包含 `pushed_at` 在内的丰富元数据组装好放在本地 JSON 了，因此只需完成 Supabase 入库对接即可。

## Goals / Non-Goals

**Goals:**
- 将 Github 提供的原汁原味的 `pushed_at` 在 `repositories` 中固化下来。
- 在后续的批量入库操作（或者每天定时刷新任务）中支持对该字段的 Upsert 更新。

**Non-Goals:**
- 不删除系统自身的 `updated_at` 和 `created_at`（它代表平台录入和修补状态的最晚时间）。

## Decisions

- **Decision 1:** 采取何种字段类型？
  **Rationale**: 统一跟 `github_created_at` 保持一致，设定为 `TIMESTAMP WITH TIME ZONE (timestamptz)`，以准确反向映射 UTC 时间点。
  
- **Decision 2:** 存储在哪里？
  **Rationale**: 直接将 `pushed_at` 附加在主体表 `repositories` 里，跟现有 `github_updated_at` 并排，这样无需进行额外连表查询即可筛选活跃项目列表。

## Risks / Trade-offs

- **[Risk] 部分老旧仓库历史数据可能无此字段**
  **Mitigation:** 数据库创建此列时必须允许即 default null，程序在映射字典时也要调用 `data.get('pushed_at')` 做空值宽容处理。
