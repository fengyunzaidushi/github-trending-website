## 1. 数据库更新 (Database)

- [x] 1.1 在 Supabase 的 `repositories` 表中新增 `pushed_at` 字段，类型为 `TIMESTAMP WITH TIME ZONE`，默认允许为 NULL。

## 2. 回填脚本更新 (Backfill Script)

- [x] 2.1 修改 `backfill_timestamps.py`，在对数据库执行 `update()` 时，将已从 API 拿到的 `pushed_at` 值一并写入新字段。
- [x] 2.2 确认本地 JSON 输出文件（`backfill_data_*.json`）中的记录已包含 `pushed_at` 字段（目前 `fetch_repo_metadata` 已抓取，无需修改采集逻辑）。

## 3. 验证

- [x] 3.1 运行 `python backfill_timestamps.py --dry-run` 确认输出中包含 `pushed_at` 字段的正确格式。
- [x] 3.2 在 Supabase 查询确认迁移字段存在且有效记录写入。
