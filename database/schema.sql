-- GitHub Trending 数据库表结构

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 仓库表
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) UNIQUE NOT NULL,
    description TEXT,
    zh_description TEXT,
    language VARCHAR(100),
    owner VARCHAR(255),
    repo_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 趋势数据表
CREATE TABLE trending_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'all', 'python', 'typescript', 'javascript', 'jupyter', 'vue'
    period VARCHAR(20) NOT NULL,   -- 'daily', 'weekly', 'monthly'
    stars INTEGER DEFAULT 0,
    forks INTEGER DEFAULT 0,
    stars_today INTEGER DEFAULT 0,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(repository_id, date, category, period)
);

-- 创建索引
CREATE INDEX idx_repositories_name ON repositories(name);
CREATE INDEX idx_repositories_language ON repositories(language);
CREATE INDEX idx_repositories_url ON repositories(url);

CREATE INDEX idx_trending_data_date ON trending_data(date);
CREATE INDEX idx_trending_data_category ON trending_data(category);
CREATE INDEX idx_trending_data_period ON trending_data(period);
CREATE INDEX idx_trending_data_stars ON trending_data(stars DESC);
CREATE INDEX idx_trending_data_composite ON trending_data(date, category, period);

-- 创建RLS (Row Level Security) 策略
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_data ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户读取数据
CREATE POLICY "Allow public read access on repositories" ON repositories
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on trending_data" ON trending_data
    FOR SELECT USING (true);

-- 允许服务角色进行所有操作
CREATE POLICY "Allow service role all access on repositories" ON repositories
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role all access on trending_data" ON trending_data
    FOR ALL USING (auth.role() = 'service_role');

-- 创建视图：获取最新趋势数据
CREATE OR REPLACE VIEW latest_trending AS
SELECT 
    r.id,
    r.name,
    r.url,
    r.description,
    r.zh_description,
    r.language,
    r.owner,
    r.repo_name,
    td.date,
    td.category,
    td.period,
    td.stars,
    td.forks,
    td.stars_today,
    td.rank
FROM repositories r
JOIN trending_data td ON r.id = td.repository_id
WHERE td.date = CURRENT_DATE
ORDER BY td.category, td.period, td.rank;

-- 创建函数：获取热门语言统计
CREATE OR REPLACE FUNCTION get_language_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    language VARCHAR(100),
    total_repos BIGINT,
    total_stars BIGINT,
    avg_stars NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.language,
        COUNT(DISTINCT r.id) as total_repos,
        SUM(td.stars) as total_stars,
        AVG(td.stars) as avg_stars
    FROM repositories r
    JOIN trending_data td ON r.id = td.repository_id
    WHERE td.date = target_date 
        AND td.period = 'daily'
        AND r.language IS NOT NULL
        AND r.language != ''
    GROUP BY r.language
    ORDER BY total_stars DESC;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：获取趋势数据
CREATE OR REPLACE FUNCTION get_trending_repos(
    target_date DATE DEFAULT CURRENT_DATE,
    target_category VARCHAR(50) DEFAULT 'all',
    target_period VARCHAR(20) DEFAULT 'daily',
    limit_count INTEGER DEFAULT 25
)
RETURNS TABLE(
    id UUID,
    name VARCHAR(255),
    url VARCHAR(500),
    description TEXT,
    zh_description TEXT,
    language VARCHAR(100),
    owner VARCHAR(255),
    repo_name VARCHAR(255),
    stars INTEGER,
    forks INTEGER,
    stars_today INTEGER,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.url,
        r.description,
        r.zh_description,
        r.language,
        r.owner,
        r.repo_name,
        td.stars,
        td.forks,
        td.stars_today,
        td.rank
    FROM repositories r
    JOIN trending_data td ON r.id = td.repository_id
    WHERE td.date = target_date 
        AND td.category = target_category
        AND td.period = target_period
    ORDER BY td.rank
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;