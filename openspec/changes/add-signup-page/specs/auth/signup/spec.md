## Purpose

Lets a new user create a Slotly account with their name, email, and password so they can start
using the product without needing an account provisioned for them elsewhere.

## ADDED Requirements

### Requirement: Sign-up page

The system SHALL provide a `/signup` page rendering the shared two-panel auth layout with a
sign-up form. The page SHALL be reachable while unauthenticated and SHALL link to `/login`.

#### Scenario: Unauthenticated visitor loads the sign-up page

- **WHEN** an unauthenticated visitor navigates to `/signup`
- **THEN** the system renders the sign-up page with empty name, email, password, and
  confirm-password fields, a submit button, and a link to `/login`

#### Scenario: Already-authenticated visitor loads the sign-up page

- **WHEN** a visitor with an active session navigates to `/signup`
- **THEN** the system redirects them to the home route without displaying the sign-up form

### Requirement: Account creation

The system SHALL let a visitor create an account by submitting a name, email, and password via
Better-Auth's email/password provider.

#### Scenario: Successful sign-up

- **WHEN** the visitor submits a name, an email with no existing account, and a valid password
- **THEN** the system creates the account, establishes a session, and redirects to the home route

#### Scenario: Duplicate email

- **WHEN** the visitor submits an email that already has an account
- **THEN** the system does not create a new account, keeps the visitor on `/signup`, and displays
  an inline error on the email field indicating an account with that email already exists

### Requirement: Client-side field validation

The system SHALL validate the name, email, password, and confirm-password fields before
submitting to Better-Auth, so malformed or inconsistent input is rejected without a network
round-trip.

#### Scenario: Empty submission

- **WHEN** the visitor submits the form with all fields empty
- **THEN** the system displays a required-field error under each empty field and does not submit

#### Scenario: Malformed email

- **WHEN** the visitor enters a value that is not a valid email address and submits
- **THEN** the system displays an inline error under the email field and does not submit

#### Scenario: Password confirmation mismatch

- **WHEN** the password and confirm-password fields do not match and the visitor submits
- **THEN** the system displays an inline error under the confirm-password field and does not
  submit

### Requirement: Submission loading state

The system SHALL indicate to the user that a sign-up submission is in progress and SHALL prevent
duplicate submissions while one is pending.

#### Scenario: Submit in flight

- **WHEN** the visitor submits a valid, non-duplicate sign-up and the request has not yet resolved
- **THEN** the submit button shows a loading state and is disabled until the request resolves

### Requirement: Redirect after sign-up

The system SHALL redirect a successfully registered and authenticated user to the application's
home route.

#### Scenario: Redirect target

- **WHEN** sign-up succeeds
- **THEN** the browser navigates to `/`
