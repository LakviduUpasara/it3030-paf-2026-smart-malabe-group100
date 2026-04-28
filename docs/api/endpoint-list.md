# Smart Campus Operations Hub - API Endpoint List

## Base URL
`http://localhost:8080`

## Authentication & Onboarding
| Method | Endpoint | Controller | Description | Access |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | AuthController | Submit a new signup request. | Public |
| POST | `/api/v1/auth/login` | AuthController | Sign in with email and password. | Public |
| POST | `/api/v1/auth/google/signup-session` | AuthController | Create a Google signup session. | Public |
| POST | `/api/v1/auth/google` | AuthController | Sign in with Google credentials. | Public |
| POST | `/api/v1/auth/apple` | AuthController | Sign in with Apple credentials. | Public |
| POST | `/api/v1/auth/dev-login` | AuthController | Developer shortcut sign-in. | Public |
| POST | `/api/v1/auth/verify-2fa` | AuthController | Complete two-factor verification. | Public |
| POST | `/api/v1/auth/resend-email-otp` | AuthController | Resend email OTP for a pending sign-in. | Public |
| POST | `/api/v1/auth/first-login/change-password` | AuthController | Complete first-login password change. | Authenticated |
| POST | `/api/v1/auth/first-login/select-2fa-method` | AuthController | Choose a first-login 2FA method. | Authenticated |
| POST | `/api/v1/auth/logout` | AuthController | Invalidate the current bearer token if present. | Public |
| GET | `/api/v1/auth/signup-requests/{requestId}/status` | AuthController | Check signup request approval status. | Public |
| POST | `/api/v1/auth/signup-requests/{requestId}/activate` | AuthController | Activate an approved signup request. | Public |
| GET | `/api/v1/auth/signup-requests/{requestId}/activate` | AuthController | Browser-compatible activation alias. | Public |
| GET | `/api/v1/admin/signup-requests` | AdminSignupRequestController | List pending signup requests. | ADMIN |
| POST | `/api/v1/admin/signup-requests/{requestId}/approve` | AdminSignupRequestController | Approve a pending signup request. | ADMIN |
| POST | `/api/v1/admin/signup-requests/{requestId}/reject` | AdminSignupRequestController | Reject a pending signup request. | ADMIN |

