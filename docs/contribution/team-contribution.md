# Team Contribution

This section was updated after reviewing the current Smart Campus Operations Hub project, including the frontend pages, components, routes, services, and context files, together with the backend controllers, services, entities, repositories, security configuration, notification modules, and API documentation already present in the repository. The contribution summaries below are aligned with the actual modules and files found in the codebase.

## I. IT23580930 – (Member 4: Notifications + Role Management + OAuth Integration Improvements)

### Frontend Contributions (React)

This member's frontend work is centered on the authentication experience, role-aware access control, Google Sign-In improvements, and the full in-app and targeted notification experience for users and administrators.

#### Components / Files:
- `frontend/src/context/AuthProvider.jsx`
- `frontend/src/components/LoginPanel.jsx`
- `frontend/src/components/GoogleIdentityButton.jsx`
- `frontend/src/pages/SignupPage.jsx`
- `frontend/src/routes/ProtectedRoute.jsx`
- `frontend/src/pages/SystemSettingsPage.jsx`
- `frontend/src/components/notifications/NotificationBell.jsx`
- `frontend/src/pages/NotificationsPage.jsx`
- `frontend/src/pages/admin/AdminNotificationsPage.jsx`
- `frontend/src/pages/ManageSignupRequestsPage.jsx`
- `frontend/src/pages/admin/AdminsAdminPage.jsx`
- `frontend/src/services/authService.js`
- `frontend/src/services/accountService.js`
- `frontend/src/services/notificationApi.js`
- `frontend/src/services/notificationAudienceService.js`
- `frontend/src/services/portalDataService.js`

#### Key Contributions:
- Implemented a staged sign-in and onboarding flow covering credential login, Google Sign-In, approved-signup activation, first-login password change, and two-factor verification.
- Improved OAuth-style identity integration by wiring Google Identity Services on the frontend to the backend Google sign-in and Google signup-session flow.
- Added role-based route protection through `ProtectedRoute.jsx`, ensuring users are redirected into the correct workspace according to their assigned role.
- Built the user notification bell and notifications page with unread counts, mark-as-read actions, and safe console-aware navigation.
- Developed the admin notifications interface for broadcast messages, targeted audiences, sent history, and inbox views.
- Connected frontend settings screens to 2FA options, authenticator setup, and notification preferences.

### Backend Contributions (Spring Boot REST API)

This member's backend contribution is strongly tied to authentication, security, role management, targeted notifications, and email-enabled communication services.

#### APIs / Files:
- `backend/src/main/java/com/example/app/controller/AuthController.java`
- `backend/src/main/java/com/example/app/controller/AccountSecurityController.java`
- `backend/src/main/java/com/example/app/controller/AdminSignupRequestController.java`
- `backend/src/main/java/com/example/app/controller/NotificationController.java`
- `backend/src/main/java/com/example/app/controller/AdminNotificationsController.java`
- `backend/src/main/java/com/example/app/controller/AdminNotificationSettingsController.java`
- `backend/src/main/java/com/example/app/notifications/NotificationApiController.java`
- `backend/src/main/java/com/example/app/notifications/PortalDataController.java`
- `backend/src/main/java/com/example/app/security/SecurityConfig.java`
- `backend/src/main/java/com/example/app/security/GoogleIdentityVerifier.java`
- `backend/src/main/java/com/example/app/service/impl/AuthServiceImpl.java`
- `backend/src/main/java/com/example/app/service/impl/AccountSecurityServiceImpl.java`
- `backend/src/main/java/com/example/app/service/impl/AdminSignupRequestServiceImpl.java`
- `backend/src/main/java/com/example/app/service/impl/NotificationServiceImpl.java`
- `backend/src/main/java/com/example/app/service/impl/NotificationSettingsServiceImpl.java`
- `backend/src/main/java/com/example/app/service/AuthEmailOtpNotifier.java`
- `backend/src/main/java/com/example/app/notifications/NotificationEmailService.java`
- `backend/src/main/java/com/example/app/registration/controller/AdminRegistrationController.java`
- `backend/src/main/java/com/example/app/registration/AdminRegistrationService.java`
- Real APIs such as `POST /api/v1/auth/google`, `POST /api/v1/auth/google/signup-session`, `POST /api/v1/auth/verify-2fa`, `GET /api/v1/account/security-settings`, `GET /api/v1/notifications`, `POST /api/v1/admin/notifications`, `POST /api/v1/notifications/audience`, and `POST /api/v1/notifications/email`

#### Key Contributions:
- Implemented session-based authentication with first-login handling, role-aware approval flow, and two-factor authentication support.
- Added backend Google identity verification to support Google Sign-In and improve the overall OAuth integration path.
- Centralized route protection in `SecurityConfig.java`, covering public onboarding endpoints, role-based access control, and notification permissions.
- Built user notification APIs, admin broadcast APIs, targeted audience resolution, and portal-data backed notification feed handling.
- Integrated email-based notification delivery using `JavaMailSender`, including Gmail SMTP configuration for OTP emails and notification broadcasts.
- Added system settings support for notification channels and security preferences, linking backend behavior to the frontend settings screens.

