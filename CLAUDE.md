
# AGENTS.md — GitHub Trending Dashboard

> 本文件提供项目概览，供 AI Agent（如 Claude、Gemini、Copilot 等）快速理解项目结构和开发约定。

---

## 项目概述

**GitHub Trending Dashboard** 是一个展示 GitHub 热门仓库的 Web 应用，支持按日期、语言、周期（日/周/月）浏览趋势数据，以及全文搜索仓库。

- **技术栈**：Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **数据库**：Supabase (PostgreSQL)
- **部署平台**：Cloudflare Workers（via `@opennextjs/cloudflare`）
- **语言**：TypeScript（100%）

---

## 目录结构

```
github-trending-website/
├── app/                      # Next.js App Router 页面和 API
│   ├── api/                  # API 路由（Route Handlers）
│   │   ├── trending/         # 获取热门仓库列表
│   │   ├── search/           # 仓库搜索
│   │   ├── languages/        # 编程语言统计
│   │   ├── topics/           # 话题列表
│   │   ├── topicstar/        # 话题星标数据
│   │   ├── date-stats/       # 日期统计
│   │   ├── db-info/          # 数据库信息
│   │   ├── readme/           # 仓库 README 获取
│   │   ├── test/             # API 连通性测试
│   │   └── test-db/          # 数据库连通性测试
│   ├── topic/                # 话题浏览页面
│   │   └── [topic]/          # 动态话题详情页
│   ├── topicstar/            # 话题星标页面
│   ├── page.tsx              # 首页（SSR）
│   ├── home-client.tsx       # 首页客户端逻辑（状态管理、交互）
│   ├── layout.tsx            # 全局布局
│   ├── metadata.ts           # SEO 元数据配置
│   ├── sitemap.ts            # 站点地图生成
│   ├── robots.ts             # robots.txt 生成
│   └── globals.css           # 全局样式
├── components/               # 可复用 React 组件
│   ├── RepoCard.tsx          # 仓库卡片展示
│   ├── LanguageTabs.tsx      # 语言分类 Tab
│   ├── PeriodSelector.tsx    # 日/周/月周期选择器
│   ├── DatePicker.tsx        # 日期选择器
│   ├── SearchComponent.tsx   # 搜索组件（含高级筛选）
│   ├── Pagination.tsx        # 分页组件
│   ├── TopicNavigation.tsx   # 话题导航
│   ├── SEOHead.tsx           # SEO 头部组件
│   └── StructuredData.tsx    # JSON-LD 结构化数据
├── database/                 # 数据库相关文件
│   ├── schema.sql            # 主表结构（repositories + trending_data）
│   ├── date_statistics.sql   # 日期统计查询
│   ├── date_group_statistics.sql
│   ├── date_statistics_examples.sql
│   └── trending_data_analysis.sql
├── scripts/                  # 数据管理脚本
│   ├── import-data.ts        # 导入趋势数据（TypeScript）
│   ├── import-data.mjs       # 导入趋势数据（ESM）
│   ├── import-topic-data.mjs # 导入话题数据
│   ├── setup-database.ts     # 初始化数据库
│   ├── setup-topic-database.mjs  # 初始化话题数据库
│   ├── setup-topic-database.sql  # 话题表 SQL
│   ├── create-topic-table.sql    # 建表脚本
│   ├── analyze-trending-data.mjs # 趋势数据分析
│   ├── check-missing-dates.mjs   # 检查数据缺失日期
│   └── date-group-stats.mjs      # 日期分组统计
├── types/
│   └── database.ts           # TypeScript 类型定义（TrendingRepo 等）
├── lib/                      # 工具库（Supabase 客户端等）
├── public/                   # 静态资源
├── openspec/                 # OpenSpec 变更记录（Agent 工作流）
├── .agent/                   # Agent 技能和工作流配置
│   └── skills/
│       └── my-project/SKILL.md   # 项目代码库技能分析入口
├── next.config.js            # Next.js 配置
├── wrangler.jsonc            # Cloudflare Workers 配置
├── package.json              # 依赖与 npm 脚本
├── tsconfig.json             # TypeScript 配置
├── .env.example              # 环境变量模板
├── API_STATUS.md             # API 状态和端点说明
├── SEARCH_GUIDE.md           # 搜索功能使用指南
└── RECOVERY_REPORT.md        # 功能恢复历史报告
```

---

## 数据库结构

使用 **Supabase（PostgreSQL）**，两张核心表：

### `repositories` — 仓库元数据
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `name` | VARCHAR | 仓库全名（owner/repo） |
| `url` | VARCHAR | 仓库 URL（唯一） |
| `description` | TEXT | 英文描述 |
| `zh_description` | TEXT | 中文描述 |
| `language` | VARCHAR | 主要编程语言 |
| `owner` | VARCHAR | 仓库所有者 |
| `repo_name` | VARCHAR | 仓库短名 |