## Users & Profile
| Method | Endpoint | Controller | Description | Access |
|---|---|---|---|---|
| GET | `/api/v1/auth/me` | AuthController | Load current session details. | Authenticated |
| GET | `/api/v1/account/security-settings` | AccountSecurityController | Get account security settings. | Authenticated |
| PUT | `/api/v1/account/security-settings` | AccountSecurityController | Update account security settings. | Authenticated |
| POST | `/api/v1/account/security-settings/authenticator/start` | AccountSecurityController | Start authenticator app enrollment. | Authenticated |
| POST | `/api/v1/account/security-settings/authenticator/verify` | AccountSecurityController | Verify authenticator app enrollment. | Authenticated |
| POST | `/api/v1/account/security-settings/authenticator/reset` | AccountSecurityController | Reset authenticator app enrollment. | Authenticated |
| POST | `/api/v1/account/google-2fa-prompt/dismiss` | AccountSecurityController | Dismiss the Google 2FA prompt. | Authenticated |
| GET | `/api/v1/admins` | AdminRegistrationController | List admin directory entries. | ADMIN |
| POST | `/api/v1/admins` | AdminRegistrationController | Create an admin directory entry. | ADMIN |
| GET | `/api/v1/admins/{id}` | AdminRegistrationController | Get an admin user by ID. | ADMIN |
| PUT | `/api/v1/admins/{id}` | AdminRegistrationController | Update an admin user. | ADMIN |
| DELETE | `/api/v1/admins/{id}` | AdminRegistrationController | Delete an admin user. | ADMIN |
| GET | `/api/v1/admin/technicians` | AdminTechnicianController | List technician accounts. | ADMIN |
| POST | `/api/v1/admin/technicians` | AdminTechnicianController | Create a technician account. | ADMIN |
| PUT | `/api/v1/admin/technicians/{id}` | AdminTechnicianController | Update a technician account. | ADMIN |
| DELETE | `/api/v1/admin/technicians/{id}` | AdminTechnicianController | Delete a technician account. | ADMIN |
| GET | `/api/v1/students` | StudentRegistrationController | List students. | ADMIN |
| POST | `/api/v1/students` | StudentRegistrationController | Create a student record. | ADMIN |
| PUT | `/api/v1/students/{id}` | StudentRegistrationController | Update a student record. | ADMIN |
| DELETE | `/api/v1/students/{id}` | StudentRegistrationController | Delete a student record. | ADMIN |
| GET | `/api/v1/lecturers` | LecturerRegistrationController | List lecturers. | ADMIN |
| POST | `/api/v1/lecturers` | LecturerRegistrationController | Create a lecturer record. | ADMIN |
| PUT | `/api/v1/lecturers/{id}` | LecturerRegistrationController | Update a lecturer record. | ADMIN |
| DELETE | `/api/v1/lecturers/{id}` | LecturerRegistrationController | Delete a lecturer record. | ADMIN |
| GET | `/api/v1/lab-assistants` | LabAssistantRegistrationController | List lab assistants. | ADMIN |
| POST | `/api/v1/lab-assistants` | LabAssistantRegistrationController | Create a lab assistant record. | ADMIN |
| PUT | `/api/v1/lab-assistants/{id}` | LabAssistantRegistrationController | Update a lab assistant record. | ADMIN |
| DELETE | `/api/v1/lab-assistants/{id}` | LabAssistantRegistrationController | Delete a lab assistant record. | ADMIN |

## Resources & Facilities
| Method | Endpoint | Controller | Description | Access |
|---|---|---|---|---|
| POST | `/api/v1/resources` | ResourceController | Create a campus resource. | ADMIN |
| GET | `/api/v1/resources` | ResourceController | List resources with optional filters. | Authenticated |
| GET | `/api/v1/resources/{id}` | ResourceController | Get a resource by ID. | Authenticated |
| PUT | `/api/v1/resources/{id}` | ResourceController | Update a resource. | ADMIN |
| DELETE | `/api/v1/resources/{id}` | ResourceController | Delete a resource. | ADMIN |

## Resource Availability
| Method | Endpoint | Controller | Description | Access |
|---|---|---|---|---|
| GET | `/api/v1/resources/{id}/availability` | ResourceController | Check availability for a specific resource. | Authenticated |
| GET | `/api/v1/bookings/check` | BookingController | Check booking availability for a time slot. | Authenticated |

## Booking Management
| Method | Endpoint | Controller | Description | Access |
|---|---|---|---|---|
| POST | `/api/v1/bookings` | BookingController | Create a booking request. | Authenticated |
| GET | `/api/v1/bookings/me` | BookingController | List bookings for the current user. | USER |
| GET | `/api/v1/bookings` | BookingController | List bookings with optional filters. | Authenticated |
| GET | `/api/v1/bookings/user/{userId}` | BookingController | List bookings for a specific user ID. | Authenticated |
| GET | `/api/v1/bookings/pending` | BookingController | List pending booking approvals. | ADMIN |
| PUT | `/api/v1/bookings/{id}/approve` | BookingController | Approve a booking request. Legacy admin route. | ADMIN |
| PUT | `/api/v1/bookings/{id}/reject` | BookingController | Reject a booking request. Legacy admin route. | ADMIN |
| PUT | `/api/v1/bookings/{id}/cancel` | BookingController | Cancel an approved booking. | Authenticated |
| GET | `/api/v1/admin/bookings/summary` | AdminBookingController | Get booking approval summary totals. | ADMIN |
| GET | `/api/v1/admin/bookings` | AdminBookingController | List the admin booking queue. | ADMIN |
| PATCH | `/api/v1/admin/bookings/{bookingId}/approve` | AdminBookingController | Approve a booking request. | ADMIN |
| PATCH | `/api/v1/admin/bookings/{bookingId}/reject` | AdminBookingController | Reject a booking request. | ADMIN |

