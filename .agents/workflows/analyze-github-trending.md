---
description: analyze github trending data from supabase
---
# Analyze GitHub Trending Data Workflow

This workflow provides standard operating procedures for analyzing the scraped GitHub trending and topic data using the Supabase MCP.

### Prerequisites
- The `supabase-mcp-server` MCP must be active.

### Steps

1. **Target Supabase Project**:
   Always use the following Supabase project ID for executing queries on the GitHub Trending database:
   - **Project ID**: `oavfrzhquoxhmbluwgny` (Name: mcp-server)

2. **Understand the Core Schema**:
   The `public` schema contains all the scraped data. The core tables you will frequently interact with are:
   - `repositories`: Stores static and metadata information about the trending repositories.
   - `trending_data`: Stores daily snapshots (Date, Category, Period, Rank, Stars_Today). Joins with `repositories` on `repository_id`.
   - `topic_repositories`: Stores repositories scraped based on specific topics. **Crucially, this table includes the `readme_content` field** for deep semantic analysis or RAG purposes.
   - `users` / `user_repositories`: Information about GitHub organizations/users and their other repositories.

3. **Executing Analysis Queries**:
   Use the `mcp_supabase-mcp-server_execute_sql` tool, ensuring the `project_id` is passed correctly.
   
   *Example Query - Get Top Trending Repos Today:*
   ```sql
   SELECT r.name, r.url, r.description, r.language, t.category, t.rank, t.stars_today 
   FROM trending_data t 
   JOIN repositories r ON t.repository_id = r.id 
   WHERE t.date = CURRENT_DATE 
   ORDER BY t.rank ASC 
   LIMIT 10;
   ```

   *Example Query - Keyword Search across Historical Trending Data:*
   ```sql
   SELECT r.name, r.url, r.description, r.language, MAX(t.stars_today) as max_stars 
   FROM trending_data t 
   JOIN repositories r ON t.repository_id = r.id 
   WHERE r.description ILIKE '%ai%' OR r.description ILIKE '%agent%' 
   GROUP BY r.name, r.url, r.description, r.language 
   ORDER BY max_stars DESC 
   LIMIT 10;
   ```

4. **Formatting the Output**:
   - After retrieving the data, categorize the results based on the user's implicit intent (e.g., separate by programming language, or application type).
   - Format the results into clean, readable Markdown. Include clickable Markdown links `[Repo Name](url)` and highlight the `stars_today` and `description`.
