-- 最简化的Topic表创建脚本
-- 在Supabase SQL Editor中执行

-- 创建topic_repositories表
CREATE TABLE IF NOT EXISTS topic_repositories (
    id SERIAL PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    html_url TEXT NOT NULL,
    description TEXT,
    zh_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    pushed_at TIMESTAMP WITH TIME ZONE,
    size INTEGER DEFAULT 0,
    stargazers_count INTEGER DEFAULT 0,
    language VARCHAR(100),
    topics TEXT[] DEFAULT '{}',
    owner VARCHAR(255) NOT NULL,
    readme_content TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建基础索引
CREATE INDEX IF NOT EXISTS idx_topic_repositories_github_id ON topic_repositories(github_id);
CREATE INDEX IF NOT EXISTS idx_topic_repositories_topics ON topic_repositories USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_topic_repositories_stargazers_count ON topic_repositories(stargazers_count DESC);