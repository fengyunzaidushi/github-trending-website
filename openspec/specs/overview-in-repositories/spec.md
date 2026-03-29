# Capability: overview-in-repositories

## Purpose
TBD

## Requirements

### Requirement: Overview field in repositories table
The system SHALL store the repository overview text directly in the `repositories` table in an `overview` column of type TEXT, in addition to any existing storage in `repo_overviews`.

#### Scenario: Database schema includes overview column
- **WHEN** the database schema migration runs
- **THEN** the `repositories` table contains an `overview` column of type TEXT that allows NULL values

### Requirement: Existing overview data migrated to repositories
The system SHALL copy all non-null `overview` values from `repo_overviews` to `repositories.overview` during the one-time data migration.

#### Scenario: Migrating existing overviews
- **WHEN** the migration SQL runs
- **THEN** every repository that has a corresponding row in `repo_overviews` with a non-null `overview` SHALL have its `repositories.overview` set to that value
- **AND THEN** repositories without a matching `repo_overviews` row SHALL have `repositories.overview` remain NULL

### Requirement: Daily crawler writes overview on upsert
The system SHALL attempt to fetch a repository's overview from zread.ai (falling back to GitHub README) immediately after writing the repository to Supabase, and write the result to `repositories.overview`, but only when `overview` is currently NULL.

#### Scenario: New repository fetched during trending crawl
- **WHEN** the daily crawler successfully upserts a repository row
- **AND** `repositories.overview` is NULL for that repository
- **THEN** the crawler SHALL request the overview from zread.ai or fall back to GitHub README
- **AND THEN** the crawler SHALL write the fetched overview to `repositories.overview` in the same session

#### Scenario: Repository already has overview
- **WHEN** the daily crawler upserts a repository row
- **AND** `repositories.overview` already has a value
- **THEN** the crawler SHALL NOT overwrite or re-fetch the overview
