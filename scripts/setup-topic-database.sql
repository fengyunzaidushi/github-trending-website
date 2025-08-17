-- Topic功能数据库表创建脚本

-- 创建topic_repositories表，用于存储从JSON数据导入的仓库信息
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

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_topic_repositories_github_id ON topic_repositories(github_id);
CREATE INDEX IF NOT EXISTS idx_topic_repositories_language ON topic_repositories(language);
CREATE INDEX IF NOT EXISTS idx_topic_repositories_stargazers_count ON topic_repositories(stargazers_count DESC);
CREATE INDEX IF NOT EXISTS idx_topic_repositories_created_at ON topic_repositories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topic_repositories_topics ON topic_repositories USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_topic_repositories_owner ON topic_repositories(owner);

-- 创建topics表（可选，用于规范化topic管理）
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建repository_topics关联表（可选，用于规范化关系）
CREATE TABLE IF NOT EXISTS repository_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id BIGINT REFERENCES topic_repositories(github_id),
    topic_id UUID REFERENCES topics(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(repository_id, topic_id)
);

-- 创建获取topic仓库的函数
CREATE OR REPLACE FUNCTION get_topic_repositories(
    topic_name TEXT DEFAULT NULL,
    target_language TEXT DEFAULT NULL,
    target_date DATE DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    github_id BIGINT,
    name VARCHAR,
    full_name VARCHAR,
    html_url TEXT,
    description TEXT,
    zh_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    pushed_at TIMESTAMP WITH TIME ZONE,
    size INTEGER,
    stargazers_count INTEGER,
    language VARCHAR,
    topics TEXT[],
    owner VARCHAR,
    readme_content TEXT,
    added_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.id,
        tr.github_id,
        tr.name,
        tr.full_name,
        tr.html_url,
        tr.description,
        tr.zh_description,
        tr.created_at,
        tr.updated_at,
        tr.pushed_at,
        tr.size,
        tr.stargazers_count,
        tr.language,
        tr.topics,
        tr.owner,
        tr.readme_content,
        tr.added_at
    FROM topic_repositories tr
    WHERE 
        (topic_name IS NULL OR topic_name = ANY(tr.topics))
        AND (target_language IS NULL OR target_language = 'all' OR tr.language = target_language)
        AND (target_date IS NULL OR target_date::text = 'all' OR DATE(tr.created_at) = target_date)
    ORDER BY tr.stargazers_count DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- 创建获取topic统计信息的函数
CREATE OR REPLACE FUNCTION get_topic_stats()
RETURNS TABLE (
    topic_name TEXT,
    repo_count BIGINT,
    total_stars BIGINT,
    avg_stars NUMERIC,
    languages TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH topic_expanded AS (
        SELECT 
            unnest(topics) as topic,
            stargazers_count,
            language
        FROM topic_repositories
        WHERE topics IS NOT NULL AND array_length(topics, 1) > 0
    ),
    topic_aggregated AS (
        SELECT 
            topic,
            COUNT(*) as repo_count,
            SUM(stargazers_count) as total_stars,
            AVG(stargazers_count) as avg_stars,
            array_agg(DISTINCT language) FILTER (WHERE language IS NOT NULL) as languages
        FROM topic_expanded
        GROUP BY topic
    )
    SELECT 
        ta.topic as topic_name,
        ta.repo_count,
        ta.total_stars,
        ROUND(ta.avg_stars, 2) as avg_stars,
        ta.languages
    FROM topic_aggregated ta
    ORDER BY ta.repo_count DESC;
END;
$$;

-- 创建更新topic_repositories表的updated_at触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 如果触发器不存在则创建
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_topic_repositories_updated_at'
    ) THEN
        CREATE TRIGGER update_topic_repositories_updated_at
            BEFORE UPDATE ON topic_repositories
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;

-- 创建topics表的更新触发器
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_topics_updated_at'
    ) THEN
        CREATE TRIGGER update_topics_updated_at
            BEFORE UPDATE ON topics
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;