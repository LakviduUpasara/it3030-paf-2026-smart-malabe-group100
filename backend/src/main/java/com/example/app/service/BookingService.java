package com.example.app.service;

import com.example.app.dto.BookingAvailabilityResponse;
import com.example.app.dto.BookingRequest;
import com.example.app.dto.BookingResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookingService {

    BookingResponse createBooking(BookingRequest request);

    Page<BookingResponse> getAllBookings(Optional<Long> resourceId, Optional<Long> userId, Optional<LocalDate> date, Pageable pageable);

    List<BookingResponse> getBookingsByUser(Long userId);

    BookingResponse approveBooking(Long bookingId);

    BookingResponse rejectBooking(Long bookingId, String reason);

    BookingResponse cancelBooking(Long bookingId);

    BookingAvailabilityResponse checkAvailability(Long resourceId, LocalDateTime startTime, LocalDateTime endTime);
}
