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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final Logger logger = LoggerFactory.getLogger(BookingServiceImpl.class);
    private static final String BOOKING_SEQUENCE_NAME = "bookings_sequence";

    private final BookingRepository bookingRepository;
    private final SequenceGeneratorService sequenceGeneratorService;
    private final MongoTemplate mongoTemplate;

    public BookingServiceImpl(BookingRepository bookingRepository,
                              SequenceGeneratorService sequenceGeneratorService,
                              MongoTemplate mongoTemplate) {
        this.bookingRepository = bookingRepository;
        this.sequenceGeneratorService = sequenceGeneratorService;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        logger.info("Creating booking: resourceId={}, userId={}, startTime={}, endTime={}",
                request.getResourceId(), request.getUserId(), request.getStartTime(), request.getEndTime());

        validateBookingRequest(request.getStartTime(), request.getEndTime());
        rejectConflict(request.getResourceId(), request.getStartTime(), request.getEndTime());

        Booking booking = new Booking();
        booking.setId(generateEntityId(BOOKING_SEQUENCE_NAME));
        booking.setResourceId(request.getResourceId());
        booking.setUserId(request.getUserId());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setStatus(BookingStatus.PENDING);
        booking.applyDefaults();

        Booking saved = bookingRepository.save(booking);
        logger.info("Booking created with ID: {}", saved.getId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getAllBookings(Optional<Long> resourceId,
                                                Optional<Long> userId,
                                                Optional<LocalDate> date,
                                                Pageable pageable) {
        Query query = new Query();
        List<Criteria> filters = new ArrayList<>();

        resourceId.ifPresent(id -> filters.add(Criteria.where("resourceId").is(id)));
        userId.ifPresent(id -> filters.add(Criteria.where("userId").is(id)));

        if (date.isPresent()) {
            LocalDateTime startOfDay = date.orElseThrow().atStartOfDay();
            LocalDateTime endOfDay = date.orElseThrow().atTime(LocalTime.MAX);
            filters.add(new Criteria().andOperator(
                    Criteria.where("startTime").lt(endOfDay),
                    Criteria.where("endTime").gt(startOfDay)
            ));
        }

        if (!filters.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(filters.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(query, Booking.class);
        query.with(pageable);

        List<BookingResponse> content = mongoTemplate.find(query, Booking.class).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, total);
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
    public BookingResponse rejectBooking(Long bookingId, String reason) {
        logger.info("Rejecting booking ID: {} with reason: {}", bookingId, reason);

        if (reason == null || reason.trim().isEmpty()) {
            logger.warn("Rejection failed: reason is null or empty for booking {}", bookingId);
            throw new IllegalArgumentException("Rejection reason is required.");
        }

        Booking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            logger.warn("Cannot reject booking {} - status is {}", bookingId, booking.getStatus());
            throw new IllegalArgumentException("Only pending bookings can be rejected.");
        }
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason.trim());
        bookingRepository.save(booking);
        logger.info("Booking {} rejected successfully with reason: {}", bookingId, reason);
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
        validateAvailabilityRequest(startTime, endTime);

        boolean isAvailable = !bookingRepository.existsByResourceIdAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                resourceId,
                BookingStatus.APPROVED,
                endTime,
                startTime);

        String message = isAvailable
                ? "Resource is available for the requested time range."
                : "Resource is not available because an approved booking overlaps.";

        BookingAvailabilityResponse response = new BookingAvailabilityResponse();
        response.setResourceId(resourceId);
        response.setStartTime(startTime);
        response.setEndTime(endTime);
        response.setAvailable(isAvailable);
        response.setMessage(message);
        return response;
    }

    private BookingResponse mapToResponse(Booking booking) {
        BookingResponse response = new BookingResponse();
        response.setId(toResponseId(booking.getId()));
        response.setResourceId(booking.getResourceId());
        response.setUserId(booking.getUserId());
        response.setStartTime(booking.getStartTime());
        response.setEndTime(booking.getEndTime());
        response.setPurpose(booking.getPurpose());
        response.setStatus(booking.getStatus());
        response.setCreatedAt(booking.getCreatedAt());
        response.setRejectionReason(booking.getRejectionReason());
        return response;
    }

    private Booking findBookingOrThrow(Long bookingId) {
        return bookingRepository.findById(toEntityId(bookingId))
                .orElseThrow(() -> new NotFoundException("Booking not found with id " + bookingId));
    }

    private void validateBookingRequest(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            logger.warn("Booking validation failed: null times provided");
            throw new IllegalArgumentException("startTime and endTime are required.");
        }
        if (!startTime.isBefore(endTime)) {
            logger.warn("Booking validation failed: startTime {} is not before endTime {}", startTime, endTime);
            throw new IllegalArgumentException("startTime must be before endTime.");
        }
        LocalDateTime now = LocalDateTime.now();
        if (startTime.isBefore(now) || endTime.isBefore(now)) {
            logger.warn("Booking validation failed: times are in the past");
            throw new IllegalArgumentException("Bookings cannot be created in the past.");
        }
    }

    private void rejectConflict(Long resourceId, LocalDateTime startTime, LocalDateTime endTime) {
        boolean conflictExists = bookingRepository.existsByResourceIdAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                resourceId,
                BookingStatus.APPROVED,
                endTime,
                startTime);

        if (conflictExists) {
            logger.warn("Booking conflict detected for resourceId={}, startTime={}, endTime={}",
                    resourceId, startTime, endTime);
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

    private String generateEntityId(String sequenceName) {
        return String.valueOf(sequenceGeneratorService.generateSequence(sequenceName));
    }

    private String toEntityId(Long id) {
        return String.valueOf(id);
    }

    private Long toResponseId(String id) {
        try {
            return Long.valueOf(id);
        } catch (NumberFormatException e) {
            throw new IllegalStateException("Stored booking id is not numeric: " + id, e);
        }
    }
}
