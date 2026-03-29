## Context

The homepage currently presents a list of trending repositories but only shows the `desc` (description) field. We recently added the ability to fetch and store a more comprehensive `overview` of each repository in the database (`repositories.overview`). Exposing this `overview` on the homepage will give users a better immediate understanding of the repository without requiring them to navigate to the detailed view.

## Goals / Non-Goals

**Goals:**
- Update the homepage repository list component to add the display of the `overview` field.
- Ensure the overview text is truncated to a maximum of 300 characters to avoid breaking the UI layout.
- Retain the original `desc` and `zh_description` displays.

**Non-Goals:**
- Completely removing the `desc` field from the database or API.
- Changing the layout structure of the repository card significantly.
- Rendering full markdown within the repository card snippet (should be plain text).

## Decisions

**1. Truncation approach:**
Since a strict 300 character limit was requested, we will use a helper function in JavaScript/TypeScript to truncate the string to 300 characters and append "..." if it exceeds that length. Combining this with CSS `line-clamp` can act as an additional safety net for vertical spacing.

**2. Display logic:**
If `overview` is available, we display it in a highlighted block above the existing descriptions.
Logic pseudo-code: `const truncatedOverview = repo.overview.length > 300 ? repo.overview.slice(0, 300) + '...' : repo.overview;`

**3. HTML/Markdown Stripping:**
The `overview` field might contain markdown or HTML. To ensure the homepage card remains clean, we should strip markdown tags before taking the 300-character snippet.

## Risks / Trade-offs

- **Risk:** Increased payload size if the API now returns the full `overview` for ALL repositories on the homepage.
  - **Mitigation:** If the API returns the full `overview` (which can be long), the payload might grow. Depending on the size, we might need to truncate at the API level instead of the frontend. If it's a small difference, frontend truncation is fine. For now, frontend truncation is simpler.
- **Risk:** Markdown content in overview looks messy if just sliced.
  - **Mitigation:** Implement a simple markdown removal utility before slicing the text.
