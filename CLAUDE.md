
# CLAUDE.md — GitHub Trending Dashboard

> 本文件供 AI Agent 快速理解项目结构、数据库和开发约定。

---

## 项目概述

**GitHub Trending Dashboard** 展示 GitHub 热门仓库，支持按日期、语言、周期（日/周/月）浏览趋势数据，以及全文搜索。

- **技术栈**：Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **数据库**：Supabase (PostgreSQL)，项目 ID：`oavfrzhquoxhmbluwgny`，区域：`ap-southeast-1`
- **部署**：Vercel
- **Supabase MCP**：可直接通过 MCP 操作数据库（查询、迁移、函数变更等）

---

## 目录结构

```
github-trending-website/
├── app/
│   ├── api/
│   │   ├── trending/         # 获取热门仓库（主接口）
│   │   ├── search/           # 全文搜索
│   │   ├── languages/        # 编程语言统计
│   │   ├── topics/           # 话题列表
│   │   └── topicstar/        # 话题星标数据
│   ├── topic/[topic]/        # 话题详情页
│   ├── topicstar/[topic]/    # 话题星标详情页
│   ├── page.tsx              # 首页（SSR，服务端预取数据）
│   ├── home-client.tsx       # 首页客户端状态管理
│   └── layout.tsx
├── components/
│   ├── RepoCard.tsx          # 仓库卡片（展示 overview/zh_description/description）
│   ├── LanguageTabs.tsx      # 语言分类 Tab
│   ├── PeriodSelector.tsx    # 日/周/月选择器
│   ├── DatePicker.tsx        # 日期选择器
│   ├── SearchComponent.tsx   # 搜索组件
│   └── StructuredData.tsx    # JSON-LD SEO
├── database/
│   └── schema.sql            # 表结构参考（实际以 Supabase 为准）
├── lib/
│   └── supabase.ts           # Supabase 客户端（区分 anon / service_role）
├── types/
│   └── database.ts           # TypeScript 类型定义
├── scripts/                  # 数据导入脚本
└── openspec/                 # OpenSpec 变更记录（Agent 工作流）
```

---

## 数据库（核心）

> **使用 Supabase MCP 操作数据库，项目 ID：`oavfrzhquoxhmbluwgny`**

### 表：`repositories` — 仓库元数据

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `name` | VARCHAR(255) | 仓库全名（owner/repo） |
| `url` | VARCHAR(500) | 仓库 URL（唯一） |
| `description` | TEXT | 英文描述 |
| `zh_description` | TEXT | 中文描述 |
| `overview` | TEXT | AI 生成的仓库概述（中文，较长） |
| `language` | VARCHAR(100) | 主要编程语言 |
| `owner` | VARCHAR(255) | 仓库所有者 |
| `repo_name` | VARCHAR(255) | 仓库短名 |
| `created_at` | TIMESTAMPTZ | 创建时间 |
| `updated_at` | TIMESTAMPTZ | 更新时间 |

### 表：`trending_data` — 趋势排行数据

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `repository_id` | UUID | 外键 → repositories.id |
| `date` | DATE | 趋势日期 |
| `category` | VARCHAR(50) | 语言分类：`all` / `python` / `typescript` / `javascript` / `jupyter` / `vue` |
| `period` | VARCHAR(20) | 周期：`daily` / `weekly` / `monthly` |
| `stars` | INTEGER | 总星标数 |
| `forks` | INTEGER | Fork 数 |
| `stars_today` | INTEGER | 今日新增星标 |
| `rank` | INTEGER | 当日当期排名 |
| `created_at` | TIMESTAMPTZ | 创建时间 |

唯一约束：`(repository_id, date, category, period)`

### 数据库函数

```sql
-- 获取趋势仓库列表（含 overview）
get_trending_repos(
  target_date DATE,
  target_category VARCHAR,
  target_period VARCHAR,
  limit_count INTEGER
) RETURNS TABLE(id, name, url, description, zh_description, overview, language, owner, repo_name, stars, forks, stars_today, rank)

-- 获取语言统计
get_language_stats(target_date DATE)
RETURNS TABLE(language, total_repos, total_stars, avg_stars)
```

### 已有索引

| 索引 | 说明 |
|------|------|
| `idx_trending_data_composite` | `(date, category, period)` — 主查询索引 |
| `idx_trending_data_composite_rank` | `(date, category, period, rank)` — 排序优化 |
| `idx_repositories_language` | `(language)` |
| `idx_repositories_overview_partial` | `WHERE overview IS NOT NULL` |

### 常用 MCP 查询示例

```sql
-- 查看最新日期有多少数据
SELECT date, count(*) FROM trending_data GROUP BY date ORDER BY date DESC LIMIT 5;

-- 查看某天 overview 填充率
SELECT count(*) FILTER (WHERE overview IS NOT NULL) as has_overview, count(*) as total
FROM repositories r
JOIN trending_data td ON r.id = td.repository_id
WHERE td.date = '2025-04-10' AND td.category = 'all' AND td.period = 'daily';
```

---

## 数据流

```
首次打开页面（SSR）：
  Vercel 服务器 → supabaseAdmin.rpc('get_trending_repos') → 直接渲染 HTML → 浏览器

切换语言/日期（客户端）：
  浏览器 → GET /api/trending?category=...&date=... → Vercel 缓存(5min) → Supabase
```

### 性能策略
- **SSR 预取**：`page.tsx` 服务端并行预取 trending + language 数据，首屏无 loading
- **HTTP 缓存**：`/api/trending` 缓存 5 分钟，`/api/languages` 缓存 10 分钟（`Cache-Control: public, s-maxage=...`）

---

## API 端点

| 端点 | 主要参数 | 缓存 |
|------|---------|------|
| `GET /api/trending` | `date`, `category`, `period`, `pageSize` | 5 分钟 |
| `GET /api/search` | `q`, `category`, `period`, `language`, `minStars`, `searchField` | 无 |
| `GET /api/languages` | `date` | 10 分钟 |
| `GET /api/topics` | — | — |
| `GET /api/topicstar` | — | — |

---

## 环境变量

```bash
NEXT_PUBLIC_SUPABASE_URL=https://oavfrzhquoxhmbluwgny.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          # 服务端写入用
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## npm 脚本

```bash
npm run dev          # 本地开发（http://localhost:3000）
npm run build        # 构建生产版本（TypeScript 检查）
npm run lint         # ESLint
npm run import-data  # 导入趋势数据到 Supabase
npm run db:setup     # 初始化数据库表结构
```

---

## 开发约定

1. **TypeScript 严格模式**：类型定义集中在 `types/database.ts`
2. **SSR 优先**：服务端可以执行的操作（数据预取）优先在 `page.tsx` 完成，减少客户端 loading
3. **Supabase 客户端分离**：`supabaseAdmin`（service_role）仅用于服务端 API，前端使用 `supabase`（anon）
4. **RLS 启用**：匿名用户只读，写入需 service_role key
5. **数据库变更**：优先通过 **Supabase MCP**（`apply_migration`）执行，而非手动执行 SQL
6. **API 缓存**：修改 API 响应时注意保留 `Cache-Control` 响应头

---

## Agent 工作流

- **OpenSpec**：变更管理工作流，位于 `.agent/workflows/`，使用 `/opsx-*` 命令
- **技能文件**：`.agent/skills/my-project/SKILL.md` — 代码库分析入口
- **Supabase MCP**：直接通过 MCP 工具查询/修改数据库，无需手动 psql
