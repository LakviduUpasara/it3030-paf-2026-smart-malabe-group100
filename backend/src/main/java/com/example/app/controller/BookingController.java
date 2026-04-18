package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.BookingAvailabilityResponse;
import com.example.app.dto.BookingRequest;
import com.example.app.dto.BookingResponse;
import com.example.app.exception.ApiException;
import com.example.app.security.AuthenticatedUser;
import com.example.app.service.BookingService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);

    private final BookingService bookingService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request) {
        logger.info("Creating booking for resource {} by user {}", request.getResourceId(), request.getUserId());
        BookingResponse booking = bookingService.createBooking(request);
        logger.info("Booking created successfully with ID {}", booking.getId());
        return ApiResponse.success("Booking created successfully", booking);
    }

    /**
     * Bookings for the signed-in user (Mongo {@code user_accounts} id).
     */
    @GetMapping("/me")
    public ApiResponse<List<BookingResponse>> getMyBookings(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        List<BookingResponse> list = bookingService.getBookingsByUser(principal.getUserId());
        return ApiResponse.success("Bookings retrieved successfully", list);
    }

    /**
     * Pending approvals (admin queue).
     */
    @GetMapping("/pending")
    public ApiResponse<List<BookingResponse>> getPendingBookings() {
        List<BookingResponse> pending = bookingService.getPendingBookings();
        return ApiResponse.success("Pending bookings retrieved successfully", pending);
    }

    /**
     * Check if a resource is available for a time slot.
     */
    @GetMapping("/check")
    public ApiResponse<BookingAvailabilityResponse> checkAvailability(
            @RequestParam String resourceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        logger.info("Checking availability for resource {} from {} to {}", resourceId, start, end);
        BookingAvailabilityResponse availability = bookingService.checkAvailability(resourceId, start, end);
        return ApiResponse.success("Availability checked", availability);
    }

    /**
     * Get all bookings with optional filters.
     */
    @GetMapping
    public ApiResponse<Page<BookingResponse>> getAllBookings(
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String userId,
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

    @GetMapping("/user/{userId}")
    public ApiResponse<List<BookingResponse>> getBookingsByUser(@PathVariable String userId) {
        logger.info("Fetching bookings for user {}", userId);
        List<BookingResponse> bookings = bookingService.getBookingsByUser(userId);
        return ApiResponse.success("User bookings retrieved successfully", bookings);
    }

    @PutMapping("/{id}/approve")
    public ApiResponse<BookingResponse> approveBooking(@PathVariable String id) {
        logger.info("Approving booking with ID {}", id);
        BookingResponse booking = bookingService.approveBooking(id);
        logger.info("Booking {} approved successfully", id);
        return ApiResponse.success("Booking approved successfully", booking);
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<BookingResponse> rejectBooking(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String reason = body.get("reason");
        if (reason == null || reason.trim().isEmpty()) {
            logger.warn("Rejection failed: missing or empty reason for booking {}", id);
            throw new IllegalArgumentException("Rejection reason is required.");
        }
        logger.info("Rejecting booking with ID {} - reason: {}", id, reason);
        BookingResponse booking = bookingService.rejectBooking(id, reason);
        logger.info("Booking {} rejected successfully", id);
        return ApiResponse.success("Booking rejected successfully", booking);
    }

    @PutMapping("/{id}/cancel")
    public ApiResponse<BookingResponse> cancelBooking(@PathVariable String id) {
        logger.info("Cancelling booking with ID {}", id);
        BookingResponse booking = bookingService.cancelBooking(id);
        logger.info("Booking {} cancelled successfully", id);
        return ApiResponse.success("Booking cancelled successfully", booking);
    }
}
