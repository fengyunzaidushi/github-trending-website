# API Reference: import-data.ts

**Language**: TypeScript

**Source**: `scripts\import-data.ts`

---

## Functions

### parseStarsNumber(starsStr: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| starsStr | string | - | - |

**Returns**: (none)



### parseStarsToday(starsTodayStr: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| starsTodayStr | string | - | - |

**Returns**: (none)



### parseRepoName(fullName: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| fullName | string | - | - |

**Returns**: (none)



### parseChineseDate(dateStr: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| dateStr | string | - | - |

**Returns**: (none)



### readJsonlFile(filePath: string)

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| filePath | string | - | - |

**Returns**: (none)



### upsertRepository(repoData: {
  name: string
  url: string
  description: string
  zh_description: string
  language: string
  owner: string
  repo_name: string
})

**Async function**

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| repoData | {
  name: string
  url: string
  description: string
  zh_description: string
  language: string
  owner: string
  repo_name: string
} | - | - |

**Returns**: (none)



### insertTrendingData(trendingData: {
  repository_id: string
  date: string
  category: TrendingCategory
  period: TrendingPeriod
  stars: number
  forks: number
  stars_today: number
  rank: number
})

**Async function**

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| trendingData | {
  repository_id: string
  date: string
  category: TrendingCategory
  period: TrendingPeriod
  stars: number
  forks: number
  stars_today: number
  rank: number
} | - | - |

**Returns**: (none)



### processFile(filePath: string, category: TrendingCategory, period: TrendingPeriod)

**Async function**

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| filePath | string | - | - |
| category | TrendingCategory | - | - |
| period | TrendingPeriod | - | - |

**Returns**: (none)



### main()

**Async function**

**Returns**: (none)


