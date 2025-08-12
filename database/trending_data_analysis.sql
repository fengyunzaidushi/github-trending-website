-- GitHub Trending 数据统计脚本
-- 根据 trending_data 表按日期分组进行统计分析

-- =============================================================================
-- 1. 基本日期统计 - 按日期分组统计记录数量
-- =============================================================================

-- 1.1 每日记录总数统计
SELECT 
    date,
    COUNT(*) as total_records,
    COUNT(DISTINCT category) as unique_categories,
    COUNT(DISTINCT period) as unique_periods,
    MIN(rank) as min_rank,
    MAX(rank) as max_rank,
    AVG(stars)::INTEGER as avg_stars,
    SUM(stars) as total_stars,
    AVG(stars_today)::INTEGER as avg_stars_today
FROM trending_data
GROUP BY date
ORDER BY date DESC;

-- =============================================================================
-- 2. 详细日期统计 - 按日期、类别、周期分组
-- =============================================================================

-- 2.1 每日每类别每周期的详细统计
SELECT 
    date,
    category,
    period,
    COUNT(*) as record_count,
    AVG(stars)::INTEGER as avg_stars,
    MAX(stars) as max_stars,
    MIN(stars) as min_stars,
    SUM(stars_today) as total_stars_today,
    COUNT(DISTINCT repository_id) as unique_repos
FROM trending_data
GROUP BY date, category, period
ORDER BY date DESC, category, period;

-- =============================================================================
-- 3. 数据完整性检查 - 找出缺失的日期组合
-- =============================================================================

-- 3.1 理论上应该存在的所有组合（基于已有数据的日期范围）
WITH date_range AS (
    SELECT generate_series(
        (SELECT MIN(date) FROM trending_data),
        (SELECT MAX(date) FROM trending_data),
        '1 day'::interval
    )::date AS expected_date
),
categories AS (
    SELECT DISTINCT category FROM trending_data
),
periods AS (
    SELECT DISTINCT period FROM trending_data  
),
expected_combinations AS (
    SELECT 
        dr.expected_date as date,
        c.category,
        p.period
    FROM date_range dr
    CROSS JOIN categories c
    CROSS JOIN periods p
),
actual_combinations AS (
    SELECT DISTINCT date, category, period
    FROM trending_data
)
-- 找出缺失的组合
SELECT 
    ec.date,
    ec.category,
    ec.period,
    'MISSING' as status
FROM expected_combinations ec
LEFT JOIN actual_combinations ac 
    ON ec.date = ac.date 
    AND ec.category = ac.category 
    AND ec.period = ac.period
WHERE ac.date IS NULL
ORDER BY ec.date DESC, ec.category, ec.period;

-- =============================================================================
-- 4. 数据质量统计 - 按日期分组的数据质量指标
-- =============================================================================

-- 4.1 数据质量综合报告
SELECT 
    date,
    COUNT(*) as total_records,
    
    -- 类别覆盖度
    COUNT(DISTINCT category) as categories_count,
    CASE 
        WHEN COUNT(DISTINCT category) >= 6 THEN '✅ 完整'
        WHEN COUNT(DISTINCT category) >= 4 THEN '⚠️ 部分'
        ELSE '❌ 不足'
    END as categories_status,
    
    -- 周期覆盖度  
    COUNT(DISTINCT period) as periods_count,
    CASE 
        WHEN COUNT(DISTINCT period) >= 3 THEN '✅ 完整'
        WHEN COUNT(DISTINCT period) >= 2 THEN '⚠️ 部分'
        ELSE '❌ 不足'
    END as periods_status,
    
    -- 数据量评估 (预期: 6类别 × 3周期 × 25项目 = 450条)
    CASE 
        WHEN COUNT(*) >= 400 THEN '✅ 充足'
        WHEN COUNT(*) >= 200 THEN '⚠️ 一般'
        ELSE '❌ 不足'
    END as data_volume_status,
    
    -- 排名完整性
    COUNT(*) FILTER (WHERE rank IS NOT NULL) as records_with_rank,
    ROUND(
        COUNT(*) FILTER (WHERE rank IS NOT NULL) * 100.0 / COUNT(*), 
        2
    ) as rank_completeness_pct,
    
    -- 星标数据质量
    AVG(stars)::INTEGER as avg_stars,
    COUNT(*) FILTER (WHERE stars > 0) as records_with_stars,
    ROUND(
        COUNT(*) FILTER (WHERE stars > 0) * 100.0 / COUNT(*), 
        2
    ) as stars_completeness_pct

