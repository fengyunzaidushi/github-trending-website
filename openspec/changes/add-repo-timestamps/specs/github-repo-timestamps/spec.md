## ADDED Requirements

### Requirement: Database fields for GitHub timestamps
The system SHALL store the original GitHub repository creation and update timestamps in the `repositories` table to preserve accurate historical origin data without conflating it with database record creation time.

#### Scenario: Database schema updated
- **WHEN** the database migration is applied
- **THEN** the `repositories` table contains `github_created_at` and `github_updated_at` fields of type `timestamptz`

### Requirement: Fetch GitHub timestamps during ingestion
The system SHALL fetch `created_at` and `updated_at` from the GitHub API when scraping or enriching repository data, using appropriate API authentication to avoid rate limits.

#### Scenario: Successfully fetching from GitHub API
- **WHEN** the crawler discovers an unrecorded repository
- **THEN** it fetches data from `https://api.github.com/repos/{owner}/{repo}` and extracts the `created_at` and `updated_at` fields

#### Scenario: Saving GitHub timestamps to database
- **WHEN** the crawler upserts repository data into the database
- **THEN** it maps the fetched timestamps to `github_created_at` and `github_updated_at` in the Supabase `repositories` table
