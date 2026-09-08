## Purpose

The authenticated app shell provides the persistent navigation, layout, and account controls that
every signed-in host page renders inside, so individual features don't each reimplement routing
chrome, session guarding, or sign-out.

## ADDED Requirements

### Requirement: Authenticated access only
The system SHALL restrict every route under the app shell to signed-in hosts, redirecting
anonymous visitors to the login page instead of rendering shell content.

#### Scenario: Anonymous visitor requests a shell route
- **WHEN** an unauthenticated visitor requests any route under the app shell
- **THEN** the system redirects them to `/login` without rendering shell content

#### Scenario: Authenticated host requests a shell route
- **WHEN** a signed-in host requests a route under the app shell
- **THEN** the system renders the shell with that route's content, without redirecting

### Requirement: Persistent sidebar navigation
The system SHALL render a sidebar listing the host's available destinations on every shell route,
marking the destination matching the current route as active.

#### Scenario: Viewing a shell page
- **WHEN** a signed-in host is on any shell route
- **THEN** the sidebar is visible and the nav entry for the current route is marked active

#### Scenario: Navigating via the sidebar
- **WHEN** a signed-in host selects a different destination in the sidebar
- **THEN** the system navigates to that destination and updates the active marker accordingly

### Requirement: Collapsible sidebar with persisted state
The system SHALL let the host collapse the sidebar to an icon-only rail and expand it back, and
SHALL remember that choice across page reloads on the same browser.

#### Scenario: Collapsing the sidebar
- **WHEN** a signed-in host collapses the sidebar
- **THEN** the sidebar switches to icon-only rail mode and every nav entry remains reachable by
  its icon

#### Scenario: Reloading after collapsing
- **WHEN** a signed-in host reloads a shell page after collapsing the sidebar
- **THEN** the sidebar renders already collapsed, without a visible expand-then-collapse flash

### Requirement: Responsive layout on small viewports
The system SHALL present the sidebar as an overlay on small viewports instead of a fixed panel, so
shell content is not permanently squeezed on mobile widths.

#### Scenario: Opening the shell on a small viewport
- **WHEN** a signed-in host opens a shell route on a small viewport
- **THEN** the sidebar is hidden by default and opens as an overlay when explicitly triggered,
  without permanently reducing the content area's width

### Requirement: Account menu with sign-out
The system SHALL provide an account menu, reachable from the sidebar, showing the signed-in
host's name/email and an action to sign out.

#### Scenario: Opening the account menu
- **WHEN** a signed-in host opens the account menu
- **THEN** the system shows that host's name/email and a sign-out action

#### Scenario: Signing out from the account menu
- **WHEN** a signed-in host selects sign-out from the account menu
- **THEN** the system ends their session and redirects them to `/login`
