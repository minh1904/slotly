## Purpose

Lets a signed-in host define when they can be booked — recurring weekly hours, date-specific
exceptions, and the buffer/notice/advance-window guardrails around those hours — so downstream
booking flows have a rule set to compute real slots against.

## ADDED Requirements

### Requirement: Recurring weekly availability
The system SHALL let a host define recurring weekly time blocks (day of week, start time, end
time) that repeat every week until explicitly changed, with more than one time block allowed per
day of week.

#### Scenario: Host adds a weekly time block
- **WHEN** a host adds a time block for a day of week with a start and end time
- **THEN** the system saves it and includes it in that day of week going forward, every week

#### Scenario: Host adds multiple non-overlapping blocks on the same day
- **WHEN** a host adds a second time block on a day of week that does not overlap an existing block
  on that same day
- **THEN** the system saves both blocks

#### Scenario: Host attempts overlapping blocks on the same day
- **WHEN** a host adds or edits a time block on a day of week such that it overlaps another block
  already defined for that same day of week
- **THEN** the system rejects the change and does not save the overlapping block

### Requirement: Date-specific overrides
The system SHALL let a host override their recurring weekly availability for a specific calendar
date, either blocking that date entirely or replacing its hours with custom time blocks, and an
override SHALL fully replace the weekly rule for that date rather than combine with it.

#### Scenario: Host blocks a specific date
- **WHEN** a host marks a specific date as blocked
- **THEN** the system treats that date as fully unavailable regardless of any recurring weekly
  block that would otherwise apply

#### Scenario: Host sets custom hours for a specific date
- **WHEN** a host defines custom time blocks for a specific date
- **THEN** the system uses only those custom blocks for that date and ignores the recurring weekly
  blocks that would otherwise apply

#### Scenario: Removing an override restores the weekly rule
- **WHEN** a host removes an override for a specific date
- **THEN** the system falls back to the recurring weekly blocks for that date's day of week

### Requirement: Booking guardrails
The system SHALL let a host configure a buffer duration before and after bookings, a minimum
notice period, and a maximum advance booking window, each defaulting to zero/unlimited when unset.

#### Scenario: Host sets buffer time
- **WHEN** a host sets a buffer duration before and/or after bookings
- **THEN** the system saves both values and they apply to every future slot computation

#### Scenario: Host sets minimum notice
- **WHEN** a host sets a minimum notice period
- **THEN** the system saves it as the shortest allowed gap between the current time and a bookable
  slot's start

#### Scenario: Host sets maximum advance window
- **WHEN** a host sets a maximum advance booking window in days
- **THEN** the system saves it as the furthest a bookable slot's start may be from the current date

### Requirement: Timezone integrity
The system SHALL store weekly rules and date overrides as host-local time paired with an explicit
IANA timezone identifier, never as a fixed UTC offset, so stored hours remain correct across DST
transitions and are unaffected by the host's local wall-clock changing.

#### Scenario: DST transition does not shift stored hours
- **WHEN** a daylight-saving-time transition occurs in the host's timezone
- **THEN** previously saved weekly rules and overrides continue to represent the same host-local
  hours, unchanged

#### Scenario: Host changes their timezone
- **WHEN** a host updates their timezone setting
- **THEN** the system continues to interpret existing weekly rules and overrides as that host's
  local time in the newly selected timezone, without silently defaulting to a guessed timezone

### Requirement: Availability is private to its host
The system SHALL restrict reading and writing a host's availability (weekly rules, overrides, and
guardrail settings) to that authenticated host.

#### Scenario: Unauthenticated request
- **WHEN** an unauthenticated visitor requests to view or edit availability
- **THEN** the system denies the request instead of returning or modifying any data

#### Scenario: Authenticated host requests another host's availability
- **WHEN** a signed-in host attempts to view or edit availability belonging to a different host
- **THEN** the system denies the request

### Requirement: Host with no availability configured
The system SHALL treat a host with no weekly rules defined as having no available time, without
raising an error.

#### Scenario: New host views their availability page
- **WHEN** a host who has never configured availability opens the availability management page
- **THEN** the system shows an empty schedule rather than an error, ready for the host to add
  blocks
