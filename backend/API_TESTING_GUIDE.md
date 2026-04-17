# Smart Campus Backend API - Testing Guide

## Base URL
```
http://localhost:8081/api
```

## Endpoints Overview

### 1. Health Check
```
GET /v1/health
```
**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "UP",
    "service": "Smart Campus Backend",
    "version": "1.0.0"
  },
  "timestamp": "2026-04-16T11:30:00"
}
```

---

## BOOKING ENDPOINTS

### 2. Create Booking
```
POST /bookings
Content-Type: application/json
```

**Request Body:**
```json
{
  "resourceId": 1,
  "userId": 101,
  "startTime": "2026-04-20T10:00:00",
  "endTime": "2026-04-20T11:00:00",
  "purpose": "Team Meeting"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 4,
    "resourceId": 1,
    "userId": 101,
    "startTime": "2026-04-20T10:00:00",
    "endTime": "2026-04-20T11:00:00",
    "purpose": "Team Meeting",
    "status": "PENDING",
    "createdAt": "2026-04-16T11:30:00"
  },
  "timestamp": "2026-04-16T11:30:00"
}
```

**Conflict Error Response (409):**
```json
{
  "success": false,
  "message": "The requested time slot overlaps with an existing approved booking for this resource.",
  "data": null,
  "timestamp": "2026-04-16T11:30:00"
}
```

---

### 3. Get All Bookings (with filters)
```
GET /bookings?page=0&size=20&resourceId=1&userId=101&date=2026-04-17
```

**Query Parameters:**
- `page` (optional, default: 0) - Page number for pagination
- `size` (optional, default: 20) - Number of records per page
- `resourceId` (optional) - Filter by resource ID
- `userId` (optional) - Filter by user ID
- `date` (optional, format: YYYY-MM-DD) - Filter by date

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "data": {
    "content": [
      {
        "id": 1,
        "resourceId": 1,
        "userId": 101,
        "startTime": "2026-04-17T10:00:00",
        "endTime": "2026-04-17T11:00:00",
        "purpose": "Team Meeting",
        "status": "APPROVED",
        "createdAt": "2026-04-16T10:00:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": {
        "empty": false,
        "sorted": true
      }
    },
    "totalElements": 1,
    "totalPages": 1
  },
  "timestamp": "2026-04-16T11:30:00"
}
```

---

### 4. Get User's Bookings
```
GET /bookings/user/{userId}
```

**Example:** `GET /bookings/user/101`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User bookings retrieved successfully",
  "data": [
    {
      "id": 1,
      "resourceId": 1,
      "userId": 101,
      "startTime": "2026-04-17T10:00:00",
      "endTime": "2026-04-17T11:00:00",
      "purpose": "Team Meeting",
      "status": "APPROVED",
      "createdAt": "2026-04-16T10:00:00"
    }
  ],
  "timestamp": "2026-04-16T11:30:00"
}
```

---

### 5. Approve Booking
```
PUT /bookings/{id}/approve
```

**Example:** `PUT /bookings/2/approve`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking approved successfully",
  "data": {
    "id": 2,
    "resourceId": 2,
    "userId": 102,
    "startTime": "2026-04-18T14:00:00",
    "endTime": "2026-04-18T15:30:00",
    "purpose": "Project Discussion",
    "status": "APPROVED",
    "createdAt": "2026-04-16T10:00:00"
  },
  "timestamp": "2026-04-16T11:30:00"
}
```

---

### 6. Reject Booking
```
PUT /bookings/{id}/reject
```

