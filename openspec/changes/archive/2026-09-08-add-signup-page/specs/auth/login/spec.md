## MODIFIED Requirements

### Requirement: Login page

The system SHALL provide a `/login` page rendering a two-panel layout: an image panel and a form
panel containing the login form. The page SHALL be reachable while unauthenticated. The page SHALL
link to `/signup`.

#### Scenario: Unauthenticated visitor loads the login page

- **WHEN** an unauthenticated visitor navigates to `/login`
- **THEN** the system renders the login page with an empty email field, an empty password field,
  and a submit button

#### Scenario: Already-authenticated visitor loads the login page

- **WHEN** a visitor with an active session navigates to `/login`
- **THEN** the system redirects them to the home route without displaying the login form

#### Scenario: Link to sign-up

- **WHEN** an unauthenticated visitor views the login page
- **THEN** the page shows a link to `/signup`
