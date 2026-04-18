package com.example.app.service;

import com.example.app.dto.BookingAvailabilityResponse;
import com.example.app.dto.BookingRequest;
import com.example.app.dto.BookingResponse;
import com.example.app.security.AuthenticatedUser;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookingService {

    BookingResponse createBooking(BookingRequest request, AuthenticatedUser creator);

    Page<BookingResponse> getAllBookings(
            Optional<Long> resourceId,
            Optional<String> userId,
            Optional<LocalDate> date,
            Pageable pageable,
            boolean enrich);

    List<BookingResponse> getBookingsByUser(String userId, boolean enrich);

    List<BookingResponse> getPendingBookings();

    BookingResponse approveBooking(Long bookingId);

    BookingResponse rejectBooking(Long bookingId, String reason);

    BookingResponse cancelBooking(Long bookingId, AuthenticatedUser user);

    BookingAvailabilityResponse checkAvailability(Long resourceId, LocalDateTime startTime, LocalDateTime endTime);
}
