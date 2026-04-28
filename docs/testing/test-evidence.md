# Test Evidence – Playwright E2E Testing

## Testing Tool
Microsoft Playwright was used to validate the frontend workflows of the Smart Campus Operations Hub.

## Testing Approach
The test suite was executed against the real React + Vite frontend and the live Spring Boot backend started through Playwright using the current project source. No frontend UI design or backend business logic was changed for the test run.

For stable automated authentication, Playwright launched the backend with the existing developer quick-sign-in path enabled through runtime environment variables:

- `APP_DEVELOPER_MODE=true`
- `APP_AUTH_SKIP_TWO_FACTOR=true`
- `APP_NOTIFICATIONS_EMAIL_ENABLED=false`

This allowed the tests to use the real `/api/v1/auth/dev-login` flow exposed by the application, without mocking authentication or bypassing the actual routing shell.

## Test Environment
- Frontend URL: `http://localhost:3000`
- Backend URL: `http://localhost:18080`
- Browser: `Chromium`
- Testing Type: `End-to-End UI Testing`
- Operating System: `Windows 10 Home`
- Execution Date: `2026-04-28 15:12:44 +05:30`
- Playwright Report: `frontend/playwright-report/index.html`

## Test Summary

| Test ID | Module | Scenario | Result | Evidence |
|---|---|---|---|---|
| T01 | Authentication | Login page loads successfully | PASS | `playwright-screenshots/login-page.png` |
| T02 | Authentication | Google Sign-In area is visible | PASS | `playwright-screenshots/login-page.png` |
| T03 | Authentication | Protected route redirects unauthenticated users to login | PASS | `playwright-screenshots/login-page.png` |
| T04 | Dashboard | Admin dashboard loads | PASS | `playwright-screenshots/admin-dashboard.png` |
| T05 | Dashboard | User dashboard loads | PASS | `playwright-screenshots/user-dashboard.png` |
| T06 | Dashboard | Technician dashboard loads | PASS | `playwright-screenshots/technician-dashboard.png` |
| T07 | Notifications | Notification dropdown opens | PASS | `playwright-screenshots/notification-dropdown.png` |
| T08 | Notifications | User notifications page loads | PASS | `playwright-screenshots/notifications-page.png` |
| T09 | Notifications | Admin targeted notifications page loads | PASS | `playwright-screenshots/admin-notifications-page.png` |
| T10 | Resources | Resource management page loads with filter and create form access | PASS | `playwright-screenshots/resources-page.png` |
| T11 | Bookings | Resource availability page loads | PASS | `playwright-screenshots/availability-page.png` |
| T12 | Bookings | Create booking page loads | PASS | `playwright-screenshots/create-booking-page.png` |
| T13 | Bookings | My bookings page loads | PASS | `playwright-screenshots/my-bookings-page.png` |
| T14 | Bookings | Admin booking approval page loads | PASS | `playwright-screenshots/admin-bookings-page.png` |
| T15 | Tickets | My tickets page and create ticket form load | PASS | `playwright-screenshots/my-tickets-page.png` |
| T16 | Tickets | Admin manage tickets page loads | PASS | `playwright-screenshots/manage-tickets-page.png` |
| T17 | Tickets | Technician ticket views load | PASS | `playwright-screenshots/technician-tickets-page.png` |
| T18 | Smoke | Landing page and public navigation load | PASS | `playwright-screenshots/landing-page.png` |
| T19 | Smoke | Tablet viewport loads without layout crash | PASS | `playwright-screenshots/tablet-dashboard.png` |

## Detailed Test Cases

### T01 – Login Page Loads
- Objective: Validate that the main login screen renders the standard credential-based sign-in UI.
- Steps: Open `/login` and verify the heading, campus email input, password input, and form submit button.
- Expected Result: The login form should render completely without layout or routing errors.
- Actual Result: The login page loaded successfully and displayed all required form controls.
- Status: PASS
- Screenshot Path: `playwright-screenshots/login-page.png`

### T02 – Google Sign-In Area
- Objective: Confirm that the Google sign-in area is present on the login screen.
- Steps: Open `/login` and inspect the social sign-in section under the divider.
- Expected Result: A visible Google sign-in area should be rendered for users.
- Actual Result: The login page displayed the Google sign-in section and its widget container.
- Status: PASS
- Screenshot Path: `playwright-screenshots/login-page.png`

