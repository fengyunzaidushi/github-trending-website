import { supabaseAdmin } from '../lib/supabase'

async function patch() {
  const sql1 = `
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
    overview TEXT,
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
        r.overview,
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
  `;
  
  console.log('Patching get_trending_repos function...');
  const { error: error1 } = await supabaseAdmin.rpc('execute_sql', { sql: sql1 });
  if (error1) {
    if (error1.message && error1.message.includes('cannot change return type of existing function')) {
      console.log('Dropping existing function first...');
      await supabaseAdmin.rpc('execute_sql', { sql: 'DROP FUNCTION IF EXISTS get_trending_repos(DATE, VARCHAR, VARCHAR, INTEGER);' });
      const { error: retryError } = await supabaseAdmin.rpc('execute_sql', { sql: sql1 });
      console.log('Result after dropping:', retryError || 'Success');
    } else {
      console.error('Error:', error1);
    }
  } else {
    console.log('Function patched successfully!');
  }
}
patch().catch(console.error);
