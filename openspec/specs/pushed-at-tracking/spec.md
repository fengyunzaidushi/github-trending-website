# Capability: pushed-at-tracking

## Purpose
TBD

## Requirements

### Requirement: Database fields for pushed_at timestamp
The system SHALL store the original GitHub repository code push timestamp `pushed_at` in the `repositories` table.

#### Scenario: Database schema includes pushed_at
- **WHEN** the database is initialized or migrated
- **THEN** the `repositories` table contains a `pushed_at` column of type `TIMESTAMP WITH TIME ZONE` (timestamptz)

### Requirement: Crawler persists pushed_at timestamp
The system SHALL extract the `pushed_at` timestamp from the GitHub API response and persist it to the `repositories` table during metadata backfill or sync operations.

#### Scenario: Backfilling timestamp data
- **WHEN** the crawling script successfully fetches repository metadata from the GitHub API
- **THEN** it updates the `pushed_at` column in the database with the fetched timestamp alongside other metrics
- **AND THEN** it ensures the JSON backup file also includes the `pushed_at` value for downstream evaluation