### `trending_data` — 趋势排行数据
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `repository_id` | UUID | 外键关联 repositories |
| `date` | DATE | 趋势日期 |
| `category` | VARCHAR | 语言分类（all/python/typescript 等） |
| `period` | VARCHAR | 周期（daily/weekly/monthly） |
| `stars` | INTEGER | 总星标数 |
| `stars_today` | INTEGER | 今日新增星标 |
| `rank` | INTEGER | 排名 |

---

## API 端点

所有端点位于 `app/api/`，均为 Next.js Route Handlers：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/trending` | GET | 按日期/语言/周期获取热门仓库，参数：`date`, `category`, `period`, `pageSize` |
| `/api/search` | GET | 全文搜索，参数：`q`, `category`, `period`, `language`, `minStars`, `searchField` |
| `/api/languages` | GET | 获取编程语言统计，参数：`date` |
| `/api/topics` | GET | 获取话题列表 |
| `/api/topicstar` | GET | 获取话题星标数据 |
| `/api/date-stats` | GET | 日期维度统计 |
| `/api/db-info` | GET | 数据库连接状态 |
| `/api/readme` | GET | 获取仓库 README |
| `/api/test` | GET | API 连通性测试 |

---

## 环境变量

参考 `.env.example`，必须配置以下环境变量：

```bash
# Supabase（必须）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# SEO（可选）
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_NAME="GitHub Trending Dashboard"
GOOGLE_VERIFICATION_CODE=your-google-verification-code
GOOGLE_ANALYTICS_ID=your-ga-id
BAIDU_ANALYTICS_ID=your-baidu-id
```

Cloudflare Workers 的 Secrets 通过 `.dev.vars` 文件配置（本地开发用）。

---

## npm 脚本

```bash
npm run dev            # 本地开发服务器（Next.js，http://localhost:3000）
npm run build          # 构建生产版本
npm run start          # 运行生产服务器
npm run lint           # ESLint 代码检查
npm run deploy         # 构建并部署到 Cloudflare Workers
npm run preview        # 本地预览 Cloudflare Workers 版本
npm run import-data    # 导入趋势数据（TypeScript 版）
npm run import-data:mjs # 导入趋势数据（ESM 版）
npm run db:setup       # 初始化数据库
npm run topic:setup-db # 初始化话题数据库
npm run topic:import   # 导入话题数据
```

---

## 核心页面路由

| 路径 | 文件 | 说明 |
|------|------|------|
| `/` | `app/page.tsx` + `app/home-client.tsx` | 首页趋势榜（支持筛选、搜索） |
| `/topic` | `app/topic/page.tsx` | 话题浏览页 |
| `/topic/[topic]` | `app/topic/[topic]/page.tsx` | 话题详情页 |
| `/topicstar` | `app/topicstar/` | 话题星标页 |

---

## 主要组件说明

- **`HomeClient`**（`app/home-client.tsx`）：首页客户端逻辑，管理趋势数据/搜索状态、URL 参数同步
- **`RepoCard`**：单个仓库展示卡片，显示名称、描述、语言、星标数和排名
- **`SearchComponent`**：搜索框含高级筛选（语言、最低星标、搜索字段）
- **`LanguageTabs`**：语言分类切换 Tab，显示各语言仓库数量
- **`StructuredData`**：输出 JSON-LD 结构化数据，增强 SEO

---

## 开发约定

1. **TypeScript 严格模式**：所有代码使用 TypeScript，类型定义在 `types/database.ts`
2. **App Router**：使用 Next.js App Router（而非 Pages Router），服务端组件优先
3. **Supabase 客户端**：通过 `lib/` 目录封装，区分服务端（service_role）和客户端（anon_key）
4. **Tailwind CSS**：样式使用 Tailwind CSS v4（PostCSS 插件模式）
5. **数据导入**：历史数据通过 `scripts/` 下的脚本导入 Supabase，不在应用内爬取
6. **部署**：通过 `@opennextjs/cloudflare` 适配 Cloudflare Workers，配置见 `wrangler.jsonc`
7. **RLS 策略**：数据库启用行级安全策略，匿名用户只读，写入需 service_role

---

## Agent 工作流

本项目集成了 **OpenSpec** Agent 工作流，位于 `.agent/` 目录：

- **技能文件**：`.agent/skills/my-project/SKILL.md` — 代码库深度分析快速入口
- **工作流**：`.agents/workflows/` — 常用 Agent 工作流（如 `/analyze-github-trending`）
- **变更记录**：`openspec/` — OpenSpec 变更单（specs、delta、tasks）

如需了解项目代码细节，优先查阅 `.agent/skills/my-project/` 下的 `references/` 参考文档。