### T03 – Protected Route Redirect
- Objective: Verify that unauthenticated users cannot directly access protected pages.
- Steps: Navigate to `/bookings` without an authenticated session.
- Expected Result: The application should redirect the browser to `/login`.
- Actual Result: The protected route redirected immediately to the login page.
- Status: PASS
- Screenshot Path: `playwright-screenshots/login-page.png`

### T04 – Admin Dashboard
- Objective: Verify that the admin console loads correctly after authentication.
- Steps: Sign in as admin through the real quick sign-in flow and open `/admin`.
- Expected Result: The admin workspace, sidebar, and topbar notification bell should be visible.
- Actual Result: The admin dashboard loaded successfully with the administration sidebar and notification bell.
- Status: PASS
- Screenshot Path: `playwright-screenshots/admin-dashboard.png`

### T05 – User Dashboard
- Objective: Verify that the user dashboard loads inside the user workspace shell.
- Steps: Sign in as a standard user and open `/dashboard`.
- Expected Result: The user sidebar and dashboard shell should render without a not-found state.
- Actual Result: The user dashboard loaded successfully with the correct workspace navigation.
- Status: PASS
- Screenshot Path: `playwright-screenshots/user-dashboard.png`

### T06 – Technician Dashboard
- Objective: Confirm that the technician dashboard route loads with the technician shell.
- Steps: Sign in as technician and open `/technician`.
- Expected Result: The technician workspace, role-specific sidebar, and topbar should appear.
- Actual Result: The technician operations dashboard loaded correctly and displayed the technician navigation.
- Status: PASS
- Screenshot Path: `playwright-screenshots/technician-dashboard.png`

### T07 – Notification Dropdown
- Objective: Validate the in-app notification bell and dropdown interaction.
- Steps: Sign in as user, click the topbar notification bell, and inspect the dropdown panel.
- Expected Result: The dropdown should open and show either notifications or a valid empty/loading state.
- Actual Result: The dropdown opened successfully and displayed the notification panel state correctly.
- Status: PASS
- Screenshot Path: `playwright-screenshots/notification-dropdown.png`

### T08 – User Notifications Page
- Objective: Verify the dedicated notifications page for end users.
- Steps: Sign in as user and open `/notifications`.
- Expected Result: The page should render the notification feed and tab controls.
- Actual Result: The page loaded with the notifications heading and the expected tab filters.
- Status: PASS
- Screenshot Path: `playwright-screenshots/notifications-page.png`

### T09 – Admin Targeted Notifications Page
- Objective: Confirm that the admin communication surface for targeted notifications is available.
- Steps: Sign in as admin and open `/admin/communication/targeted-notifications`.
- Expected Result: The page should render the targeted notifications header and creation action.
- Actual Result: The admin targeted notifications page loaded successfully with the add-notification action.
- Status: PASS
- Screenshot Path: `playwright-screenshots/admin-notifications-page.png`

### T10 – Resource Management Page
- Objective: Validate the admin resource management module.
- Steps: Sign in as admin, open `/admin/resources/facilities`, and trigger the new resource form.
- Expected Result: The page should show filters, resource controls, and a visible create-resource form.
- Actual Result: The resource portfolio loaded correctly, filters were visible, and the new resource form opened.
- Status: PASS
- Screenshot Path: `playwright-screenshots/resources-page.png`

### T11 – Resource Availability Page
- Objective: Verify the resource availability workflow used before booking.
- Steps: Sign in as user and open `/bookings/availability`.
- Expected Result: The availability page should show the heading and the availability-check action.
- Actual Result: The availability screen loaded successfully with its resource/date selection controls.
- Status: PASS
- Screenshot Path: `playwright-screenshots/availability-page.png`

### T12 – Create Booking Page
- Objective: Validate the booking creation form.
- Steps: Sign in as user and open `/bookings/new`.
- Expected Result: The form should render resource selection, start time, end time, and purpose fields.
- Actual Result: The booking form loaded completely with all primary input controls.
- Status: PASS
- Screenshot Path: `playwright-screenshots/create-booking-page.png`

### T13 – My Bookings Page
- Objective: Confirm that the booking history page loads for authenticated users.
- Steps: Sign in as user and open `/bookings`.
- Expected Result: The page should render the booking list or a valid empty state.
- Actual Result: The page loaded successfully and displayed the expected bookings state.
- Status: PASS
- Screenshot Path: `playwright-screenshots/my-bookings-page.png`