## Ticket & Incident Management
| Method | Endpoint | Controller | Description | Access |
|---|---|---|---|---|
| POST | `/api/v1/tickets/suggestions` | SuggestionController | Suggest ticket categories from a description. | Authenticated |
| POST | `/api/v1/tickets` | TicketController | Submit a new ticket. | Authenticated |
| POST | `/api/v1/tickets/with-categories` | TicketController | Submit a new ticket. Compatibility alias. | Authenticated |
| GET | `/api/v1/tickets` | TicketController | List tickets visible to the current user. | Authenticated |
| GET | `/api/v1/tickets/{id}` | TicketController | Get a ticket visible to the current user. | Authenticated |
| GET | `/api/v1/admin/tickets` | AdminTicketDeskController | List all incident tickets for the admin desk. | ADMIN |
| GET | `/api/v1/admin/tickets/assignable-technicians` | AdminTicketDeskController | List technicians available for assignment. | ADMIN |
| PATCH | `/api/v1/admin/tickets/{ticketId}/assignment` | AdminTicketDeskController | Assign a technician from the admin desk. | ADMIN |
| POST | `/api/v1/tickets/{id}/assign` | TicketController | Assign a technician to a ticket. Legacy route. | ADMIN |
| PATCH | `/api/v1/tickets/{id}/assign-technician` | TicketController | Assign a technician to a ticket. | ADMIN |
| PATCH | `/api/v1/tickets/{id}/reassign-technician` | TicketController | Reassign a technician on a ticket. | ADMIN |
| PATCH | `/api/v1/tickets/{id}` | TicketController | Update a ticket submitted by the current user. | USER |
| POST | `/api/v1/tickets/{id}/withdraw` | TicketController | Withdraw a ticket with a reason. | USER |
| PATCH | `/api/v1/tickets/{id}/withdraw` | TicketController | Withdraw a ticket. PATCH alias. | USER |
| POST | `/api/v1/tickets/{id}/attachments` | TicketController | Upload a requester attachment to a ticket. | Authenticated |
| DELETE | `/api/v1/tickets/{ticketId}/attachments/{attachmentId}` | TicketController | Remove a requester attachment from a ticket. | Authenticated |
| GET | `/api/v1/tickets/{ticketId}/attachments/{attachmentId}` | TicketController | Download a ticket attachment. | Authenticated |

