package com.example.app.service;

import com.example.app.dto.BookingAvailabilityResponse;
import com.example.app.dto.BookingRequest;
import com.example.app.dto.BookingResponse;
import com.example.app.entity.Booking;
import com.example.app.entity.BookingStatus;
import com.example.app.exception.BookingConflictException;
import com.example.app.exception.NotFoundException;
import com.example.app.repository.BookingRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final Logger logger = LoggerFactory.getLogger(BookingServiceImpl.class);

    private final BookingRepository bookingRepository;

    public BookingServiceImpl(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        System.out.println("=== CREATE BOOKING START ===");
        System.out.println("Resource ID: " + request.getResourceId());
        System.out.println("User ID: " + request.getUserId());
        System.out.println("Start Time: " + request.getStartTime());
        System.out.println("End Time: " + request.getEndTime());
        System.out.println("Purpose: " + request.getPurpose());
        
        logger.info("Creating booking: resourceId={}, userId={}, startTime={}, endTime={}", 
                request.getResourceId(), request.getUserId(), request.getStartTime(), request.getEndTime());
        
        validateBookingRequest(request.getStartTime(), request.getEndTime());
        System.out.println("[STEP 1] ✓ Validation passed");
        
        rejectConflict(request.getResourceId(), request.getStartTime(), request.getEndTime());
        System.out.println("[STEP 2] ✓ Conflict check passed");

        Booking booking = new Booking();
        booking.setResourceId(request.getResourceId());
        booking.setUserId(request.getUserId());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setStatus(BookingStatus.PENDING);

        Booking saved = bookingRepository.save(booking);
        System.out.println("[STEP 3] ✓ Booking saved with ID: " + saved.getId());
        System.out.println("=== CREATE BOOKING SUCCESS ===");
        logger.info("Booking created with ID: {}", saved.getId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getAllBookings(Optional<Long> resourceId,
                                                Optional<Long> userId,
                                                Optional<LocalDate> date,
                                                Pageable pageable) {
        Specification<Booking> specification = Specification.where(null);

        if (resourceId.isPresent()) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("resourceId"), resourceId.get()));
        }

        if (userId.isPresent()) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("userId"), userId.get()));
        }

        if (date.isPresent()) {
            LocalDateTime startOfDay = date.get().atStartOfDay();
            LocalDateTime endOfDay = date.get().atTime(LocalTime.MAX);
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.and(
                            criteriaBuilder.lessThan(root.get("startTime"), endOfDay),
                            criteriaBuilder.greaterThan(root.get("endTime"), startOfDay)
                    ));
        }

        return bookingRepository.findAll(specification, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserIdOrderByStartTimeDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingResponse approveBooking(Long bookingId) {
        logger.info("Approving booking ID: {}", bookingId);
        Booking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            logger.warn("Cannot approve booking {} - status is {}", bookingId, booking.getStatus());
            throw new IllegalArgumentException("Only pending bookings can be approved.");
        }
        rejectConflict(booking.getResourceId(), booking.getStartTime(), booking.getEndTime());
        booking.setStatus(BookingStatus.APPROVED);
        bookingRepository.save(booking);
        logger.info("Booking {} approved successfully", bookingId);
        return mapToResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse rejectBooking(Long bookingId) {
        logger.info("Rejecting booking ID: {}", bookingId);
        Booking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            logger.warn("Cannot reject booking {} - status is {}", bookingId, booking.getStatus());
            throw new IllegalArgumentException("Only pending bookings can be rejected.");
        }
        booking.setStatus(BookingStatus.REJECTED);
        bookingRepository.save(booking);
        logger.info("Booking {} rejected successfully", bookingId);
        return mapToResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long bookingId) {
        logger.info("Cancelling booking ID: {}", bookingId);
        Booking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.APPROVED) {
            logger.warn("Cannot cancel booking {} - status is {}", bookingId, booking.getStatus());
            throw new IllegalArgumentException("Only approved bookings can be cancelled.");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        logger.info("Booking {} cancelled successfully", bookingId);
        return mapToResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingAvailabilityResponse checkAvailability(Long resourceId, LocalDateTime startTime, LocalDateTime endTime) {
        try {
            System.out.println("[SERVICE] Checking availability - resourceId: " + resourceId + ", start: " + startTime + ", end: " + endTime);
            
            validateAvailabilityRequest(startTime, endTime);
            
            boolean isAvailable = !bookingRepository.existsApprovedBookingConflict(resourceId,
                    BookingStatus.APPROVED,
                    startTime,
                    endTime);

            System.out.println("[SERVICE] Query result: isAvailable=" + isAvailable);
            
            String message = isAvailable ? "Resource is available for the requested time range." : "Resource is not available because an approved booking overlaps.";
            BookingAvailabilityResponse response = new BookingAvailabilityResponse();
            response.setResourceId(resourceId);
            response.setStartTime(startTime);
            response.setEndTime(endTime);
            response.setAvailable(isAvailable);
            response.setMessage(message);
            
            System.out.println("[SERVICE] Returning response: available=" + response.isAvailable());
            return response;
        } catch (Exception e) {
            System.out.println("[SERVICE] Error checking availability: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    private BookingResponse mapToResponse(Booking booking) {
        BookingResponse response = new BookingResponse();
        response.setId(booking.getId());
        response.setResourceId(booking.getResourceId());
        response.setUserId(booking.getUserId());
        response.setStartTime(booking.getStartTime());
        response.setEndTime(booking.getEndTime());
        response.setPurpose(booking.getPurpose());
        response.setStatus(booking.getStatus());
        response.setCreatedAt(booking.getCreatedAt());
        return response;
    }

    private Booking findBookingOrThrow(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found with id " + bookingId));
    }

    private void validateBookingRequest(LocalDateTime startTime, LocalDateTime endTime) {
        System.out.println("  [VALIDATION] startTime: " + startTime + ", endTime: " + endTime);
        if (startTime == null || endTime == null) {
            logger.warn("Booking validation failed: null times provided");
            System.out.println("  [VALIDATION] ✗ FAILED: null times");
            throw new IllegalArgumentException("startTime and endTime are required.");
        }
        if (!startTime.isBefore(endTime)) {
            logger.warn("Booking validation failed: startTime {} is not before endTime {}", startTime, endTime);
            System.out.println("  [VALIDATION] ✗ FAILED: start is not before end");
            throw new IllegalArgumentException("startTime must be before endTime.");
        }
        LocalDateTime now = LocalDateTime.now();
        System.out.println("  [VALIDATION] Now: " + now);
        if (startTime.isBefore(now) || endTime.isBefore(now)) {
            logger.warn("Booking validation failed: times are in the past");
            System.out.println("  [VALIDATION] ✗ FAILED: times in past. Start before now? " + startTime.isBefore(now) + ", End before now? " + endTime.isBefore(now));
            throw new IllegalArgumentException("Bookings cannot be created in the past.");
        }
        System.out.println("  [VALIDATION] ✓ PASSED");
    }

    private void rejectConflict(Long resourceId, LocalDateTime startTime, LocalDateTime endTime) {
        System.out.println("  [CONFLICT CHECK] Checking resource " + resourceId + " from " + startTime + " to " + endTime);
        boolean conflictExists = bookingRepository.existsApprovedBookingConflict(resourceId,
                BookingStatus.APPROVED,
                startTime,
                endTime);
        System.out.println("  [CONFLICT CHECK] Result: " + (conflictExists ? "CONFLICT EXISTS" : "NO CONFLICT"));
        if (conflictExists) {
            logger.warn("Booking conflict detected for resourceId={}, startTime={}, endTime={}", resourceId, startTime, endTime);
            throw new BookingConflictException("The requested time slot overlaps with an existing approved booking for this resource.");
        }
    }

    private void validateAvailabilityRequest(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            logger.warn("Availability check validation failed: null times provided");
            throw new IllegalArgumentException("startTime and endTime are required.");
        }
        if (!startTime.isBefore(endTime)) {
            logger.warn("Availability check validation failed: startTime {} is not before endTime {}", startTime, endTime);
            throw new IllegalArgumentException("startTime must be before endTime.");
        }
    }
}
