-- GitHub Trending 按日期分组的统计查询定义

-- 1. 按日期统计每日趋势数据总量
CREATE OR REPLACE FUNCTION get_daily_trending_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    date DATE,
    total_repos BIGINT,
    total_stars BIGINT,
    total_forks BIGINT,
    total_stars_today BIGINT,
    avg_stars NUMERIC,
    avg_forks NUMERIC,
    avg_stars_today NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        td.date,
        COUNT(DISTINCT td.repository_id) as total_repos,
        SUM(td.stars) as total_stars,
        SUM(td.forks) as total_forks,
        SUM(td.stars_today) as total_stars_today,
        AVG(td.stars) as avg_stars,
        AVG(td.forks) as avg_forks,
        AVG(td.stars_today) as avg_stars_today
    FROM trending_data td
    WHERE td.date BETWEEN start_date AND end_date
    GROUP BY td.date
    ORDER BY td.date DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. 按日期和分类统计趋势数据
CREATE OR REPLACE FUNCTION get_daily_category_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    date DATE,
    category VARCHAR(50),
    period VARCHAR(20),
    total_repos BIGINT,
    total_stars BIGINT,
    total_forks BIGINT,
    total_stars_today BIGINT,
    avg_stars NUMERIC,
    avg_forks NUMERIC,
    avg_stars_today NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        td.date,
        td.category,
        td.period,
        COUNT(DISTINCT td.repository_id) as total_repos,
        SUM(td.stars) as total_stars,
        SUM(td.forks) as total_forks,
        SUM(td.stars_today) as total_stars_today,
        AVG(td.stars) as avg_stars,
        AVG(td.forks) as avg_forks,
        AVG(td.stars_today) as avg_stars_today
    FROM trending_data td
    WHERE td.date BETWEEN start_date AND end_date
    GROUP BY td.date, td.category, td.period
    ORDER BY td.date DESC, td.category, td.period;
END;
$$ LANGUAGE plpgsql;

-- 3. 按日期和编程语言统计
CREATE OR REPLACE FUNCTION get_daily_language_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    date DATE,
    language VARCHAR(100),
    total_repos BIGINT,
    total_stars BIGINT,
    total_forks BIGINT,
    total_stars_today BIGINT,
    avg_stars NUMERIC,
    avg_forks NUMERIC,
    avg_stars_today NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        td.date,
        r.language,
        COUNT(DISTINCT r.id) as total_repos,
        SUM(td.stars) as total_stars,
        SUM(td.forks) as total_forks,
        SUM(td.stars_today) as total_stars_today,
        AVG(td.stars) as avg_stars,
        AVG(td.forks) as avg_forks,
        AVG(td.stars_today) as avg_stars_today
    FROM trending_data td
    JOIN repositories r ON td.repository_id = r.id
    WHERE td.date BETWEEN start_date AND end_date
        AND r.language IS NOT NULL
        AND r.language != ''
    GROUP BY td.date, r.language
    ORDER BY td.date DESC, total_stars DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. 按日期统计新增仓库数量
CREATE OR REPLACE FUNCTION get_daily_new_repos_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    date DATE,
    new_repos_count BIGINT,
    total_repos_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        td.date,
        COUNT(DISTINCT CASE WHEN r.created_at::DATE = td.date THEN r.id END) as new_repos_count,
        COUNT(DISTINCT r.id) as total_repos_count
    FROM trending_data td
    JOIN repositories r ON td.repository_id = r.id
    WHERE td.date BETWEEN start_date AND end_date
    GROUP BY td.date
    ORDER BY td.date DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. 按日期统计排名变化趋势
CREATE OR REPLACE FUNCTION get_daily_ranking_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    date DATE,
    category VARCHAR(50),
    period VARCHAR(20),
    top_10_avg_stars NUMERIC,
    top_25_avg_stars NUMERIC,
    top_50_avg_stars NUMERIC,
    total_ranked_repos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        td.date,
        td.category,
        td.period,
        AVG(CASE WHEN td.rank <= 10 THEN td.stars END) as top_10_avg_stars,
        AVG(CASE WHEN td.rank <= 25 THEN td.stars END) as top_25_avg_stars,
        AVG(CASE WHEN td.rank <= 50 THEN td.stars END) as top_50_avg_stars,
        COUNT(CASE WHEN td.rank IS NOT NULL THEN 1 END) as total_ranked_repos
    FROM trending_data td
    WHERE td.date BETWEEN start_date AND end_date
    GROUP BY td.date, td.category, td.period
    ORDER BY td.date DESC, td.category, td.period;
END;
$$ LANGUAGE plpgsql;

