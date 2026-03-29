## ADDED Requirements

### Requirement: Display repository overview on homepage
The system SHALL display the `overview` field for each trending repository on the homepage repository list.

#### Scenario: Repository has an overview
- **WHEN** a repository in the trending list has a non-null `overview` string
- **THEN** the component SHALL render the `overview` text above the description fields
- **AND THEN** the system SHALL truncate the `overview` text to a maximum of 300 characters, appending an ellipsis if truncated

#### Scenario: Repository has an empty overview
- **WHEN** a repository in the trending list has a null or empty `overview` string
- **THEN** the component SHALL NOT attempt to render the overview block
- **AND THEN** the system SHALL fall back to only displaying the `zh_description` and `description` fields