## II. IT23561670 – (Member 2: Booking Workflow + Conflict Checking)

### Frontend Contributions (React)

This member's frontend work is concentrated on the booking journey from availability checking to request creation, personal booking management, and the administrator approval workflow.

#### Components / Files:
- `frontend/src/pages/CreateBookingPage.jsx`
- `frontend/src/pages/MyBookingsPage.jsx`
- `frontend/src/pages/ResourceAvailabilityPage.jsx`
- `frontend/src/pages/ApproveBookingsPage.jsx`
- `frontend/src/services/bookingService.js`

#### Key Contributions:
- Implemented the booking creation flow and connected it to live resource data instead of mock selections.
- Improved the resource availability screen so users can check time-slot availability before creating a booking.
- Added support for passing selected resource and date details from the availability screen into the booking form.
- Refined the My Bookings screen to show booking status clearly and support cancellation for eligible records.
- Built the administrator booking approval interface with approval, rejection, summaries, and rejection-reason handling.

### Backend Contributions (Spring Boot REST API)

This member's backend work is focused on the booking lifecycle, conflict detection, availability responses, and the approval and rejection logic used by the booking workflow.

#### APIs / Files:
- `backend/src/main/java/com/example/app/controller/BookingController.java`
- `backend/src/main/java/com/example/app/controller/AdminBookingController.java`
- `backend/src/main/java/com/example/app/service/BookingService.java`
- `backend/src/main/java/com/example/app/service/BookingServiceImpl.java`
- `backend/src/main/java/com/example/app/repository/BookingRepository.java`
- `backend/src/main/java/com/example/app/entity/Booking.java`
- `backend/src/main/java/com/example/app/entity/BookingStatus.java`
- `backend/src/main/java/com/example/app/dto/BookingRequest.java`
- `backend/src/main/java/com/example/app/dto/BookingResponse.java`
- `backend/src/main/java/com/example/app/dto/BookingAvailabilityResponse.java`
- `backend/src/main/java/com/example/app/exception/BookingConflictException.java`
- Real APIs such as `POST /api/v1/bookings`, `GET /api/v1/bookings/me`, `GET /api/v1/bookings/check`, `PUT /api/v1/bookings/{id}/approve`, `PUT /api/v1/bookings/{id}/reject`, `GET /api/v1/admin/bookings`, and `PATCH /api/v1/admin/bookings/{bookingId}/reject`

#### Key Contributions:
- Implemented booking creation, booking retrieval, cancellation, approval, and rejection across both user and admin flows.
- Added conflict-checking logic to prevent overlapping reservations and to return clear availability responses for selected time ranges.
- Structured the booking lifecycle with meaningful states such as pending, approved, rejected, and cancelled.
- Added rejection-reason support so declined bookings are explained rather than silently rejected.
- Connected the admin queue endpoints and summary endpoints required by the booking approval dashboard.

## III. IT23585744 – (Member 1: Facilities Catalogue + Resource Management Endpoints)

### Frontend Contributions (React)

This member's frontend contribution is centered on the facilities catalogue and resource management experience used by administrators to maintain campus resources.

#### Components / Files:
- `frontend/src/pages/ManageResourcesPage.jsx`
- `frontend/src/services/resourceService.js`

#### Key Contributions:
- Built the main resource management page used to create, edit, filter, and remove campus resources from the facilities catalogue.
- Connected the resource UI to the live backend resource endpoints for real CRUD operations.
- Added filtering support for resource type, location, and capacity to make the facilities catalogue easier to manage.
- Implemented availability-window editing so each facility can carry its own usable weekly schedule.

### Backend Contributions (Spring Boot REST API)

This member's backend work is focused on the resource catalogue, resource CRUD operations, filtering behavior, and availability-window validation for campus facilities.

#### APIs / Files:
- `backend/src/main/java/com/example/app/controller/ResourceController.java`
- `backend/src/main/java/com/example/app/service/ResourceService.java`
- `backend/src/main/java/com/example/app/service/ResourceServiceImpl.java`
- `backend/src/main/java/com/example/app/repository/ResourceRepository.java`
- `backend/src/main/java/com/example/app/entity/Resource.java`
- `backend/src/main/java/com/example/app/entity/AvailabilityWindow.java`
- `backend/src/main/java/com/example/app/entity/ResourceType.java`
- `backend/src/main/java/com/example/app/entity/ResourceStatus.java`
- `backend/src/main/java/com/example/app/dto/ResourceRequest.java`
- `backend/src/main/java/com/example/app/dto/ResourceResponse.java`
- `backend/src/main/java/com/example/app/exception/ResourceNotFoundException.java`
- Real APIs such as `POST /api/v1/resources`, `GET /api/v1/resources`, `GET /api/v1/resources/{id}`, `PUT /api/v1/resources/{id}`, `DELETE /api/v1/resources/{id}`, and `GET /api/v1/resources/{id}/availability`

