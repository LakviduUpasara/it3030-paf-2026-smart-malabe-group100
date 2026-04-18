package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.BookingAvailabilityResponse;
import com.example.app.dto.BookingRequest;
import com.example.app.dto.BookingResponse;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.security.AuthenticatedUser;
import com.example.app.service.BookingService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

    private static void requireCampusManager(AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in again.");
        }
        Role r = user.getRole();
        if (r != Role.ADMIN && r != Role.MANAGER && r != Role.LOST_ITEM_ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only administrators can perform this action.");
        }
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingResponse> createBooking(
            @AuthenticationPrincipal AuthenticatedUser user, @Valid @RequestBody BookingRequest request) {
        logger.info("Create booking for resource {}", request.getResourceId());
        BookingResponse booking = bookingService.createBooking(request, user);
        return ApiResponse.success("Booking created successfully", booking);
    }

    @GetMapping("/me")
    public ApiResponse<List<BookingResponse>> myBookings(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to view your bookings.");
        }
        List<BookingResponse> list = bookingService.getBookingsByUser(user.getUserId(), true);
        return ApiResponse.success("Bookings retrieved successfully", list);
    }

    @GetMapping("/pending")
    public ApiResponse<List<BookingResponse>> pendingBookings(@AuthenticationPrincipal AuthenticatedUser user) {
        requireCampusManager(user);
        return ApiResponse.success("Pending bookings retrieved successfully", bookingService.getPendingBookings());
    }

    @GetMapping
    public ApiResponse<Page<BookingResponse>> getAllBookings(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireCampusManager(user);
        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").descending());
        Page<BookingResponse> bookings =
                bookingService.getAllBookings(
                        Optional.ofNullable(resourceId),
                        Optional.ofNullable(userId),
                        Optional.ofNullable(date),
                        pageable,
                        true);
        return ApiResponse.success("Bookings retrieved successfully", bookings);
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<BookingResponse>> getBookingsByUserPath(
            @AuthenticationPrincipal AuthenticatedUser user, @PathVariable String userId) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in again.");
        }
        if (!user.getUserId().equals(userId)
                && user.getRole() != Role.ADMIN
                && user.getRole() != Role.MANAGER
                && user.getRole() != Role.LOST_ITEM_ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only list your own bookings.");
        }
        List<BookingResponse> bookings = bookingService.getBookingsByUser(userId, true);
        return ApiResponse.success("User bookings retrieved successfully", bookings);
    }

    @PutMapping("/{id}/approve")
    public ApiResponse<BookingResponse> approveBooking(
            @AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        requireCampusManager(user);
        BookingResponse booking = bookingService.approveBooking(id);
        return ApiResponse.success("Booking approved successfully", booking);
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<BookingResponse> rejectBooking(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        requireCampusManager(user);
        String reason = body.get("reason");
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection reason is required.");
        }
        BookingResponse booking = bookingService.rejectBooking(id, reason);
        return ApiResponse.success("Booking rejected successfully", booking);
    }

    @PutMapping("/{id}/cancel")
    public ApiResponse<BookingResponse> cancelBooking(
            @AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        BookingResponse booking = bookingService.cancelBooking(id, user);
        return ApiResponse.success("Booking cancelled successfully", booking);
    }

    @GetMapping("/check")
    public ApiResponse<BookingAvailabilityResponse> checkAvailability(
            @RequestParam Long resourceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        BookingAvailabilityResponse availability = bookingService.checkAvailability(resourceId, start, end);
        return ApiResponse.success("Availability checked", availability);
    }
}
