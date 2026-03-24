## 1. 数据库更新 (Database)

- [x] 1.1 在 Supabase 的 `repositories` 表中新增 `overview` 字段，类型为 `TEXT`，默认允许为 NULL。

## 2. 数据迁移 (Migration)

- [x] 2.1 执行一次性迁移 SQL：将 `repo_overviews.overview` 中所有非 NULL 的值批量 UPDATE 到 `repositories.overview`（仅针对 `repositories.overview IS NULL` 的行）。
- [x] 2.2 验证迁移行的数量：确认 Supabase 中 `repositories.overview` 非 NULL 行数与 `repo_overviews.overview` 非 NULL 行数一致。

## 3. 爬虫改造 (Crawler)

- [x] 3.1 在 `github_trending_supabase.py` 中提取或引入 overview 获取函数（先请求 zread.ai，失败后 fallback 到 GitHub README 前 2000 字节）。
- [x] 3.2 在 upsert 仓库数据后，对 `repositories.overview` 为 NULL 的仓库调用该函数，并将结果写入 `repositories.overview`。
- [x] 3.3 确保对已有 `overview` 的仓库不发起请求（幂等保护）。

## 4. 验证

- [x] 4.1 运行 `python github_trending_supabase.py --dry-run`（若支持）或本地测试脚本，确认爬虫在处理新 repo 时能正确获取并输出 overview。
- [x] 4.2 在 Supabase 中查询样本行，确认 `repositories.overview` 有实际内容写入。
