-- 用户和仓库管理数据库表创建脚本
-- 用于抓取和管理GitHub用户/组织的所有仓库信息

-- 创建users表，存储GitHub用户/组织信息
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL, -- GitHub用户ID
    login VARCHAR(255) UNIQUE NOT NULL, -- GitHub用户名
    name VARCHAR(255), -- 显示名称
    avatar_url TEXT, -- 头像URL
    html_url TEXT NOT NULL, -- GitHub主页URL
    type VARCHAR(20) NOT NULL CHECK (type IN ('User', 'Organization')), -- 用户类型
    bio TEXT, -- 个人简介
    location VARCHAR(255), -- 地址
    email VARCHAR(255), -- 邮箱
    company VARCHAR(255), -- 公司
    blog VARCHAR(500), -- 博客地址
    public_repos INTEGER DEFAULT 0, -- 公开仓库数量
    public_gists INTEGER DEFAULT 0, -- 公开Gist数量
    followers INTEGER DEFAULT 0, -- 关注者数量
    following INTEGER DEFAULT 0, -- 关注数量
    twitter_username VARCHAR(255), -- Twitter用户名
    hireable BOOLEAN, -- 是否可雇佣
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, -- GitHub账号创建时间
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL, -- GitHub账号更新时间
    last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 最后抓取时间
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- 添加到数据库时间
);

-- 创建user_repositories表，存储用户的所有仓库信息
CREATE TABLE IF NOT EXISTS user_repositories (
    id SERIAL PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL, -- GitHub仓库ID
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- 关联用户ID
    name VARCHAR(255) NOT NULL, -- 仓库名
    full_name VARCHAR(255) NOT NULL, -- 完整名称 owner/repo
    html_url TEXT NOT NULL, -- 仓库URL
    description TEXT, -- 仓库描述
    zh_description TEXT, -- 中文描述(可选)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 仓库创建时间
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 仓库更新时间
    pushed_at TIMESTAMP WITH TIME ZONE, -- 最后推送时间
    size INTEGER DEFAULT 0, -- 仓库大小(KB)
    stargazers_count INTEGER DEFAULT 0, -- star数量
    language VARCHAR(100), -- 主要编程语言
    topics TEXT[] DEFAULT '{}', -- 标签数组
    owner VARCHAR(255) NOT NULL, -- 仓库所有者
    readme_content TEXT, -- README内容
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- 添加到数据库时间
);