-- 6. 按日期统计活跃仓库（有今日star增长的仓库）
CREATE OR REPLACE FUNCTION get_daily_active_repos_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    date DATE,
    active_repos_count BIGINT,
    total_repos_count BIGINT,
    active_repos_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        td.date,
        COUNT(CASE WHEN td.stars_today > 0 THEN 1 END) as active_repos_count,
        COUNT(*) as total_repos_count,
        ROUND(
            (COUNT(CASE WHEN td.stars_today > 0 THEN 1 END)::NUMERIC / COUNT(*)) * 100, 2
        ) as active_repos_percentage
    FROM trending_data td
    WHERE td.date BETWEEN start_date AND end_date
    GROUP BY td.date
    ORDER BY td.date DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. 按日期统计增长最快的仓库
CREATE OR REPLACE FUNCTION get_daily_growth_leaders(
    target_date DATE DEFAULT CURRENT_DATE,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    date DATE,
    repository_name VARCHAR(255),
    language VARCHAR(100),
    category VARCHAR(50),
    period VARCHAR(20),
    stars INTEGER,
    stars_today INTEGER,
    growth_rate NUMERIC,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        td.date,
        r.name as repository_name,
        r.language,
        td.category,
        td.period,
        td.stars,
        td.stars_today,
        CASE 
            WHEN td.stars - td.stars_today > 0 
            THEN ROUND((td.stars_today::NUMERIC / (td.stars - td.stars_today)) * 100, 2)
            ELSE 0 
        END as growth_rate,
        td.rank
    FROM trending_data td
    JOIN repositories r ON td.repository_id = r.id
    WHERE td.date = target_date
        AND td.stars_today > 0
    ORDER BY td.stars_today DESC, growth_rate DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 8. 按日期统计数据完整性
CREATE OR REPLACE FUNCTION get_daily_data_completeness(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    date DATE,
    expected_categories INTEGER,
    actual_categories INTEGER,
    completeness_percentage NUMERIC,
    missing_categories TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH expected_data AS (
        SELECT 
            d.date,
            c.category,
            p.period
        FROM generate_series(start_date, end_date, '1 day'::INTERVAL) d(date)
        CROSS JOIN (VALUES ('all'), ('python'), ('typescript'), ('javascript'), ('jupyter'), ('vue')) c(category)
        CROSS JOIN (VALUES ('daily'), ('weekly'), ('monthly')) p(period)
    ),
    actual_data AS (
        SELECT 
            td.date,
            td.category,
            td.period,
            COUNT(*) as repo_count
        FROM trending_data td
        WHERE td.date BETWEEN start_date AND end_date
        GROUP BY td.date, td.category, td.period
    )
    SELECT 
        ed.date,
        COUNT(*) as expected_categories,
        COUNT(ad.repo_count) as actual_categories,
        ROUND((COUNT(ad.repo_count)::NUMERIC / COUNT(*)) * 100, 2) as completeness_percentage,
        STRING_AGG(
            CASE WHEN ad.repo_count IS NULL 
            THEN ed.category || '-' || ed.period 
            END, ', '
        ) as missing_categories
    FROM expected_data ed
    LEFT JOIN actual_data ad ON ed.date = ad.date 
        AND ed.category = ad.category 
        AND ed.period = ad.period
    GROUP BY ed.date
    ORDER BY ed.date DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建日期统计视图
CREATE OR REPLACE VIEW daily_summary_stats AS
SELECT 
    td.date,
    COUNT(DISTINCT td.repository_id) as total_repos,
    COUNT(DISTINCT td.category) as categories_count,
    COUNT(DISTINCT td.period) as periods_count,
    SUM(td.stars) as total_stars,
    SUM(td.forks) as total_forks,
    SUM(td.stars_today) as total_stars_today,
    AVG(td.stars) as avg_stars,
    AVG(td.forks) as avg_forks,
    AVG(td.stars_today) as avg_stars_today,
    COUNT(CASE WHEN td.stars_today > 0 THEN 1 END) as active_repos_count,
    ROUND(
        (COUNT(CASE WHEN td.stars_today > 0 THEN 1 END)::NUMERIC / COUNT(*)) * 100, 2
    ) as active_repos_percentage
FROM trending_data td
GROUP BY td.date
ORDER BY td.date DESC;

-- 10. 创建月度统计视图
CREATE OR REPLACE VIEW monthly_summary_stats AS
SELECT 
    DATE_TRUNC('month', td.date) as month,
    COUNT(DISTINCT td.repository_id) as total_repos,
    COUNT(DISTINCT td.category) as categories_count,
    COUNT(DISTINCT td.period) as periods_count,
    SUM(td.stars) as total_stars,
    SUM(td.forks) as total_forks,
    SUM(td.stars_today) as total_stars_today,
    AVG(td.stars) as avg_stars,
    AVG(td.forks) as avg_forks,
    AVG(td.stars_today) as avg_stars_today,
    COUNT(CASE WHEN td.stars_today > 0 THEN 1 END) as active_repos_count,
    COUNT(DISTINCT td.date) as days_with_data
FROM trending_data td
GROUP BY DATE_TRUNC('month', td.date)
ORDER BY month DESC;
