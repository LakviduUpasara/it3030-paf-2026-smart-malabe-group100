package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.BookingResponse;
import com.example.app.dto.admin.AdminBookingRowResponse;
import com.example.app.dto.admin.AdminBookingSummaryResponse;
import com.example.app.dto.admin.BookingRejectRequest;
import com.example.app.entity.BookingStatus;
import com.example.app.exception.ApiException;
import com.example.app.service.BookingService;
import jakarta.validation.Valid;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.example.app.security.AuthenticatedUser;

/**
 * Platform administrator booking queue (MongoDB). Secured to {@code ROLE_ADMIN} via
 * {@code /api/v1/admin/**} in {@link com.example.app.security.SecurityConfig}.
 */
@RestController
@RequestMapping("/api/v1/admin/bookings")
@RequiredArgsConstructor
public class AdminBookingController {

    private final BookingService bookingService;

    @GetMapping("/summary")
    public ApiResponse<AdminBookingSummaryResponse> summary(@AuthenticationPrincipal AuthenticatedUser user) {
        requireAdmin(user);
        return ApiResponse.success("Booking summary loaded", bookingService.getAdminBookingSummary());
    }

    @GetMapping
    public ApiResponse<Page<AdminBookingRowResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        requireAdmin(user);
        if (size > 200) {
            size = 200;
        }
        Optional<BookingStatus> statusFilter = parseStatus(status);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startTime"));
        Page<AdminBookingRowResponse> result = bookingService.getAdminBookings(statusFilter, pageable);
        return ApiResponse.success("Bookings retrieved", result);
    }

    @PatchMapping("/{bookingId}/approve")
    public ApiResponse<BookingResponse> approve(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable String bookingId
    ) {
        requireAdmin(user);
        BookingResponse updated = bookingService.approveBooking(bookingId);
        return ApiResponse.success("Booking approved", updated);
    }

    @PatchMapping("/{bookingId}/reject")
    public ApiResponse<BookingResponse> reject(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable String bookingId,
            @Valid @RequestBody BookingRejectRequest body
    ) {
        requireAdmin(user);
        BookingResponse updated = bookingService.rejectBooking(bookingId, body.getReason());
        return ApiResponse.success("Booking rejected", updated);
    }

    private static void requireAdmin(AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
    }

    private static Optional<BookingStatus> parseStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(BookingStatus.valueOf(raw.trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid status filter: " + raw);
        }
    }
}