-- 创建索引以提高查询性能
-- users表索引
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_followers ON users(followers DESC);
CREATE INDEX IF NOT EXISTS idx_users_public_repos ON users(public_repos DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_scraped_at ON users(last_scraped_at);

-- user_repositories表索引
CREATE INDEX IF NOT EXISTS idx_user_repositories_github_id ON user_repositories(github_id);
CREATE INDEX IF NOT EXISTS idx_user_repositories_user_id ON user_repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_repositories_owner ON user_repositories(owner);
CREATE INDEX IF NOT EXISTS idx_user_repositories_language ON user_repositories(language);
CREATE INDEX IF NOT EXISTS idx_user_repositories_stargazers_count ON user_repositories(stargazers_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_repositories_created_at ON user_repositories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_repositories_updated_at ON user_repositories(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_repositories_pushed_at ON user_repositories(pushed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_repositories_topics ON user_repositories USING GIN(topics);

-- 组合索引
CREATE INDEX IF NOT EXISTS idx_user_repositories_owner_stars ON user_repositories(owner, stargazers_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_repositories_owner_language ON user_repositories(owner, language);
CREATE INDEX IF NOT EXISTS idx_user_repositories_language_stars ON user_repositories(language, stargazers_count DESC);

-- 创建获取用户仓库列表的函数
CREATE OR REPLACE FUNCTION get_user_repositories(
    target_user_login TEXT,
    target_language TEXT DEFAULT NULL,
    min_stars INTEGER DEFAULT 0,
    sort_by TEXT DEFAULT 'stars', -- stars, updated, created, name
    sort_order TEXT DEFAULT 'desc', -- desc, asc
    limit_count INTEGER DEFAULT 50,
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
    readme_content TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    order_clause TEXT;
BEGIN
    -- 构建排序子句
    CASE sort_by
        WHEN 'stars' THEN order_clause := 'stargazers_count';
        WHEN 'updated' THEN order_clause := 'updated_at';
        WHEN 'created' THEN order_clause := 'created_at';
        WHEN 'pushed' THEN order_clause := 'pushed_at';
        WHEN 'name' THEN order_clause := 'name';
        ELSE order_clause := 'stargazers_count';
    END CASE;
    
    IF sort_order = 'asc' THEN
        order_clause := order_clause || ' ASC';
    ELSE
        order_clause := order_clause || ' DESC';
    END IF;
    
    RETURN QUERY EXECUTE format('
        SELECT 
            ur.id,
            ur.github_id,
            ur.name,
            ur.full_name,
            ur.html_url,
            ur.description,
            ur.zh_description,
            ur.created_at,
            ur.updated_at,
            ur.pushed_at,
            ur.size,
            ur.stargazers_count,
            ur.language,
            ur.topics,
            ur.owner,
            ur.readme_content
        FROM user_repositories ur
        WHERE 
            ur.owner = $1
            AND ($2 IS NULL OR ur.language = $2)
            AND ur.stargazers_count >= $3
        ORDER BY %s
        LIMIT $4
        OFFSET $5
    ', order_clause)
    USING target_user_login, target_language, min_stars, limit_count, offset_count;
END;
$$;

-- 创建获取用户统计信息的函数
CREATE OR REPLACE FUNCTION get_user_stats(target_user_login TEXT DEFAULT NULL)
RETURNS TABLE (
    user_login VARCHAR,
    user_name VARCHAR,
    user_type VARCHAR,
    followers INTEGER,
    following INTEGER,
    public_repos INTEGER,
    total_repos_in_db BIGINT,
    total_stars BIGINT,
    avg_stars NUMERIC,
    top_language VARCHAR,
    languages_count BIGINT,
    last_repo_update TIMESTAMP WITH TIME ZONE,
    account_created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF target_user_login IS NULL THEN
        -- 返回所有用户的统计信息
        RETURN QUERY
        WITH user_repo_stats AS (
            SELECT 
                ur.owner,
                COUNT(*) as total_repos_in_db,
                SUM(ur.stargazers_count) as total_stars,
                AVG(ur.stargazers_count) as avg_stars,
                MAX(ur.updated_at) as last_repo_update
            FROM user_repositories ur
            GROUP BY ur.owner
        ),
        user_language_stats AS (
            SELECT 
                ur.owner,
                ur.language,
                COUNT(*) as lang_count,
                ROW_NUMBER() OVER (PARTITION BY ur.owner ORDER BY COUNT(*) DESC) as rn
            FROM user_repositories ur
            WHERE ur.language IS NOT NULL AND ur.language != ''
            GROUP BY ur.owner, ur.language
        ),
        user_top_language AS (
            SELECT owner, language as top_language
            FROM user_language_stats
            WHERE rn = 1
        ),
        user_languages_count AS (
            SELECT 
                owner,
                COUNT(DISTINCT language) as languages_count
            FROM user_repositories
            WHERE language IS NOT NULL AND language != ''
            GROUP BY owner
        )
        SELECT 
            u.login as user_login,
            u.name as user_name,
            u.type as user_type,
            u.followers,
            u.following,
            u.public_repos,
            COALESCE(urs.total_repos_in_db, 0) as total_repos_in_db,
            COALESCE(urs.total_stars, 0) as total_stars,
            ROUND(COALESCE(urs.avg_stars, 0), 2) as avg_stars,
            utl.top_language,
            COALESCE(ulc.languages_count, 0) as languages_count,
            urs.last_repo_update,
            u.created_at as account_created_at
        FROM users u
        LEFT JOIN user_repo_stats urs ON u.login = urs.owner
        LEFT JOIN user_top_language utl ON u.login = utl.owner
        LEFT JOIN user_languages_count ulc ON u.login = ulc.owner
        ORDER BY COALESCE(urs.total_stars, 0) DESC;
    ELSE
        -- 返回指定用户的统计信息
        RETURN QUERY
        WITH user_repo_stats AS (
            SELECT 
                COUNT(*) as total_repos_in_db,
                SUM(ur.stargazers_count) as total_stars,
                AVG(ur.stargazers_count) as avg_stars,
                MAX(ur.updated_at) as last_repo_update
            FROM user_repositories ur
            WHERE ur.owner = target_user_login
        ),
        user_language_stats AS (
            SELECT 
                ur.language,
                COUNT(*) as lang_count,
                ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rn
            FROM user_repositories ur
            WHERE ur.owner = target_user_login 
                AND ur.language IS NOT NULL AND ur.language != ''
            GROUP BY ur.language
        ),
        user_top_language AS (
            SELECT language as top_language
            FROM user_language_stats
            WHERE rn = 1
        ),
        user_languages_count AS (
            SELECT COUNT(DISTINCT language) as languages_count
            FROM user_repositories
            WHERE owner = target_user_login 
                AND language IS NOT NULL AND language != ''
        )
        SELECT 
            u.login as user_login,
            u.name as user_name,
            u.type as user_type,
            u.followers,
            u.following,
            u.public_repos,
            COALESCE(urs.total_repos_in_db, 0) as total_repos_in_db,
            COALESCE(urs.total_stars, 0) as total_stars,
            ROUND(COALESCE(urs.avg_stars, 0), 2) as avg_stars,
            utl.top_language,
            COALESCE(ulc.languages_count, 0) as languages_count,
            urs.last_repo_update,
            u.created_at as account_created_at
        FROM users u
        LEFT JOIN user_repo_stats urs ON TRUE
        LEFT JOIN user_top_language utl ON TRUE
        LEFT JOIN user_languages_count ulc ON TRUE
        WHERE u.login = target_user_login;
    END IF;
END;
$$;

-- 创建获取编程语言统计的函数
CREATE OR REPLACE FUNCTION get_language_stats_by_user(target_user_login TEXT DEFAULT NULL)
RETURNS TABLE (
    language VARCHAR,
    repo_count BIGINT,
    total_stars BIGINT,
    avg_stars NUMERIC,
    users_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF target_user_login IS NULL THEN
        -- 返回所有用户的语言统计
        RETURN QUERY
        SELECT 
            ur.language,
            COUNT(*) as repo_count,
            SUM(ur.stargazers_count) as total_stars,
            ROUND(AVG(ur.stargazers_count), 2) as avg_stars,
            COUNT(DISTINCT ur.owner) as users_count
        FROM user_repositories ur
        WHERE ur.language IS NOT NULL AND ur.language != ''
        GROUP BY ur.language
        ORDER BY repo_count DESC;
    ELSE
        -- 返回指定用户的语言统计
        RETURN QUERY
        SELECT 
            ur.language,
            COUNT(*) as repo_count,
            SUM(ur.stargazers_count) as total_stars,
            ROUND(AVG(ur.stargazers_count), 2) as avg_stars,
            1::BIGINT as users_count -- 固定为1，因为是单个用户
        FROM user_repositories ur
        WHERE ur.owner = target_user_login 
            AND ur.language IS NOT NULL AND ur.language != ''
        GROUP BY ur.language
        ORDER BY repo_count DESC;
    END IF;
END;
$$;

-- 创建更新触发器函数
CREATE OR REPLACE FUNCTION update_user_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建users表更新触发器
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_user_updated_at_column();
    END IF;
END;
$$;

-- 创建user_repositories表更新触发器
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_repositories_updated_at'
    ) THEN
        CREATE TRIGGER update_user_repositories_updated_at
            BEFORE UPDATE ON user_repositories
            FOR EACH ROW
            EXECUTE FUNCTION update_user_updated_at_column();
    END IF;
END;
$$;

-- 注释说明
COMMENT ON TABLE users IS '存储GitHub用户和组织的基本信息';
COMMENT ON TABLE user_repositories IS '存储用户/组织的所有仓库信息';
COMMENT ON FUNCTION get_user_repositories IS '获取指定用户的仓库列表，支持多种筛选和排序选项';
COMMENT ON FUNCTION get_user_stats IS '获取用户统计信息，包括仓库数量、star数等';
COMMENT ON FUNCTION get_language_stats_by_user IS '获取编程语言统计信息，可按用户筛选';