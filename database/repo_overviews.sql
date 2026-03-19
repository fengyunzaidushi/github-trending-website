-- repo_overviews 表：存储仓库富化内容（overview 来自 zread.ai，readme 来自 GitHub API）
-- 独立于 repositories 表，通过 enrichment 脚本异步填充

CREATE TABLE repo_overviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID UNIQUE REFERENCES repositories(id) ON DELETE CASCADE,

    -- zread.ai 的 1-overview 章节纯文本
    overview TEXT,
    -- 是否有 zread 数据：true=已抓到, false=已确认不存在(404), NULL=尚未抓取
    zread_available BOOLEAN DEFAULT NULL,
    overview_fetched_at TIMESTAMP WITH TIME ZONE,

    -- GitHub API 的 README Markdown 原文（base64 解码后）
    readme TEXT,
    -- 是否有 GitHub README：true=已抓到, false=已确认不存在, NULL=尚未抓取
    readme_available BOOLEAN DEFAULT NULL,
    readme_fetched_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_repo_overviews_repository_id ON repo_overviews(repository_id);
CREATE INDEX idx_repo_overviews_zread_available ON repo_overviews(zread_available);

-- RLS 策略
ALTER TABLE repo_overviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on repo_overviews" ON repo_overviews
    FOR SELECT USING (true);

CREATE POLICY "Allow service role all access on repo_overviews" ON repo_overviews
    FOR ALL USING (auth.role() = 'service_role');

-- updated_at 自动更新触发器（复用 repositories 表的模式）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_repo_overviews_updated_at
    BEFORE UPDATE ON repo_overviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
