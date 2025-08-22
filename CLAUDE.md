# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Next.js 15+ App Router 的 GitHub Trending 数据展示平台，使用中文界面显示热门开源项目的实时趋势数据。

## 开发命令

```bash
# 开发服务器
npm run dev

# 构建项目
npm run build

# 生产模式启动
npm start

# 代码检查
npm run lint

# Cloudflare 部署
npm run deploy

# Cloudflare 预览部署
npm run preview

# 生成 Cloudflare 类型定义
npm run cf-typegen

# 数据库设置
npm run db:setup

# 导入趋势数据
npm run import-data
npm run import-data:mjs
```

## 核心架构

### 技术栈
- **前端**: Next.js 15 + React 19 + TypeScript + Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL) 
- **部署**: Cloudflare Pages + Workers (使用 OpenNext.js)
- **样式**: TailwindCSS with dark mode support

### 数据库架构
项目使用 Supabase PostgreSQL 数据库，包含两个核心表：

1. **repositories 表**: 存储仓库基础信息
   - 仓库名称、URL、描述、中文描述、编程语言等

2. **trending_data 表**: 存储趋势数据
   - 按日期、分类（all/python/typescript等）、周期（daily/weekly/monthly）分组
   - 包含 stars、forks、stars_today、排名等指标

3. **数据库函数**:
   - `get_trending_repos()`: 获取指定条件的趋势项目
   - `get_language_stats()`: 获取编程语言统计数据

### API 路由结构
- `/api/trending` - 获取趋势项目数据，支持按日期、分类、周期筛选
- `/api/languages` - 获取编程语言统计
- `/api/date-stats` - 获取日期统计信息
- `/api/search` - 搜索功能
- `/api/test` - 数据库连接测试
- `/api/db-info` - 数据库信息查询

### 组件架构
- `RepoCard` - 单个仓库展示卡片
- `LanguageTabs` - 编程语言分类标签页
- `PeriodSelector` - 时间周期选择器
- `DatePicker` - 日期选择器

### 类型系统
`types/database.ts` 定义了完整的 TypeScript 类型系统，包括：
- Supabase 数据库类型映射
- 应用层业务类型 (TrendingRepo, LanguageStats 等)
- API 响应类型

### 数据处理脚本
`scripts/` 目录包含数据处理工具：
- `import-data.ts/mjs` - 从 JSONL 文件导入趋势数据
- `setup-database.ts` - 数据库初始化
- `analyze-trending-data.mjs` - 数据分析工具
- `check-missing-dates.mjs` - 数据完整性检查

### 部署配置
- 使用 OpenNext.js 适配 Cloudflare Workers
- `wrangler.jsonc` 配置 Cloudflare Workers 部署
- `open-next.config.ts` 配置 OpenNext 构建选项

## 环境变量要求

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 开发注意事项

### 数据库连接
- 前端组件使用 `supabase` 客户端实例
- API 路由使用 `supabaseAdmin` 实例（具有服务角色权限）

### 国际化特性
- 界面完全中文化
- 支持中英文项目描述对照显示
- 错误提示和加载状态均为中文

### 响应式设计
- 使用 TailwindCSS 实现响应式布局
- 支持 dark mode 切换
- 移动端优化的卡片布局

### 性能优化
- 使用 Next.js App Router 的服务端渲染
- API 路由支持分页和条件查询
- 数据库查询优化（索引、视图、存储过程）

### Next.js 15 动态路由参数处理
在 Next.js 15 中，动态路由参数（如 `[login]`）现在是 Promise 类型，需要 await 后才能访问：

**页面组件** (`app/user/[login]/page.tsx`):
```typescript
export default function UserPage({ params }: { params: Promise<{ login: string }> }) {
  const fetchUser = useCallback(async () => {
    const { login } = await params  // 需要 await
    const response = await fetch(`/api/user/${login}`)
    // ...
  }, [params])
}
```

**API 路由** (`app/api/user/[login]/route.ts`):
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ login: string }> }
) {
  try {
    const { login } = await params  // 需要 await
    // ...
  } catch (error) {
    // ...
  }
}
```

**关键要点**:
- 参数类型从 `{ login: string }` 改为 `Promise<{ login: string }>`
- 访问参数前必须使用 `await params`
- 适用于所有动态路由参数（`[id]`, `[slug]`, `[...path]` 等）