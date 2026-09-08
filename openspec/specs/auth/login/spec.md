## Purpose

Lets a registered user authenticate with their email and password so they can access the
authenticated parts of Slotly (dashboard, event types, bookings).

## Requirements

### Requirement: Login page

The system SHALL provide a `/login` page rendering a two-panel layout: an image panel and a form
panel containing the login form. The page SHALL be reachable while unauthenticated.

#### Scenario: Unauthenticated visitor loads the login page

- **WHEN** an unauthenticated visitor navigates to `/login`
- **THEN** the system renders the login page with an empty email field, an empty password field,
  and a submit button

#### Scenario: Already-authenticated visitor loads the login page

- **WHEN** a visitor with an active session navigates to `/login`
- **THEN** the system redirects them to the home route without displaying the login form

### Requirement: Email and password submission

The system SHALL let the user submit an email and password to authenticate via Better-Auth's
email/password provider.

#### Scenario: Successful login

- **WHEN** the user submits a registered email and its correct password
- **THEN** the system establishes a session and redirects the user to the home route

#### Scenario: Wrong password

- **WHEN** the user submits a registered email with an incorrect password
- **THEN** the system does not establish a session, keeps the user on `/login`, and displays an
  inline error indicating the credentials are invalid

#### Scenario: Unregistered email

- **WHEN** the user submits an email that has no matching account
- **THEN** the system does not establish a session, keeps the user on `/login`, and displays an
  inline error indicating the credentials are invalid (the system SHALL NOT reveal whether the
  email exists)

### Requirement: Client-side field validation

The system SHALL validate the email and password fields before submitting to Better-Auth, so
malformed input is rejected without a network round-trip.

#### Scenario: Empty submission

- **WHEN** the user submits the form with both fields empty
- **THEN** the system displays a required-field error under each empty field and does not submit

#### Scenario: Malformed email

- **WHEN** the user enters a value that is not a valid email address and submits
- **THEN** the system displays an inline error under the email field and does not submit

### Requirement: Submission loading state

The system SHALL indicate to the user that a login submission is in progress and SHALL prevent
duplicate submissions while one is pending.

#### Scenario: Submit in flight

- **WHEN** the user submits valid credentials and the request has not yet resolved
- **THEN** the submit button shows a loading state and is disabled until the request resolves

### Requirement: Redirect after login

The system SHALL redirect a successfully authenticated user to the application's home route.

#### Scenario: Redirect target

- **WHEN** login succeeds
- **THEN** the browser navigates to `/`