## Technician Actions
| Method | Endpoint | Controller | Description | Access |
|---|---|---|---|---|
| GET | `/api/v1/technician/tickets` | TechnicianTicketController | List tickets assigned to the current technician. | TECHNICIAN |
| GET | `/api/v1/technician/tickets/{ticketId}` | TechnicianTicketController | Get a technician-visible ticket. | TECHNICIAN |
| PATCH | `/api/v1/technician/tickets/{ticketId}/status` | TechnicianTicketController | Update technician ticket status. | TECHNICIAN |
| POST | `/api/v1/technician/tickets/{ticketId}/progress-notes` | TechnicianTicketController | Add a technician progress note. | TECHNICIAN |
| PATCH | `/api/v1/technician/tickets/{ticketId}/resolution-notes` | TechnicianTicketController | Update technician resolution notes. | TECHNICIAN |
| POST | `/api/v1/technician/tickets/{ticketId}/actions/resolve` | TechnicianTicketController | Resolve a technician-assigned ticket. | TECHNICIAN |
| POST | `/api/v1/tickets/{id}/assignment/accept` | TicketController | Accept a ticket assignment. | TECHNICIAN |
| PATCH | `/api/v1/tickets/{id}/assignment/accept` | TicketController | Accept a ticket assignment. PATCH alias. | TECHNICIAN |
| POST | `/api/v1/tickets/{id}/assignment/reject` | TicketController | Reject a ticket assignment. | TECHNICIAN |
| PATCH | `/api/v1/tickets/{id}/assignment/reject` | TicketController | Reject a ticket assignment. PATCH alias. | TECHNICIAN |
| PUT | `/api/v1/tickets/{id}/status` | TicketController | Update ticket status as admin or assigned technician. | ADMIN / TECHNICIAN |
| POST | `/api/v1/tickets/{id}/updates` | TicketController | Add a work update to a ticket. | TECHNICIAN |
| PATCH | `/api/v1/tickets/{ticketId}/updates/{updateId}` | TicketController | Edit a work update on a ticket. | TECHNICIAN |
| DELETE | `/api/v1/tickets/{ticketId}/updates/{updateId}` | TicketController | Delete a work update from a ticket. | TECHNICIAN |
| POST | `/api/v1/tickets/{id}/technician-evidence` | TicketController | Upload technician evidence. | TECHNICIAN |
| DELETE | `/api/v1/tickets/{ticketId}/technician-evidence/{attachmentId}` | TicketController | Delete technician evidence. | TECHNICIAN |
| PUT | `/api/v1/tickets/{ticketId}/technician-evidence/{attachmentId}` | TicketController | Replace technician evidence. | TECHNICIAN |

## Notifications
| Method | Endpoint | Controller | Description | Access |
|---|---|---|---|---|
| GET | `/api/v1/notifications` | NotificationController | List the current user's notifications. | Authenticated |
| GET | `/api/v1/notifications/unread-count` | NotificationController | Get unread notification count. | Authenticated |
| PATCH | `/api/v1/notifications/{id}/read` | NotificationController | Mark a notification as read. | Authenticated |
| PATCH | `/api/v1/notifications/read-all` | NotificationController | Mark all notifications as read. | Authenticated |
| DELETE | `/api/v1/notifications/{id}` | NotificationController | Delete a notification. | Authenticated |
| GET | `/api/v1/technician/notifications` | TechnicianNotificationController | Load technician notification summary. | TECHNICIAN |
| POST | `/api/v1/technician/notifications/mark-read` | TechnicianNotificationController | Mark technician notifications as read. | TECHNICIAN |
| POST | `/api/v1/notifications/audience` | NotificationApiController | Resolve recipients for a notification audience. | ADMIN |
| POST | `/api/v1/notifications/email` | NotificationApiController | Send a notification email broadcast. | ADMIN |
| POST | `/api/v1/admin/notifications` | AdminNotificationsController | Send a manual admin broadcast. | ADMIN |
| GET | `/api/v1/admin/notifications/history` | AdminNotificationsController | View notification broadcast history. | ADMIN |

## Admin / Communication
| Method | Endpoint | Controller | Description | Access |
|---|---|---|---|---|
| GET | `/api/v1/messages` | CampusMessageController | List campus messages. | Authenticated |
| POST | `/api/v1/messages` | CampusMessageController | Create a campus message. | Authenticated |
| GET | `/api/v1/portal-data/{key}` | PortalDataController | Get portal data by key. | Unknown |
| PUT | `/api/v1/portal-data/{key}` | PortalDataController | Upsert portal data by key. | ADMIN |

