-- GitHub Trending 日期统计查询使用示例

-- 示例1: 获取最近30天的每日趋势统计
SELECT * FROM get_daily_trending_stats();

-- 示例2: 获取指定日期范围的每日趋势统计
SELECT * FROM get_daily_trending_stats(
    start_date := '2024-01-01'::DATE,
    end_date := '2024-01-31'::DATE
);

-- 示例3: 获取按分类和周期的每日统计
SELECT * FROM get_daily_category_stats(
    start_date := CURRENT_DATE - INTERVAL '7 days',
    end_date := CURRENT_DATE
);

-- 示例4: 获取特定分类的每日统计
SELECT * FROM get_daily_category_stats()
WHERE category = 'python' AND period = 'daily'
ORDER BY date DESC;

-- 示例5: 获取按编程语言的每日统计
SELECT * FROM get_daily_language_stats(
    start_date := CURRENT_DATE - INTERVAL '14 days',
    end_date := CURRENT_DATE
);

-- 示例6: 获取特定语言的每日统计
SELECT * FROM get_daily_language_stats()
WHERE language = 'JavaScript'
ORDER BY date DESC, total_stars DESC;

-- 示例7: 获取每日新增仓库统计
SELECT * FROM get_daily_new_repos_stats(
    start_date := CURRENT_DATE - INTERVAL '30 days',
    end_date := CURRENT_DATE
);

-- 示例8: 获取排名统计信息
SELECT * FROM get_daily_ranking_stats(
    start_date := CURRENT_DATE - INTERVAL '7 days',
    end_date := CURRENT_DATE
);

-- 示例9: 获取特定分类的排名统计
SELECT * FROM get_daily_ranking_stats()
WHERE category = 'all' AND period = 'daily'
ORDER BY date DESC;

-- 示例10: 获取每日活跃仓库统计
SELECT * FROM get_daily_active_repos_stats(
    start_date := CURRENT_DATE - INTERVAL '30 days',
    end_date := CURRENT_DATE
);

-- 示例11: 获取今日增长最快的仓库
SELECT * FROM get_daily_growth_leaders(
    target_date := CURRENT_DATE,
    limit_count := 20
);

-- 示例12: 获取指定日期的增长最快仓库
SELECT * FROM get_daily_growth_leaders(
    target_date := '2024-01-15'::DATE,
    limit_count := 15
);

-- 示例13: 获取数据完整性统计
SELECT * FROM get_daily_data_completeness(
    start_date := CURRENT_DATE - INTERVAL '7 days',
    end_date := CURRENT_DATE
);

-- 示例14: 查看每日汇总统计视图
SELECT * FROM daily_summary_stats
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;

-- 示例15: 查看月度汇总统计视图
SELECT * FROM monthly_summary_stats
WHERE month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
ORDER BY month DESC;

-- 示例16: 复杂查询 - 获取最近一周每日各分类的仓库数量
SELECT 
    date,
    category,
    period,
    COUNT(DISTINCT repository_id) as repo_count,
    SUM(stars) as total_stars,
    AVG(stars) as avg_stars
FROM trending_data
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date, category, period
ORDER BY date DESC, category, period;

-- 示例17: 复杂查询 - 获取每日热门语言TOP5
WITH daily_language_ranks AS (
    SELECT 
        td.date,
        r.language,
        COUNT(DISTINCT r.id) as repo_count,
        SUM(td.stars) as total_stars,
        ROW_NUMBER() OVER (PARTITION BY td.date ORDER BY SUM(td.stars) DESC) as rank
    FROM trending_data td
    JOIN repositories r ON td.repository_id = r.id
    WHERE td.date >= CURRENT_DATE - INTERVAL '30 days'
        AND r.language IS NOT NULL
        AND r.language != ''
    GROUP BY td.date, r.language
)
SELECT * FROM daily_language_ranks
WHERE rank <= 5
ORDER BY date DESC, rank;

-- 示例18: 复杂查询 - 获取连续上榜的仓库
WITH consecutive_days AS (
    SELECT 
        repository_id,
        date,
        LAG(date) OVER (PARTITION BY repository_id ORDER BY date) as prev_date
    FROM trending_data
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
),
consecutive_counts AS (
    SELECT 
        repository_id,
        COUNT(*) as consecutive_count
    FROM consecutive_days
    WHERE date = prev_date + INTERVAL '1 day'
    GROUP BY repository_id
)
SELECT 
    r.name,
    r.language,
    cc.consecutive_count
FROM consecutive_counts cc
JOIN repositories r ON cc.repository_id = r.id
WHERE cc.consecutive_count >= 3
ORDER BY cc.consecutive_count DESC, r.name;

-- 示例19: 复杂查询 - 获取每周增长趋势
SELECT 
    DATE_TRUNC('week', date) as week_start,
    category,
    period,
    COUNT(DISTINCT repository_id) as weekly_repos,
    SUM(stars_today) as weekly_stars_gained,
    AVG(stars) as avg_stars_per_repo
FROM trending_data
WHERE date >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', date), category, period
ORDER BY week_start DESC, category, period;

-- 示例20: 复杂查询 - 获取数据质量报告
SELECT 
    date,
    COUNT(*) as total_records,
    COUNT(CASE WHEN stars > 0 THEN 1 END) as records_with_stars,
    COUNT(CASE WHEN forks > 0 THEN 1 END) as records_with_forks,
    COUNT(CASE WHEN stars_today > 0 THEN 1 END) as records_with_today_stars,
    COUNT(CASE WHEN rank IS NOT NULL THEN 1 END) as records_with_rank,
    ROUND(
        (COUNT(CASE WHEN stars > 0 AND forks > 0 AND stars_today > 0 AND rank IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*)) * 100, 2
    ) as complete_records_percentage
FROM trending_data
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;
