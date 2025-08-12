// Supabase数据库类型定义

export interface Database {
  public: {
    Tables: {
      repositories: {
        Row: {
          id: string
          name: string
          url: string
          description: string | null
          zh_description: string | null
          language: string | null
          owner: string | null
          repo_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          description?: string | null
          zh_description?: string | null
          language?: string | null
          owner?: string | null
          repo_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          description?: string | null
          zh_description?: string | null
          language?: string | null
          owner?: string | null
          repo_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trending_data: {
        Row: {
          id: string
          repository_id: string
          date: string
          category: string
          period: string
          stars: number
          forks: number
          stars_today: number
          rank: number | null
          created_at: string
        }
        Insert: {
          id?: string
          repository_id: string
          date: string
          category: string
          period: string
          stars?: number
          forks?: number
          stars_today?: number
          rank?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          repository_id?: string
          date?: string
          category?: string
          period?: string
          stars?: number
          forks?: number
          stars_today?: number
          rank?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      latest_trending: {
        Row: {
          id: string
          name: string
          url: string
          description: string | null
          zh_description: string | null
          language: string | null
          owner: string | null
          repo_name: string | null
          date: string
          category: string
          period: string
          stars: number
          forks: number
          stars_today: number
          rank: number | null
        }
      }
    }
    Functions: {
      get_language_stats: {
        Args: {
          target_date?: string
        }
        Returns: {
          language: string
          total_repos: number
          total_stars: number
          avg_stars: number
        }[]
      }
      get_trending_repos: {
        Args: {
          target_date?: string
          target_category?: string
          target_period?: string
          limit_count?: number
        }
        Returns: {
          id: string
          name: string
          url: string
          description: string | null
          zh_description: string | null
          language: string | null
          owner: string | null
          repo_name: string | null
          stars: number
          forks: number
          stars_today: number
          rank: number | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 应用层类型定义
export interface Repository {
  id: string
  name: string
  url: string
  description?: string
  zh_description?: string
  language?: string
  owner?: string
  repo_name?: string
  created_at: string
  updated_at: string
}

export interface TrendingData {
  id: string
  repository_id: string
  date: string
  category: TrendingCategory
  period: TrendingPeriod
  stars: number
  forks: number
  stars_today: number
  rank?: number
  created_at: string
}

export interface TrendingRepo extends Repository {
  stars: number
  forks: number
  stars_today: number
  rank?: number
  date: string
  category: TrendingCategory
  period: TrendingPeriod
}

export type TrendingCategory = 'all' | 'python' | 'typescript' | 'javascript' | 'jupyter' | 'vue'
export type TrendingPeriod = 'daily' | 'weekly' | 'monthly'

export interface LanguageStats {
  language: string
  total_repos: number
  total_stars: number
  avg_stars: number
}

// 原始数据格式（从JSONL文件解析）
export interface RawTrendingData {
  [date: string]: {
    zh_des: string
    url: string
    name: string
    description: string
    stars: string
    forks: string
    language: string
    stars_today: string
  }[]
}

// API响应类型
export interface TrendingResponse {
  data: TrendingRepo[]
  total: number
  page: number
  pageSize: number
}

export interface LanguageStatsResponse {
  data: LanguageStats[]
  date: string
}