package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.BookingAvailabilityResponse;
import com.example.app.dto.BookingRequest;
import com.example.app.dto.BookingResponse;
import com.example.app.service.BookingService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /**
     * Create a new booking request.
     * 
     * Sample Request Body:
     * {
     *   "resourceId": 1,
     *   "userId": 101,
     *   "startTime": "2026-04-17T10:00:00",
     *   "endTime": "2026-04-17T11:00:00",
     *   "purpose": "Team Meeting"
     * }
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request) {
        logger.info("Creating booking for resource {} by user {}", request.getResourceId(), request.getUserId());
        BookingResponse booking = bookingService.createBooking(request);
        logger.info("Booking created successfully with ID {}", booking.getId());
        return ApiResponse.success("Booking created successfully", booking);
    }

    /**
     * Get all bookings with optional filters.
     * Query Parameters: resourceId, userId, date, page (default 0), size (default 20)
     */
    @GetMapping
    public ApiResponse<Page<BookingResponse>> getAllBookings(
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").descending());
        logger.info("Fetching bookings - resourceId: {}, userId: {}, date: {}", resourceId, userId, date);
        
        Page<BookingResponse> bookings = bookingService.getAllBookings(
                java.util.Optional.ofNullable(resourceId),
                java.util.Optional.ofNullable(userId),
                java.util.Optional.ofNullable(date),
                pageable);
        
        return ApiResponse.success("Bookings retrieved successfully", bookings);
    }

    /**
     * Get all bookings for a specific user.
     */
    @GetMapping("/user/{userId}")
    public ApiResponse<java.util.List<BookingResponse>> getBookingsByUser(@PathVariable Long userId) {
        logger.info("Fetching bookings for user {}", userId);
        java.util.List<BookingResponse> bookings = bookingService.getBookingsByUser(userId);
        return ApiResponse.success("User bookings retrieved successfully", bookings);
    }

    /**
     * Approve a pending booking (Admin action).
     */
    @PutMapping("/{id}/approve")
    public ApiResponse<BookingResponse> approveBooking(@PathVariable Long id) {
        logger.info("Approving booking with ID {}", id);
        BookingResponse booking = bookingService.approveBooking(id);
        logger.info("Booking {} approved successfully", id);
        return ApiResponse.success("Booking approved successfully", booking);
    }

    /**
     * Reject a pending booking (Admin action).
     */
    @PutMapping("/{id}/reject")
    public ApiResponse<BookingResponse> rejectBooking(@PathVariable Long id) {
        logger.info("Rejecting booking with ID {}", id);
        BookingResponse booking = bookingService.rejectBooking(id);
        logger.info("Booking {} rejected successfully", id);
        return ApiResponse.success("Booking rejected successfully", booking);
    }

    /**
     * Cancel an approved booking.
     */
    @PutMapping("/{id}/cancel")
    public ApiResponse<BookingResponse> cancelBooking(@PathVariable Long id) {
        logger.info("Cancelling booking with ID {}", id);
        BookingResponse booking = bookingService.cancelBooking(id);
        logger.info("Booking {} cancelled successfully", id);
        return ApiResponse.success("Booking cancelled successfully", booking);
    }

    /**
     * Check if a resource is available for a time slot.
     * 
     * Query Parameters: resourceId, start, end (ISO DateTime format)
     */
    @GetMapping("/check")
    public ApiResponse<BookingAvailabilityResponse> checkAvailability(
            @RequestParam Long resourceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        System.out.println("=== AVAILABILITY CHECK REQUEST ===");
        System.out.println("RESOURCE ID: " + resourceId);
        System.out.println("START: " + start);
        System.out.println("END: " + end);
        logger.info("Checking availability for resource {} from {} to {}", resourceId, start, end);
        BookingAvailabilityResponse availability = bookingService.checkAvailability(resourceId, start, end);
        System.out.println("RESPONSE: " + availability.isAvailable() + " - " + availability.getMessage());
        return ApiResponse.success("Availability checked", availability);
    }
}