**Example:** `PUT /bookings/2/reject`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking rejected successfully",
  "data": {
    "id": 2,
    "resourceId": 2,
    "userId": 102,
    "startTime": "2026-04-18T14:00:00",
    "endTime": "2026-04-18T15:30:00",
    "purpose": "Project Discussion",
    "status": "REJECTED",
    "createdAt": "2026-04-16T10:00:00"
  },
  "timestamp": "2026-04-16T11:30:00"
}
```

---

### 7. Cancel Booking
```
PUT /bookings/{id}/cancel
```

**Example:** `PUT /bookings/1/cancel`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "id": 1,
    "resourceId": 1,
    "userId": 101,
    "startTime": "2026-04-17T10:00:00",
    "endTime": "2026-04-17T11:00:00",
    "purpose": "Team Meeting",
    "status": "CANCELLED",
    "createdAt": "2026-04-16T10:00:00"
  },
  "timestamp": "2026-04-16T11:30:00"
}
```

---

### 8. Check Availability
```
GET /bookings/check?resourceId=1&start=2026-04-20T09:00:00&end=2026-04-20T10:00:00
```

**Query Parameters:**
- `resourceId` (required) - Resource ID to check
- `start` (required, format: ISO DateTime) - Start time
- `end` (required, format: ISO DateTime) - End time

**Response (200 OK) - Available:**
```json
{
  "success": true,
  "message": "Availability checked",
  "data": {
    "resourceId": 1,
    "startTime": "2026-04-20T09:00:00",
    "endTime": "2026-04-20T10:00:00",
    "available": true,
    "message": "Resource is available for the requested time range."
  },
  "timestamp": "2026-04-16T11:30:00"
}
```

**Response (200 OK) - Not Available:**
```json
{
  "success": true,
  "message": "Availability checked",
  "data": {
    "resourceId": 1,
    "startTime": "2026-04-17T10:30:00",
    "endTime": "2026-04-17T11:30:00",
    "available": false,
    "message": "Resource is not available because an approved booking overlaps."
  },
  "timestamp": "2026-04-16T11:30:00"
}
```

---

## CAMPUS MESSAGE ENDPOINTS

### 9. Create Campus Message
```
POST /v1/messages
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "System Maintenance",
  "content": "The system will be under maintenance on 2026-04-25 from 22:00 to 23:00 UTC."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Message created successfully",
  "data": {
    "id": 3,
    "title": "System Maintenance",
    "content": "The system will be under maintenance on 2026-04-25 from 22:00 to 23:00 UTC.",
    "createdAt": "2026-04-16T11:30:00"
  },
  "timestamp": "2026-04-16T11:30:00"
}
```

---

### 10. Get All Campus Messages
```
GET /v1/messages
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Welcome to Smart Campus",
      "content": "Welcome to the Smart Campus Operations Hub. Use this system to manage your bookings effectively.",
      "createdAt": "2026-04-16T10:00:00"
    },
    {
      "id": 2,
      "title": "Maintenance Notice",
      "content": "The system will undergo maintenance on 2026-04-25 from 22:00 to 23:00.",
      "createdAt": "2026-04-16T10:00:00"
    }
  ],
  "timestamp": "2026-04-16T11:30:00"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "startTime must be before endTime.",
  "timestamp": "2026-04-16T11:30:00"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Booking not found with id 999",
  "timestamp": "2026-04-16T11:30:00"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "The requested time slot overlaps with an existing approved booking for this resource.",
  "timestamp": "2026-04-16T11:30:00"
}
```

---

## BOOKING STATUS VALUES
- `PENDING` - Awaiting approval
- `APPROVED` - Approved and confirmed
- `REJECTED` - Rejected by admin
- `CANCELLED` - Cancelled by user

## KEY FEATURES

1. **Conflict Detection**: Only APPROVED bookings block time slots
2. **Validation**: 
   - Start time must be before end time
   - Cannot book in the past
   - All required fields must be provided
3. **Pagination**: Booking list supports pagination (default: 20 items per page)
4. **Filtering**: Filter bookings by resourceId, userId, or date
5. **Consistent Response Format**: All endpoints return standardized ApiResponse

## TESTING WITH POSTMAN

1. Import the endpoints into Postman
2. Use the base URL: `http://localhost:8081/api`
3. Test the health endpoint first: `GET /v1/health`
4. Create sample bookings and messages
5. Test conflict detection by trying to book overlapping times
6. Approve/reject/cancel bookings to see status changes
