-- =============================================================================
-- GitHub Trending Data - 按日期分组统计 SQL 查询
-- =============================================================================

-- 1. 基础日期统计 - 最常用
-- =============================================================================
-- 按日期统计记录数量，按日期降序排列
SELECT 
    date,
    COUNT(*) as total_records,
    COUNT(DISTINCT category) as categories_count,
    COUNT(DISTINCT period) as periods_count,
    AVG(stars)::INTEGER as avg_stars,
    SUM(stars_today) as total_stars_today,
    MIN(created_at) as first_import_time,
    MAX(created_at) as last_import_time
FROM trending_data
GROUP BY date
ORDER BY date DESC;

-- 2. 详细日期统计 - 包含数据质量指标
-- =============================================================================
SELECT 
    date,
    COUNT(*) as total_records,
    
    -- 数据完整性指标
    COUNT(DISTINCT category) as unique_categories,
    COUNT(DISTINCT period) as unique_periods,
    COUNT(DISTINCT repository_id) as unique_repositories,
    
    -- 数据质量评估
    CASE 
        WHEN COUNT(*) >= 400 THEN '✅ 完整'
        WHEN COUNT(*) >= 200 THEN '⚠️ 部分'  
        ELSE '❌ 不足'
    END as data_quality,
    
    -- 统计指标
    MIN(rank) as min_rank,
    MAX(rank) as max_rank,
    AVG(stars)::INTEGER as avg_stars,
    MAX(stars) as max_stars,
    SUM(stars_today) as daily_stars_gained,
    
    -- 排名完整性
    COUNT(*) FILTER (WHERE rank IS NOT NULL) as records_with_rank,
    ROUND(COUNT(*) FILTER (WHERE rank IS NOT NULL) * 100.0 / COUNT(*), 1) as rank_completeness_pct,
    
    -- 时间戳
    MIN(created_at) as earliest_import,
    MAX(created_at) as latest_import
    
FROM trending_data
GROUP BY date
ORDER BY date DESC;

-- 3. 简化版本 - 快速概览
-- =============================================================================
-- 只显示关键统计信息
SELECT 
    date,
    COUNT(*) as records,
    COUNT(DISTINCT category) as categories,
    COUNT(DISTINCT period) as periods,
    AVG(stars)::INTEGER as avg_stars
FROM trending_data
GROUP BY date
ORDER BY date DESC
LIMIT 30;

-- 4. 月度汇总统计
-- =============================================================================
-- 按月份统计数据量
SELECT 
    DATE_TRUNC('month', date) as month,
    COUNT(DISTINCT date) as days_with_data,
    COUNT(*) as total_records,
    AVG(COUNT(*)) OVER () as avg_daily_records,
    MIN(date) as first_date,
    MAX(date) as last_date,
    COUNT(DISTINCT category) as total_categories,
    COUNT(DISTINCT period) as total_periods
FROM trending_data
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- 5. 数据缺失检查
-- =============================================================================
-- 找出理论上应该存在但实际缺失的日期
WITH date_series AS (
    SELECT generate_series(
        (SELECT MIN(date) FROM trending_data),
        (SELECT MAX(date) FROM trending_data),
        '1 day'::interval
    )::date AS expected_date
),
actual_dates AS (
    SELECT DISTINCT date FROM trending_data
)
SELECT 
    ds.expected_date as missing_date,
    '❌ 缺失' as status
FROM date_series ds
LEFT JOIN actual_dates ad ON ds.expected_date = ad.date  
WHERE ad.date IS NULL
ORDER BY ds.expected_date DESC;

-- 6. 按星期几统计 
-- =============================================================================  
-- 看看哪天收集的数据最多
SELECT 
    EXTRACT(DOW FROM date) as day_of_week,
    CASE EXTRACT(DOW FROM date)
        WHEN 0 THEN '周日'
        WHEN 1 THEN '周一'  
        WHEN 2 THEN '周二'
        WHEN 3 THEN '周三'
        WHEN 4 THEN '周四'
        WHEN 5 THEN '周五'
        WHEN 6 THEN '周六'
    END as weekday_name,
    COUNT(DISTINCT date) as dates_count,
    COUNT(*) as total_records,
    AVG(COUNT(*)) as avg_records_per_day
FROM trending_data
GROUP BY EXTRACT(DOW FROM date)
ORDER BY day_of_week;

-- 7. 最近N天的趋势
-- =============================================================================
-- 查看最近7天的数据趋势
SELECT 
    date,
    COUNT(*) as records,
    LAG(COUNT(*)) OVER (ORDER BY date) as prev_day_records,
    COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY date) as record_change,
    CASE 
        WHEN COUNT(*) > LAG(COUNT(*)) OVER (ORDER BY date) THEN '📈 增加'
        WHEN COUNT(*) < LAG(COUNT(*)) OVER (ORDER BY date) THEN '📉 减少'  
        ELSE '➡️ 持平'
    END as trend
FROM trending_data
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;

-- 8. 数据导入时间分析
-- =============================================================================
-- 分析数据是何时导入的
SELECT 
    date,
    COUNT(*) as records,
    MIN(created_at)::timestamp(0) as first_import_time,
    MAX(created_at)::timestamp(0) as last_import_time,
    MAX(created_at) - MIN(created_at) as import_duration,
    COUNT(DISTINCT DATE_TRUNC('hour', created_at)) as import_hours
FROM trending_data
GROUP BY date
ORDER BY date DESC;

-- 9. 一行查询版本 - 超级简化
-- =============================================================================
-- 最简单的按日期分组统计
SELECT date, COUNT(*) FROM trending_data GROUP BY date ORDER BY date DESC;

-- 10. Top/Bottom 分析
-- =============================================================================
-- 找出数据最多和最少的日期
(
    SELECT 
        date, 
        COUNT(*) as records,
        '🏆 数据最多' as status
    FROM trending_data 
    GROUP BY date 
    ORDER BY COUNT(*) DESC 
    LIMIT 5
)
UNION ALL
(
    SELECT 
        date, 
        COUNT(*) as records,
        '⚠️ 数据最少' as status
    FROM trending_data 
    GROUP BY date 
    ORDER BY COUNT(*) ASC 
    LIMIT 5
)
ORDER BY records DESC;