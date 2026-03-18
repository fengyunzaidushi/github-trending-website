---
name: github-trending-website
description: Next.js 15 GitHub Trending platform with Supabase backend - codebase analysis and API reference
doc_version: 1.0
---

# GitHub Trending Website - Codebase Reference

## Description

A comprehensive Next.js 15 + React 19 application that displays GitHub trending repositories with Chinese localization. This skill provides deep codebase analysis, API documentation, and real-world implementation patterns extracted from 42 TypeScript files.

**Project Path:** `D:\github\2015\08\github-trending-website`
**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL)
**Deployment:** Cloudflare Pages + Workers (OpenNext.js)
**Files Analyzed:** 42 TypeScript files
**Analysis Depth:** Deep (C2.5-C3.9)

---

## When to Use This Skill

Use this skill when you need to:

### Architecture & Design
- Understand Next.js 15 App Router architecture patterns
- Learn 2-tier layered architecture implementation
- Explore Supabase integration patterns with PostgreSQL
- Review Cloudflare Workers deployment strategies

### API Development
- Build trending data APIs with filtering (date, category, period)
- Implement search functionality with Supabase
- Create language statistics endpoints
- Handle database connections in API routes

### Component Patterns
- Build repository card components with ranking
- Implement language tabs with statistics
- Create date pickers and period selectors
- Design responsive layouts with Tailwind CSS 4

### Data Processing
- Import JSONL data into Supabase
- Parse and normalize GitHub trending data
- Handle Chinese date formats
- Manage database migrations and setup

### Real-World Examples
- See actual TypeScript implementations from production code
- Review configuration patterns (27 config files analyzed)
- Explore test examples and usage patterns
- Navigate complex Next.js project structures

---

## ⚡ Quick Reference - Code Examples

### 1. Supabase Client Setup
*From codebase analysis - real implementation*

```typescript
// Client-side Supabase instance
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side admin instance (API routes)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### 2. Trending API Route Pattern
*From `api/trending/route.ts` - production code*

```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date')
  const category = searchParams.get('category') || 'all'
  const period = searchParams.get('period') || 'daily'

  const { data, error } = await supabaseAdmin
    .rpc('get_trending_repos', {
      p_date: date,
      p_category: category,
      p_period: period
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

### 3. Repository Card Component
*From `components/RepoCard.tsx` - real component*

```typescript
interface RepoCardProps {
  repo: TrendingRepo
  showRank?: boolean
}

export function RepoCard({ repo, showRank = true }: RepoCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      {showRank && <span className="text-2xl font-bold">#{repo.rank}</span>}
      <h3 className="text-xl font-semibold">{repo.name}</h3>
      <p className="text-gray-600">{repo.description_cn || repo.description}</p>
      <div className="flex gap-4 mt-2">
        <span>⭐ {formatNumber(repo.stars)}</span>
        <span>🔥 {repo.stars_today} today</span>
      </div>
    </div>
  )
}
```

### 4. Data Import Script Pattern
*From `scripts/import-data.ts` - production script*

```typescript
// Parse stars with k/K suffix
function parseStarsNumber(starsStr: string): number {
  if (starsStr.toLowerCase().includes('k')) {
    return Math.round(parseFloat(starsStr) * 1000)
  }
  return parseInt(starsStr.replace(/,/g, ''))
}

// Upsert repository data
async function upsertRepository(repoData: {
  name: string
  url: string
  description: string
}) {
  const { data, error } = await supabaseAdmin
    .from('repositories')
    .upsert(repoData, { onConflict: 'url' })
    .select()
    .single()

  return data
}
```

### 5. Language Tabs with Statistics
*From `components/LanguageTabs.tsx` - real component*

```typescript
interface LanguageTabsProps {
  currentCategory: string
  onCategoryChange: (category: string) => void
  languageStats: LanguageStats[]
}

export function LanguageTabs({
  currentCategory,
  onCategoryChange,
  languageStats = []
}: LanguageTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {languageStats.map(stat => (
        <button
          key={stat.language}
          onClick={() => onCategoryChange(stat.language)}
          className={`px-4 py-2 rounded ${
            currentCategory === stat.language
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          {stat.language} ({stat.count})
        </button>
      ))}
    </div>
  )
}
```

### 6. Database Function Call
*From API routes - production pattern*

```typescript
// Using Supabase RPC for complex queries
const { data: repos } = await supabaseAdmin.rpc('get_trending_repos', {
  p_date: '2024-01-15',
  p_category: 'python',
  p_period: 'daily',
  p_limit: 25,
  p_offset: 0
})