## Settings
| Method | Endpoint | Controller | Description | Access |
|---|---|---|---|---|
| GET | `/api/v1/admin/notification-settings` | AdminNotificationSettingsController | Get notification system settings. | ADMIN |
| PUT | `/api/v1/admin/notification-settings` | AdminNotificationSettingsController | Update notification system settings. | ADMIN |
| GET | `/api/v1/categories` | CategoryController | List ticket categories. | Authenticated |
| POST | `/api/v1/categories` | CategoryController | Create a ticket category. | ADMIN |
| PUT | `/api/v1/categories/{id}` | CategoryController | Update a ticket category. | ADMIN |
| DELETE | `/api/v1/categories/{id}` | CategoryController | Delete a ticket category. | ADMIN |
| GET | `/api/v1/categories/{id}/subcategories` | CategoryController | List subcategories for a category. | Authenticated |
| POST | `/api/v1/subcategories` | CategoryController | Create a ticket subcategory. | ADMIN |
| GET | `/api/v1/faculties` | FacultyController | List faculties. | Public |
| POST | `/api/v1/faculties` | FacultyController | Create a faculty. | ADMIN |
| PUT | `/api/v1/faculties/{code}` | FacultyController | Update a faculty. | ADMIN |
| DELETE | `/api/v1/faculties/{code}` | FacultyController | Delete a faculty. | ADMIN |
| GET | `/api/v1/degree-programs` | LmsDegreeProgramController | List LMS degree programs. | Public |
| POST | `/api/v1/degree-programs` | LmsDegreeProgramController | Create an LMS degree program. | ADMIN |
| PUT | `/api/v1/degree-programs/{code}` | LmsDegreeProgramController | Update an LMS degree program. | ADMIN |
| DELETE | `/api/v1/degree-programs/{code}` | LmsDegreeProgramController | Delete an LMS degree program. | ADMIN |
| GET | `/api/v1/catalog/modules/applicable` | CatalogModuleController | List catalog modules applicable to a faculty, degree, and term. | Public |
| GET | `/api/v1/catalog/modules` | CatalogModuleController | List catalog modules. | Public |
| POST | `/api/v1/catalog/modules` | CatalogModuleController | Create a catalog module. | ADMIN |
| PUT | `/api/v1/catalog/modules/{code}` | CatalogModuleController | Update a catalog module. | ADMIN |
| DELETE | `/api/v1/catalog/modules/{code}` | CatalogModuleController | Delete a catalog module. | ADMIN |
| GET | `/api/v1/intakes/dropdown` | IntakeController | List intake options for dropdowns. | Public |
| GET | `/api/v1/intakes` | IntakeController | List intakes. | ADMIN |
| GET | `/api/v1/intakes/{id}/detail` | IntakeController | Get full intake details. | ADMIN |
| GET | `/api/v1/intakes/{id}` | IntakeController | Get minimal intake details. | ADMIN |
| GET | `/api/v1/intakes/{intakeId}/subgroups` | IntakeController | List public intake subgroups. | Public |
| POST | `/api/v1/intakes` | IntakeController | Create an intake. | ADMIN |
| PUT | `/api/v1/intakes/{id}` | IntakeController | Update an intake. | ADMIN |
| DELETE | `/api/v1/intakes/{id}` | IntakeController | Soft-delete an intake. | ADMIN |
| POST | `/api/v1/module-offerings` | LmsModuleOfferingController | Create an LMS module offering. | ADMIN |
| GET | `/api/v1/module-offerings/eligible-lecturers` | LmsModuleOfferingController | List eligible lecturers for a module offering. | ADMIN |
| GET | `/api/v1/module-offerings/eligible-lab-assistants` | LmsModuleOfferingController | List eligible lab assistants for a module offering. | ADMIN |
| GET | `/api/v1/module-offerings` | LmsModuleOfferingController | List LMS module offerings. | ADMIN |
| GET | `/api/v1/module-offerings/{id}` | LmsModuleOfferingController | Get an LMS module offering by ID. | ADMIN |
| PUT | `/api/v1/module-offerings/{id}` | LmsModuleOfferingController | Update an LMS module offering. | ADMIN |
| DELETE | `/api/v1/module-offerings/{id}` | LmsModuleOfferingController | Delete an LMS module offering. | ADMIN |
| POST | `/api/v1/student-groups` | StudentGroupController | Create a student group. | Authenticated |
| GET | `/api/v1/student-groups` | StudentGroupController | List student groups. | Authenticated |
| GET | `/api/v1/student-groups/{id}` | StudentGroupController | Get a student group by ID. | Authenticated |
| PUT | `/api/v1/student-groups/{id}` | StudentGroupController | Update a student group. | Authenticated |
| DELETE | `/api/v1/student-groups/{id}` | StudentGroupController | Delete a student group. | Authenticated |
| POST | `/api/v1/semesters` | SemesterController | Create a semester. | Authenticated |
| GET | `/api/v1/semesters` | SemesterController | List semesters. | Authenticated |
| GET | `/api/v1/semesters/{id}` | SemesterController | Get a semester by ID. | Authenticated |
| PUT | `/api/v1/semesters/{id}` | SemesterController | Update a semester. | Authenticated |
| DELETE | `/api/v1/semesters/{id}` | SemesterController | Delete a semester. | Authenticated |
| POST | `/api/v1/academic-modules` | AcademicModuleController | Create an academic module. | Authenticated |
| GET | `/api/v1/academic-modules` | AcademicModuleController | List academic modules. | Authenticated |
| GET | `/api/v1/academic-modules/{id}` | AcademicModuleController | Get an academic module by ID. | Authenticated |
| PUT | `/api/v1/academic-modules/{id}` | AcademicModuleController | Update an academic module. | Authenticated |
| DELETE | `/api/v1/academic-modules/{id}` | AcademicModuleController | Delete an academic module. | Authenticated |
| POST | `/api/v1/academic-sessions` | AcademicSessionController | Create an academic session. | Authenticated |
| GET | `/api/v1/academic-sessions` | AcademicSessionController | List academic sessions. | Authenticated |
| GET | `/api/v1/academic-sessions/{id}` | AcademicSessionController | Get an academic session by ID. | Authenticated |
| PUT | `/api/v1/academic-sessions/{id}` | AcademicSessionController | Update an academic session. | Authenticated |
| DELETE | `/api/v1/academic-sessions/{id}` | AcademicSessionController | Delete an academic session. | Authenticated |
| POST | `/api/v1/programs` | DegreeProgramController | Create a legacy degree program. | Authenticated |
| GET | `/api/v1/programs` | DegreeProgramController | List legacy degree programs. | Authenticated |
| GET | `/api/v1/programs/{id}` | DegreeProgramController | Get a legacy degree program by ID. | Authenticated |
| PUT | `/api/v1/programs/{id}` | DegreeProgramController | Update a legacy degree program. | Authenticated |
| DELETE | `/api/v1/programs/{id}` | DegreeProgramController | Delete a legacy degree program. | Authenticated |
| POST | `/api/v1/legacy/module-offerings` | LegacyModuleOfferingController | Create a legacy module offering. | Authenticated |
| GET | `/api/v1/legacy/module-offerings` | LegacyModuleOfferingController | List legacy module offerings. | Authenticated |
| GET | `/api/v1/legacy/module-offerings/{id}` | LegacyModuleOfferingController | Get a legacy module offering by ID. | Authenticated |
| PUT | `/api/v1/legacy/module-offerings/{id}` | LegacyModuleOfferingController | Update a legacy module offering. | Authenticated |
| DELETE | `/api/v1/legacy/module-offerings/{id}` | LegacyModuleOfferingController | Delete a legacy module offering. | Authenticated |
| POST | `/api/v1/subgroups/auto-assign` | SubgroupAutoAssignController | Auto-assign subgroups. | ADMIN |

## Health / System
| Method | Endpoint | Controller | Description | Access |
|---|---|---|---|---|
| GET | `/api/v1/health` | HealthController | Get service health status. | Public |
| GET | `/api/health` | HealthController | Compatibility health alias. | Public |

## API Statistics
- Total Endpoints: 182
- Public Endpoints: 20
- Authenticated Endpoints: 64
- Admin Only Endpoints: 74
- Technician Endpoints: 19
- User Endpoints: 4