FROM trending_data
GROUP BY date
ORDER BY date DESC;

-- =============================================================================
-- 5. 热门类别和语言统计 - 按日期分组
-- =============================================================================

-- 5.1 每日最热门的编程语言 (基于总星数)
SELECT 
    td.date,
    r.language,
    COUNT(*) as repo_count,
    SUM(td.stars) as total_stars,
    AVG(td.stars)::INTEGER as avg_stars,
    ROW_NUMBER() OVER (PARTITION BY td.date ORDER BY SUM(td.stars) DESC) as rank
FROM trending_data td
JOIN repositories r ON td.repository_id = r.id
WHERE r.language IS NOT NULL AND r.language != ''
GROUP BY td.date, r.language
ORDER BY td.date DESC, rank;

-- =============================================================================
-- 6. 时间范围和连续性检查
-- =============================================================================

-- 6.1 检查日期连续性 - 找出日期间隔
WITH date_gaps AS (
    SELECT 
        date,
        LAG(date) OVER (ORDER BY date) as prev_date,
        date - LAG(date) OVER (ORDER BY date) as gap_days
    FROM (
        SELECT DISTINCT date FROM trending_data ORDER BY date
    ) t
)
SELECT 
    prev_date,
    date,
    gap_days,
    CASE 
        WHEN gap_days = 1 THEN '✅ 连续'
        WHEN gap_days <= 3 THEN '⚠️ 小间隔'
        WHEN gap_days > 3 THEN '❌ 大间隔'
        ELSE '🔍 开始日期'
    END as status
FROM date_gaps
WHERE gap_days != 1 OR gap_days IS NULL
ORDER BY date;

-- =============================================================================
-- 7. 数据更新频率统计
-- =============================================================================

-- 7.1 按月统计数据量
SELECT 
    DATE_TRUNC('month', date) as month,
    COUNT(DISTINCT date) as days_with_data,
    COUNT(*) as total_records,
    AVG(COUNT(*)) OVER () as avg_daily_records,
    COUNT(DISTINCT category) as categories,
    COUNT(DISTINCT period) as periods
FROM trending_data
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- =============================================================================
-- 8. 异常数据检查
-- =============================================================================

-- 8.1 检查异常的排名数据
SELECT 
    date,
    category, 
    period,
    COUNT(*) as total_records,
    MIN(rank) as min_rank,
    MAX(rank) as max_rank,
    COUNT(*) FILTER (WHERE rank IS NULL) as null_ranks,
    COUNT(*) FILTER (WHERE rank > 100) as high_ranks
FROM trending_data
GROUP BY date, category, period
HAVING MIN(rank) != 1 OR MAX(rank) > 100 OR COUNT(*) FILTER (WHERE rank IS NULL) > 0
ORDER BY date DESC;

-- =============================================================================
-- 9. 快速诊断查询
-- =============================================================================

-- 9.1 最近7天数据概览
SELECT 
    date,
    COUNT(*) as records,
    STRING_AGG(DISTINCT category, ', ' ORDER BY category) as categories,
    STRING_AGG(DISTINCT period, ', ' ORDER BY period) as periods,
    CASE 
        WHEN COUNT(*) >= 400 THEN '✅'
        WHEN COUNT(*) >= 200 THEN '⚠️' 
        ELSE '❌'
    END as status
FROM trending_data 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date 
ORDER BY date DESC;