// Get language statistics
const { data: stats } = await supabaseAdmin.rpc('get_language_stats', {
  p_date: '2024-01-15',
  p_period: 'weekly'
})
```

### 7. Search Component Pattern
*From `components/SearchComponent.tsx` - real implementation*

```typescript
interface SearchComponentProps {
  onSearch: (params: SearchParams) => void
  isLoading: boolean
  currentCategory: string
  currentPeriod: string
}

export function SearchComponent({
  onSearch,
  isLoading,
  currentCategory,
  currentPeriod
}: SearchComponentProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch({
      query,
      category: currentCategory,
      period: currentPeriod
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索仓库..."
        className="flex-1 px-4 py-2 border rounded"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-2 bg-blue-500 text-white rounded"
      >
        {isLoading ? '搜索中...' : '搜索'}
      </button>
    </form>
  )
}
```

### 8. TypeScript Database Types
*From `types/database.ts` - production types*

```typescript
// Supabase database types
export interface Database {
  public: {
    Tables: {
      repositories: {
        Row: {
          id: number
          name: string
          url: string
          description: string
          description_cn: string | null
          language: string | null
          stars: number
          forks: number
          created_at: string
        }
      }
      trending_data: {
        Row: {
          id: number
          repository_id: number
          date: string
          category: string
          period: 'daily' | 'weekly' | 'monthly'
          rank: number
          stars_today: number
        }
      }
    }
  }
}

// Application types
export interface TrendingRepo {
  id: number
  name: string
  url: string
  description: string
  description_cn?: string
  language: string
  stars: number
  forks: number
  stars_today: number
  rank: number
}
```

### 9. Environment Configuration
*From `.env.example` - required setup*

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 10. Cloudflare Workers Configuration
*From `wrangler.jsonc` - deployment config*

```json
{
  "name": "github-trending",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": ".open-next/worker",
  "vars": {
    "NEXT_PUBLIC_SUPABASE_URL": "",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": ""
  }
}
```

---

## 🏗️ Architecture Deep Dive

### Detected Pattern: Layered Architecture (2-tier)
**Confidence:** 0.85 (High)

```
┌─────────────────────────────────────┐
│   Presentation Layer (Client)       │
│   - React 19 Components             │
│   - Tailwind CSS 4 Styling          │
│   - Client-side State Management    │
└──────────────┬──────────────────────┘
               │
               │ API Routes
               ▼
┌─────────────────────────────────────┐
│   Data Layer (Server)               │
│   - Next.js API Routes              │
│   - Supabase Client (Admin)         │
│   - PostgreSQL Database             │
│   - RPC Functions                   │
└─────────────────────────────────────┘
```

### Key Architectural Decisions

1. **App Router Pattern**: Uses Next.js 15 App Router for server-side rendering
2. **Database Functions**: Complex queries handled by PostgreSQL RPC functions
3. **Dual Supabase Clients**: Separate clients for frontend (anon) and backend (admin)
4. **Edge Deployment**: Optimized for Cloudflare Workers with OpenNext.js

*See `references/architecture/` for complete analysis*

---

## 📁 Project Structure

```
github-trending-website/
├── app/                      # Next.js 15 App Router
│   ├── api/                  # API routes
│   │   ├── trending/         # Trending data endpoint
│   │   ├── languages/        # Language stats endpoint
│   │   ├── search/           # Search endpoint
│   │   └── date-stats/       # Date statistics
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── home-client.tsx       # Client component
├── components/               # React components
│   ├── RepoCard.tsx          # Repository card
│   ├── LanguageTabs.tsx      # Language selector
│   ├── PeriodSelector.tsx    # Time period selector
│   ├── DatePicker.tsx        # Date picker
│   ├── SearchComponent.tsx   # Search UI
│   └── Pagination.tsx        # Pagination controls
├── types/                    # TypeScript types
│   └── database.ts           # Database & app types
├── scripts/                  # Data processing
│   ├── import-data.ts        # JSONL importer
│   ├── setup-database.ts     # DB initialization
│   └── analyze-trending-data.mjs
├── lib/                      # Utilities
│   └── supabase.ts           # Supabase clients
└── public/                   # Static assets
```

---

## 🔌 API Endpoints Reference

### GET /api/trending
Fetch trending repositories with filters

**Query Parameters:**
- `date` (string): Date in YYYY-MM-DD format
- `category` (string): Language category (default: 'all')
- `period` (string): 'daily' | 'weekly' | 'monthly' (default: 'daily')
- `limit` (number): Results per page (default: 25)
- `offset` (number): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": 1,
    "name": "owner/repo",
    "url": "https://github.com/owner/repo",
    "description": "English description",
    "description_cn": "中文描述",
    "language": "TypeScript",
    "stars": 12500,
    "forks": 1200,
    "stars_today": 150,
    "rank": 1
  }
]
```

### GET /api/languages
Get language statistics for a specific date/period

**Query Parameters:**
- `date` (string): Date in YYYY-MM-DD format
- `period` (string): 'daily' | 'weekly' | 'monthly'

**Response:**
```json
[
  {
    "language": "TypeScript",
    "count": 45,
    "total_stars": 125000
  }
]
```

### GET /api/search
Search repositories by keyword

**Query Parameters:**
- `q` (string): Search query
- `category` (string): Filter by language
- `period` (string): Time period filter

**Response:** Same as `/api/trending`

*See `references/api_reference/` for complete API documentation*

---

## ⚙️ Configuration Patterns

### Analyzed Configuration Files: 27
**Total Settings:** 10,071
**Confidence:** Medium

### Key Configuration Files

1. **next.config.js** - Next.js framework configuration
2. **open-next.config.ts** - Cloudflare Workers adapter
3. **wrangler.jsonc** - Cloudflare deployment settings
4. **tsconfig.json** - TypeScript compiler options
5. **.env.local** - Environment variables (45 settings)
6. **tailwind.config.ts** - Tailwind CSS 4 configuration
7. **package.json** - Dependencies and scripts

### Environment Variables Required

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

*See `references/config_patterns/` for detailed analysis*

---

## 🗄️ Database Schema

### Tables

#### repositories
Stores GitHub repository metadata

```sql
CREATE TABLE repositories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  description_cn TEXT,
  language VARCHAR(100),
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### trending_data
Stores trending rankings by date/category/period

```sql
CREATE TABLE trending_data (
  id SERIAL PRIMARY KEY,
  repository_id INTEGER REFERENCES repositories(id),
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  period VARCHAR(20) NOT NULL,
  rank INTEGER NOT NULL,
  stars_today INTEGER DEFAULT 0,
  UNIQUE(repository_id, date, category, period)
);
```

### Database Functions

#### get_trending_repos(p_date, p_category, p_period, p_limit, p_offset)
Returns trending repositories with full metadata

#### get_language_stats(p_date, p_period)
Returns language statistics with counts and total stars

*See `scripts/setup-database.ts` for complete schema*

---

## 🛠️ Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Cloudflare deployment
npm run deploy

# Cloudflare preview
npm run preview

# Database setup
npm run db:setup

# Import trending data
npm run import-data

# Code linting
npm run lint
```

---

## 📚 Working with This Skill

### For Beginners

1. **Start with API routes**: Review `api/trending/route.ts` for basic patterns
2. **Explore components**: Check `components/RepoCard.tsx` for React patterns
3. **Understand types**: Read `types/database.ts` for TypeScript definitions
4. **Review configuration**: See `.env.example` for required setup

### For Intermediate Users

1. **Database integration**: Study Supabase client setup and RPC functions
2. **Data processing**: Explore `scripts/import-data.ts` for ETL patterns
3. **Component composition**: Review how components interact in `app/home-client.tsx`
4. **API design**: Understand filtering and pagination patterns

### For Advanced Users

1. **Architecture patterns**: Analyze the 2-tier layered architecture
2. **Deployment strategy**: Study OpenNext.js + Cloudflare Workers setup
3. **Performance optimization**: Review database function implementations
4. **Type safety**: Explore TypeScript patterns across the codebase

### Navigation Tips

- **API docs**: `references/api_reference/` - 22 documented files
- **Dependencies**: `references/dependencies/` - Dependency graph
- **Patterns**: `references/patterns/` - Design pattern analysis
- **Architecture**: `references/architecture/` - Architectural decisions
- **Documentation**: `references/documentation/` - 30 markdown files

---

## 🔑 Key Concepts

### 1. Dual Supabase Clients
- **Frontend client**: Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side queries
- **Backend client**: Uses `SUPABASE_SERVICE_ROLE_KEY` for admin operations in API routes

### 2. RPC Functions
PostgreSQL stored procedures called via Supabase for complex queries:
- Reduces network round-trips
- Improves query performance
- Centralizes business logic

### 3. Chinese Localization
- All UI text in Chinese
- Dual description fields (English + Chinese)
- Chinese date format parsing

### 4. Cloudflare Workers Deployment
- Uses OpenNext.js adapter for Next.js 15 compatibility
- Edge deployment for global performance
- Environment variables via Wrangler

### 5. Trending Data Model
Three dimensions:
- **Date**: Daily snapshots
- **Category**: Language-based filtering (all, python, typescript, etc.)
- **Period**: Daily, weekly, monthly aggregations

---

## 📖 Reference Documentation

### API Reference (22 files)
Complete TypeScript API documentation extracted from code:
- Component interfaces and props
- Function signatures and parameters
- Type definitions and enums
- Return types and error handling

**Location:** `references/api_reference/`

### Dependencies Analysis
Dependency graph showing:
- Package relationships
- Version constraints
- Import patterns

**Location:** `references/dependencies/`

### Design Patterns
Detected patterns from codebase analysis:
- Component composition patterns
- Data fetching strategies
- Error handling approaches

**Location:** `references/patterns/`

### Configuration Patterns
Analysis of 27 configuration files:
- Environment variables
- Build configurations
- Deployment settings

**Location:** `references/config_patterns/`

### Architectural Analysis
Deep dive into architecture:
- Layered architecture (2-tier)
- Component hierarchy
- Data flow patterns

**Location:** `references/architecture/`

### Project Documentation (30 files)
Extracted markdown documentation:
- README and setup guides
- API status reports
- Feature documentation
- Database analysis reports

**Location:** `references/documentation/`

---

## 🎯 Common Use Cases

### 1. Building a Similar Trending Platform
- Copy API route patterns from `api/trending/route.ts`
- Adapt database schema from `scripts/setup-database.ts`
- Reuse component patterns from `components/`

### 2. Integrating Supabase with Next.js 15
- Follow client setup in `lib/supabase.ts`
- Use RPC function patterns for complex queries
- Implement dual-client strategy for security

### 3. Deploying to Cloudflare Workers
- Use `open-next.config.ts` as template
- Configure `wrangler.jsonc` for your project
- Follow build commands in `package.json`

### 4. Processing External Data
- Adapt JSONL import script from `scripts/import-data.ts`
- Use parsing functions for data normalization
- Implement upsert patterns for idempotency

### 5. Building Multilingual Apps
- Follow dual-description pattern (English + Chinese)
- Implement language-aware components
- Use locale-specific formatting

---

## 🔍 Source Analysis

This skill synthesizes knowledge from **codebase analysis** (single source type):

### Codebase Analysis (42 TypeScript files)
**Confidence:** Medium to High
**Source Type:** Real production code

**Key Files Analyzed:**
- API routes: `api/trending/route.ts`, `api/languages/route.ts`, `api/search/route.ts`
- Components: `RepoCard.tsx`, `LanguageTabs.tsx`, `SearchComponent.tsx`
- Scripts: `import-data.ts`, `setup-database.ts`
- Types: `database.ts`, `cloudflare-env.d.ts`
- Configuration: 27 config files (10,071 settings)

**Analysis Depth:**
- ✅ API Reference (C2.5) - Complete function signatures
- ✅ Dependency Graph (C2.6) - Package relationships
- ✅ Design Patterns (C3.1) - Pattern detection
- ✅ Test Examples (C3.2) - Usage examples
- ✅ Configuration Patterns (C3.4) - Config analysis
- ✅ Architectural Analysis (C3.7) - Architecture patterns
- ✅ Project Documentation (C3.9) - Markdown extraction

---

## 📝 Notes

### Strengths
- Complete TypeScript type safety
- Production-ready code examples
- Real-world implementation patterns
- Comprehensive API documentation
- Multi-dimensional data model

### Considerations
- Configuration files marked as "unknown" type (27 files)
- No automated tests detected in analysis
- Documentation primarily in Chinese
- Requires Supabase account for deployment

### Best Practices Observed
- Dual Supabase client pattern for security
- RPC functions for complex queries
- Proper TypeScript typing throughout
- Responsive design with Tailwind CSS
- Edge-optimized deployment strategy

---

**Generated by Skill Seeker** | Codebase Analyzer with C3.x Analysis
**Last Updated:** 2026-03-12
**Analysis Version:** 1.0