### T14 – Admin Booking Approval Page
- Objective: Validate the booking approval queue for administrators.
- Steps: Sign in as admin and open `/admin/bookings`.
- Expected Result: The booking approval dashboard and booking list should render.
- Actual Result: The admin booking approval page loaded correctly with the queue view.
- Status: PASS
- Screenshot Path: `playwright-screenshots/admin-bookings-page.png`

### T15 – My Tickets Page and Create Form
- Objective: Verify the user ticket module and the create-ticket entry point.
- Steps: Sign in as user, open `/tickets`, and open the create-ticket UI.
- Expected Result: The ticket page should load and the ticket creation form/modal should become visible.
- Actual Result: The ticket page loaded successfully and the create-ticket form opened as expected.
- Status: PASS
- Screenshot Path: `playwright-screenshots/my-tickets-page.png`

### T16 – Admin Ticket Management Page
- Objective: Validate the admin ticket management console.
- Steps: Sign in as admin and open `/admin/tickets`.
- Expected Result: The page should show the manage-tickets view with ticket sections.
- Actual Result: The manage-tickets page loaded successfully with the expected administrative ticket navigation.
- Status: PASS
- Screenshot Path: `playwright-screenshots/manage-tickets-page.png`

### T17 – Technician Ticket Views
- Objective: Confirm the technician ticket workspace routes for assigned, resolved, and withdrawn work.
- Steps: Sign in as technician, then open `/technician/tickets`, `/technician/resolved`, and `/technician/withdrawn`.
- Expected Result: Each technician route should load its dedicated page without navigation failures.
- Actual Result: All three technician ticket views loaded correctly and showed the expected section headings.
- Status: PASS
- Screenshot Path: `playwright-screenshots/technician-tickets-page.png`

### T18 – Landing Page and Public Navigation
- Objective: Validate the public landing page and primary navigation controls.
- Steps: Open `/` and inspect the home, about, contact, and login navigation actions.
- Expected Result: The public landing screen should render with working navigation entry points.
- Actual Result: The landing page loaded successfully and displayed the expected public navigation actions.
- Status: PASS
- Screenshot Path: `playwright-screenshots/landing-page.png`

### T19 – Tablet Layout Smoke Test
- Objective: Confirm that the application remains usable at a tablet-sized viewport.
- Steps: Open the public pages, switch to a tablet viewport, open `/login`, then authenticate and verify the dashboard shell.
- Expected Result: The application should render without layout collapse or fatal runtime errors.
- Actual Result: The application stayed stable at tablet width and the user dashboard loaded successfully. A known transient Google Identity resource `403` warning was treated as third-party auth noise because it did not affect the page flow.
- Status: PASS
- Screenshot Path: `playwright-screenshots/tablet-dashboard.png`

## Screenshots Captured
- `playwright-screenshots/login-page.png`
- `playwright-screenshots/admin-dashboard.png`
- `playwright-screenshots/user-dashboard.png`
- `playwright-screenshots/technician-dashboard.png`
- `playwright-screenshots/notification-dropdown.png`
- `playwright-screenshots/notifications-page.png`
- `playwright-screenshots/admin-notifications-page.png`
- `playwright-screenshots/resources-page.png`
- `playwright-screenshots/availability-page.png`
- `playwright-screenshots/create-booking-page.png`
- `playwright-screenshots/my-bookings-page.png`
- `playwright-screenshots/admin-bookings-page.png`
- `playwright-screenshots/my-tickets-page.png`
- `playwright-screenshots/manage-tickets-page.png`
- `playwright-screenshots/technician-tickets-page.png`
- `playwright-screenshots/landing-page.png`
- `playwright-screenshots/tablet-dashboard.png`

## Issues Found
- No blocking functional failures were found in the executed core workflows.
- The embedded Google Identity widget can emit a transient browser-console `403` resource warning during login-page rendering. It did not block authentication UI visibility, public navigation, or the protected route flows validated by Playwright.
- Failure traces are configured with `trace: retain-on-failure`, but the final successful run produced no failure trace archives.

## Overall Result
The Smart Campus Operations Hub frontend core workflows were successfully validated using Microsoft Playwright.

The final full-suite execution completed with:

- Total Tests Executed: `19`
- Passed: `19`
- Failed: `0`

The generated HTML report is available at `frontend/playwright-report/index.html`.