#### Key Contributions:
- Implemented the facilities catalogue backend with full resource CRUD operations.
- Added filtering support for resource type, status, minimum capacity, and location so administrators can search the resource collection effectively.
- Added weekly availability-window validation to block duplicate, overlapping, or invalid schedules.
- Structured the resource endpoint layer so availability information can also be reused by the booking workflow.
- Helped establish a clean resource portfolio model covering facility name, type, capacity, location, and operational status.

## IV. IT23569522 – (Member 3: Incident Tickets + Attachments + Technician Updates)

### Frontend Contributions (React)

This member's frontend contribution is concentrated on incident ticket handling, attachment workflows, and the technician-facing workspace used to accept, process, and complete assigned work.

#### Components / Files:
- `frontend/src/pages/MyTicketsPage.jsx`
- `frontend/src/pages/ManageTicketsPage.jsx`
- `frontend/src/pages/TechnicianDashboardPage.jsx`
- `frontend/src/pages/technician/TechnicianTicketsPage.jsx`
- `frontend/src/pages/technician/TechnicianTicketWorkspacePage.jsx`
- `frontend/src/pages/technician/TechnicianTicketAcceptPage.jsx`
- `frontend/src/pages/technician/TechnicianTicketRejectPage.jsx`
- `frontend/src/pages/technician/TechnicianResolvedTicketsPage.jsx`
- `frontend/src/pages/technician/TechnicianWithdrawnTicketsPage.jsx`
- `frontend/src/components/technician/TechnicianTicketModalWorkPanel.jsx`
- `frontend/src/components/technician/TechnicianRejectAssignmentModal.jsx`
- `frontend/src/components/AdminCategoriesPanel.jsx`
- `frontend/src/components/AdminTechniciansPanel.jsx`
- `frontend/src/services/ticketService.js`
- `frontend/src/services/categoryService.js`
- `frontend/src/utils/ticketPdfExport.js`
- `frontend/src/utils/withdrawalReason.js`

#### Key Contributions:
- Built the incident ticket screens for ticket creation, editing, filtering, withdrawal, and user-side ticket tracking.
- Added attachment and evidence handling, including preview support and resolved-ticket PDF export.
- Implemented the technician work experience for ticket acceptance, assignment rejection, progress updates, and resolution.
- Added dedicated screens for resolved tickets, withdrawn tickets, and active technician work queues.
- Supported admin-side ticket triage together with category and technician management panels.

### Backend Contributions (Spring Boot REST API)

This member's backend work is centered on the incident ticket lifecycle, attachments, technician assignment handling, updates posted by technicians, and withdrawn-ticket tracking.

#### APIs / Files:
- `backend/src/main/java/com/example/app/controller/TicketController.java`
- `backend/src/main/java/com/example/app/controller/AdminTechnicianController.java`
- `backend/src/main/java/com/example/app/controller/CategoryController.java`
- `backend/src/main/java/com/example/app/controller/SuggestionController.java`
- `backend/src/main/java/com/example/app/service/TicketServiceImpl.java`
- `backend/src/main/java/com/example/app/service/CategoryServiceImpl.java`
- `backend/src/main/java/com/example/app/service/SuggestionServiceImpl.java`
- `backend/src/main/java/com/example/app/service/impl/AdminTechnicianServiceImpl.java`
- `backend/src/main/java/com/example/app/repository/TicketRepository.java`
- `backend/src/main/java/com/example/app/repository/WithdrawnTicketRepository.java`
- `backend/src/main/java/com/example/app/entity/Ticket.java`
- `backend/src/main/java/com/example/app/entity/TicketUpdate.java`
- `backend/src/main/java/com/example/app/entity/Attachment.java`
- `backend/src/main/java/com/example/app/entity/WithdrawnTicketRecord.java`
- Real APIs such as `POST /api/v1/tickets`, `PATCH /api/v1/tickets/{id}`, `POST /api/v1/tickets/{id}/assign`, `POST /api/v1/tickets/{id}/assignment/accept`, `POST /api/v1/tickets/{id}/assignment/reject`, `POST /api/v1/tickets/{id}/updates`, `POST /api/v1/tickets/{id}/attachments`, `POST /api/v1/tickets/{id}/technician-evidence`, and `POST /api/v1/tickets/{id}/withdraw`

#### Key Contributions:
- Implemented the core incident ticket API covering creation, retrieval, editing, assignment, withdrawal, and status changes.
- Added attachment upload, attachment deletion, download support, and technician evidence handling for field work.
- Built the technician assignment flow so technicians can accept or reject work before moving into the active-resolution stage.
- Added technician progress updates and resolution handling so ticket owners can see work performed against their requests.
- Implemented withdrawn-ticket tracking and history preservation instead of losing cancelled or no-longer-needed requests.
- Supported category and suggestion APIs that improve ticket classification during incident submission.

## Technology Stack Used by Team

- React
- Vite
- React Router
- Axios
- Spring Boot
- Spring Security
- Java
- REST APIs
- MongoDB, with MySQL connector support and H2 used in the backend configuration
- Google OAuth 2.0 / Google Sign-In integration
- Two-Factor Authentication
- Gmail SMTP and `JavaMailSender`
- Role-Based Access Control
- Notification System
