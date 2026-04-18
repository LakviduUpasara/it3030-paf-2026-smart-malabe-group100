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

    Page<BookingResponse> getAllBookings(
            Optional<String> resourceId,
            Optional<String> userId,
            Optional<LocalDate> date,
            Pageable pageable);

    List<BookingResponse> getBookingsByUser(String userId);

    List<BookingResponse> getPendingBookings();

    BookingResponse approveBooking(String bookingId);

    BookingResponse rejectBooking(String bookingId, String reason);

    BookingResponse cancelBooking(String bookingId);

    BookingAvailabilityResponse checkAvailability(String resourceId, LocalDateTime startTime, LocalDateTime endTime);
}
