## Why

Currently, the homepage only displays the `desc` (description) field for each trending repository. To provide users with more context and a better understanding of what a repository does without having to click through to its details, displaying the first 300 characters of the `overview` field is more informative and useful.

## What Changes

- Modify the homepage repository card/list component to add the display of the `overview` field.
- Ensure the `overview` text is truncated to a maximum of 300 characters.
- Retain the existing `desc` and `zh_description` displays.

## Capabilities

### New Capabilities
- `trending-list-ui`: Capability covering the display of the trending repositories on the homepage.

### Modified Capabilities

## Impact

- Frontend UI components for the repository list.
- No database schema changes are required as the `overview` field is already populated by previous changes.
