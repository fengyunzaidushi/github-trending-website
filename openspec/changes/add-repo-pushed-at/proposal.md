## Why

为了更精确地衡量一个开源项目的生命力与沉寂状态，仅依靠 `github_updated_at` (可能只是某人 star 了一下或者仅仅是元数据级别的无关更新) 往往是不够的。`pushed_at` 代表着仓库里代码最后一次被提交推送的真实时间，它是判断一个项目“代码层面还在不在活跃维护”最重要、最具参考价值的防衰退指标。

## What Changes

- 在数据库 `repositories` 表中新增字段 `pushed_at`，数据类型采用 `timestamptz`。
- 修改 `backfill_timestamps.py` 及未来所有的批量回填/抓取脚本，将其在提取到的大全集元数据里取出的 `pushed_at` 也一并持久化回写至 Supabase。

## Capabilities

### New Capabilities
- `pushed-at-tracking`: Tracks the real GitHub repository code push timestamp to evaluate long-term code activity correctly.

### Modified Capabilities


## Impact

- **Database Schema**: `repositories` 表需要触发一次 `ALTER TABLE` 迁移。
- **Crawler Scripts**: 后端辅助的数据修正脚本和富化抓取脚本需要扩展写入字段映射。
