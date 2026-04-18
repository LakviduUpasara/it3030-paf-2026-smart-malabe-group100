package com.example.app.service;

import com.example.app.dto.BookingAvailabilityResponse;
import com.example.app.dto.BookingRequest;
import com.example.app.dto.BookingResponse;
import com.example.app.entity.Booking;
import com.example.app.entity.BookingStatus;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.exception.BookingConflictException;
import com.example.app.exception.NotFoundException;
import com.example.app.repository.BookingRepository;
import com.example.app.repository.ResourceRepository;
import com.example.app.repository.UserAccountRepository;
import com.example.app.security.AuthenticatedUser;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final Logger logger = LoggerFactory.getLogger(BookingServiceImpl.class);

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request, AuthenticatedUser creator) {
        if (creator == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to create a booking.");
        }
        request.setUserId(creator.getUserId());

        logger.info(
                "Creating booking: resourceId={}, userId={}, startTime={}, endTime={}",
                request.getResourceId(),
                request.getUserId(),
                request.getStartTime(),
                request.getEndTime());

        validateBookingRequest(request.getStartTime(), request.getEndTime());
        rejectConflict(request.getResourceId(), request.getStartTime(), request.getEndTime());

        Booking booking = new Booking();
        booking.setResourceId(request.getResourceId());
        booking.setUserId(request.getUserId());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose().trim());
        booking.setStatus(BookingStatus.PENDING);
        booking.setExpectedAttendees(
                request.getExpectedAttendees() == null ? 0 : Math.max(0, request.getExpectedAttendees()));

        Booking saved = bookingRepository.save(booking);
        logger.info("Booking created with ID: {}", saved.getId());
        return mapToResponse(saved, true);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getAllBookings(
            Optional<Long> resourceId,
            Optional<String> userId,
            Optional<LocalDate> date,
            Pageable pageable,
            boolean enrich) {
        Specification<Booking> specification = Specification.where(null);

        if (resourceId.isPresent()) {
            specification =
                    specification.and((root, query, criteriaBuilder) ->
                            criteriaBuilder.equal(root.get("resourceId"), resourceId.get()));
        }

        if (userId.isPresent()) {
            specification =
                    specification.and((root, query, criteriaBuilder) ->
                            criteriaBuilder.equal(root.get("userId"), userId.get()));
        }

        if (date.isPresent()) {
            LocalDateTime startOfDay = date.get().atStartOfDay();
            LocalDateTime endOfDay = date.get().atTime(LocalTime.MAX);
            specification =
                    specification.and((root, query, criteriaBuilder) ->
                            criteriaBuilder.and(
                                    criteriaBuilder.lessThan(root.get("startTime"), endOfDay),
                                    criteriaBuilder.greaterThan(root.get("endTime"), startOfDay)));
        }

        return bookingRepository
                .findAll(specification, pageable)
                .map(b -> mapToResponse(b, enrich));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByUser(String userId, boolean enrich) {
        return bookingRepository.findByUserIdOrderByStartTimeDesc(userId).stream()
                .map(b -> mapToResponse(b, enrich))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getPendingBookings() {
        return bookingRepository.findByStatusOrderByStartTimeAsc(BookingStatus.PENDING).stream()
                .map(b -> mapToResponse(b, true))
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
        return mapToResponse(booking, true);
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
        return mapToResponse(booking, true);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long bookingId, AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to cancel a booking.");
        }
        logger.info("Cancelling booking ID: {}", bookingId);
        Booking booking = findBookingOrThrow(bookingId);
        if (!canManageAllBookings(user) && !booking.getUserId().equals(user.getUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only cancel your own bookings.");
        }
        if (booking.getStatus() != BookingStatus.APPROVED) {
            logger.warn("Cannot cancel booking {} - status is {}", bookingId, booking.getStatus());
            throw new IllegalArgumentException("Only approved bookings can be cancelled.");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        logger.info("Booking {} cancelled successfully", bookingId);
        return mapToResponse(booking, true);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingAvailabilityResponse checkAvailability(Long resourceId, LocalDateTime startTime, LocalDateTime endTime) {
        validateAvailabilityRequest(startTime, endTime);

        boolean isAvailable =
                !bookingRepository.existsApprovedBookingConflict(
                        resourceId, BookingStatus.APPROVED, startTime, endTime);

        String message =
                isAvailable
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

    private static boolean canManageAllBookings(AuthenticatedUser user) {
        Role r = user.getRole();
        return r == Role.ADMIN || r == Role.MANAGER || r == Role.LOST_ITEM_ADMIN;
    }

    private BookingResponse mapToResponse(Booking booking, boolean enrich) {
        BookingResponse response = new BookingResponse();
        response.setId(booking.getId());
        response.setResourceId(booking.getResourceId());
        response.setUserId(booking.getUserId());
        response.setStartTime(booking.getStartTime());
        response.setEndTime(booking.getEndTime());
        response.setPurpose(booking.getPurpose());
        response.setStatus(booking.getStatus());
        response.setCreatedAt(booking.getCreatedAt());
        response.setRejectionReason(booking.getRejectionReason());
        response.setExpectedAttendees(booking.getExpectedAttendees());

        if (enrich) {
            resourceRepository
                    .findById(booking.getResourceId())
                    .ifPresent(res -> response.setResourceName(res.getName()));
            Optional<UserAccount> account = userAccountRepository.findById(booking.getUserId());
            account.ifPresent(
                    u -> {
                        response.setRequesterName(u.getFullName());
                        response.setRequesterEmail(u.getEmail());
                    });
        }
        return response;
    }

    private Booking findBookingOrThrow(Long bookingId) {
        return bookingRepository
                .findById(bookingId)
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
        boolean conflictExists =
                bookingRepository.existsApprovedBookingConflict(
                        resourceId, BookingStatus.APPROVED, startTime, endTime);
        if (conflictExists) {
            logger.warn(
                    "Booking conflict detected for resourceId={}, startTime={}, endTime={}",
                    resourceId,
                    startTime,
                    endTime);
            throw new BookingConflictException(
                    "The requested time slot overlaps with an existing approved booking for this resource.");
        }
    }

    private void validateAvailabilityRequest(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            logger.warn("Availability check validation failed: null times provided");
            throw new IllegalArgumentException("startTime and endTime are required.");
        }
        if (!startTime.isBefore(endTime)) {
            logger.warn(
                    "Availability check validation failed: startTime {} is not before endTime {}",
                    startTime,
                    endTime);
            throw new IllegalArgumentException("startTime must be before endTime.");
        }
    }
}
