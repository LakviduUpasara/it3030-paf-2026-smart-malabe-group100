package com.example.app.service;

import com.example.app.dto.BookingAvailabilityResponse;
import com.example.app.dto.BookingRequest;
import com.example.app.dto.BookingResponse;
import com.example.app.dto.admin.AdminBookingRowResponse;
import com.example.app.dto.admin.AdminBookingSummaryResponse;
import com.example.app.entity.AvailabilityWindow;
import com.example.app.entity.Booking;
import com.example.app.entity.BookingStatus;
import com.example.app.entity.Resource;
import com.example.app.entity.ResourceStatus;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.NotificationCategory;
import com.example.app.entity.enums.NotificationRelatedEntity;
import com.example.app.entity.enums.NotificationType;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.exception.BookingConflictException;
import com.example.app.exception.NotFoundException;
import com.example.app.repository.BookingRepository;
import com.example.app.repository.ResourceRepository;
import com.example.app.repository.UserAccountRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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
    private final MongoTemplate mongoTemplate;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        logger.info("Creating booking: resourceId={}, userId={}, startTime={}, endTime={}",
                request.getResourceId(), request.getUserId(), request.getStartTime(), request.getEndTime());

        validateBookingRequest(request.getStartTime(), request.getEndTime());

        Resource resource = findResourceOrThrow(request.getResourceId());
        ensureResourceAcceptsBooking(resource, request.getStartTime(), request.getEndTime());

        rejectConflict(request.getResourceId(), request.getStartTime(), request.getEndTime());

        LocalDateTime created = LocalDateTime.now();
        Booking booking = Booking.builder()
                .resourceId(request.getResourceId())
                .userId(request.getUserId())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .status(BookingStatus.PENDING)
                .createdAt(created)
                .updatedAt(created)
                .build();

        Booking saved = bookingRepository.save(booking);
        logger.info("Booking created with ID: {}", saved.getId());

        notifyAdminsBookingCreated(saved);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getAllBookings(Optional<String> resourceId,
                                                Optional<String> userId,
                                                Optional<LocalDate> date,
                                                Pageable pageable) {
        Query base = buildBookingFilterQuery(resourceId, userId, date);
        long total = mongoTemplate.count(base, Booking.class);
        base.with(pageable);
        List<Booking> list = mongoTemplate.find(base, Booking.class);
        return new PageImpl<>(list.stream().map(this::mapToResponse).toList(), pageable, total);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByUser(String userId) {
        return bookingRepository.findByUserIdOrderByStartTimeDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getPendingBookings() {
        return bookingRepository.findByStatusOrderByStartTimeAsc(BookingStatus.PENDING).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminBookingSummaryResponse getAdminBookingSummary() {
        return AdminBookingSummaryResponse.builder()
                .totalBookings(bookingRepository.count())
                .approved(bookingRepository.countByStatus(BookingStatus.APPROVED))
                .pending(bookingRepository.countByStatus(BookingStatus.PENDING))
                .rejected(bookingRepository.countByStatus(BookingStatus.REJECTED))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminBookingRowResponse> getAdminBookings(Optional<BookingStatus> status, Pageable pageable) {
        Query query = new Query();
        status.ifPresent(s -> query.addCriteria(Criteria.where("status").is(s)));
        long total = mongoTemplate.count(query, Booking.class);
        query.with(pageable);
        List<Booking> list = mongoTemplate.find(query, Booking.class);
        Map<String, Resource> resourcesById = loadResourcesForBookings(list);
        Map<String, UserAccount> usersById = loadUsersForBookings(list);
        List<AdminBookingRowResponse> rows =
                list.stream().map(b -> mapToAdminRow(b, resourcesById, usersById)).toList();
        return new PageImpl<>(rows, pageable, total);
    }

    @Override
    @Transactional
    public BookingResponse approveBooking(String bookingId) {
        logger.info("Approving booking ID: {}", bookingId);
        Booking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            logger.warn("Cannot approve booking {} - status is {}", bookingId, booking.getStatus());
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only PENDING bookings can be approved. Current status: " + booking.getStatus()
            );
        }
        Resource resource = findResourceOrThrow(booking.getResourceId());
        ensureResourceAcceptsBooking(resource, booking.getStartTime(), booking.getEndTime());
        rejectConflict(booking.getResourceId(), booking.getStartTime(), booking.getEndTime());
        booking.setStatus(BookingStatus.APPROVED);
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);
        logger.info("Booking {} approved successfully", bookingId);

        String resourceName = resource != null ? resource.getName() : booking.getResourceId();
        notificationService.deliver(
                booking.getUserId(),
                NotificationType.BOOKING_APPROVED,
                NotificationCategory.BOOKING,
                "Booking approved",
                "Your booking for " + safe(resourceName) + " has been approved.",
                NotificationRelatedEntity.BOOKING,
                booking.getId(),
                null);

        return mapToResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse rejectBooking(String bookingId, String reason) {
        logger.info("Rejecting booking ID: {} with reason: {}", bookingId, reason);

        if (reason == null || reason.trim().isEmpty()) {
            logger.warn("Rejection failed: reason is null or empty for booking {}", bookingId);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Rejection reason is required.");
        }

        Booking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            logger.warn("Cannot reject booking {} - status is {}", bookingId, booking.getStatus());
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only PENDING bookings can be rejected. Current status: " + booking.getStatus()
            );
        }
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason.trim());
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);
        logger.info("Booking {} rejected successfully with reason: {}", bookingId, reason);

        Resource bookingResource = resourceRepository.findById(booking.getResourceId()).orElse(null);
        String resourceName = bookingResource != null ? bookingResource.getName() : booking.getResourceId();
        notificationService.deliver(
                booking.getUserId(),
                NotificationType.BOOKING_REJECTED,
                NotificationCategory.BOOKING,
                "Booking rejected",
                "Your booking for " + safe(resourceName) + " was rejected. Reason: " + reason.trim(),
                NotificationRelatedEntity.BOOKING,
                booking.getId(),
                null);

        return mapToResponse(booking);
    }

    private void notifyAdminsBookingCreated(Booking booking) {
        try {
            Resource resource = resourceRepository.findById(booking.getResourceId()).orElse(null);
            String resourceName = resource != null ? resource.getName() : booking.getResourceId();
            List<String> admins = userAccountRepository.findByRoleOrderByFullNameAsc(Role.ADMIN).stream()
                    .filter(u -> u.getStatus() == AccountStatus.ACTIVE)
                    .map(UserAccount::getId)
                    .toList();
            notificationService.deliverMany(
                    admins,
                    NotificationType.BOOKING_CREATED,
                    NotificationCategory.BOOKING,
                    "New booking request",
                    "A new booking request for " + safe(resourceName) + " is awaiting approval.",
                    NotificationRelatedEntity.BOOKING,
                    booking.getId(),
                    booking.getUserId());
        } catch (RuntimeException e) {
            logger.warn("Failed to notify admins about new booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    private static String safe(String v) {
        return v == null ? "" : v;
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(String bookingId) {
        logger.info("Cancelling booking ID: {}", bookingId);
        Booking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.APPROVED) {
            logger.warn("Cannot cancel booking {} - status is {}", bookingId, booking.getStatus());
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only APPROVED bookings can be cancelled. Current status: " + booking.getStatus()
            );
        }
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);
        logger.info("Booking {} cancelled successfully", bookingId);
        return mapToResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingAvailabilityResponse checkAvailability(String resourceId, LocalDateTime startTime, LocalDateTime endTime) {
        validateAvailabilityRequest(startTime, endTime);

        Resource resource = findResourceOrThrow(resourceId);

        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            return buildAvailabilityResponse(
                    resourceId,
                    startTime,
                    endTime,
                    false,
                    "OUT_OF_SERVICE",
                    "Unavailable: resource status is OUT_OF_SERVICE in the catalogue.");
        }

        if (!isIntervalWithinAnyWindow(resource, startTime, endTime)) {
            String detail = describeWhyOutsideWindows(resource, startTime, endTime);
            return buildAvailabilityResponse(
                    resourceId,
                    startTime,
                    endTime,
                    false,
                    "OUTSIDE_WEEKLY_WINDOW",
                    "Unavailable: outside weekly catalogue windows. " + detail);
        }

        boolean conflict = bookingRepository.existsByResourceIdAndStatusAndStartTimeBeforeAndEndTimeAfter(
                resourceId, BookingStatus.APPROVED, endTime, startTime);
        if (conflict) {
            return buildAvailabilityResponse(
                    resourceId,
                    startTime,
                    endTime,
                    false,
                    "APPROVED_BOOKING_OVERLAP",
                    "Unavailable: overlaps an existing APPROVED booking for this resource.");
        }
        return buildAvailabilityResponse(
                resourceId,
                startTime,
                endTime,
                true,
                "AVAILABLE",
                "Available: within weekly catalogue hours and no approved booking conflict.");
    }

    private Query buildBookingFilterQuery(Optional<String> resourceId, Optional<String> userId, Optional<LocalDate> date) {
        Query query = new Query();
        resourceId.ifPresent(id -> query.addCriteria(Criteria.where("resourceId").is(id)));
        userId.ifPresent(id -> query.addCriteria(Criteria.where("userId").is(id)));
        if (date.isPresent()) {
            LocalDateTime startOfDay = date.get().atStartOfDay();
            LocalDateTime endOfDay = date.get().atTime(LocalTime.MAX);
            query.addCriteria(Criteria.where("startTime").lt(endOfDay));
            query.addCriteria(Criteria.where("endTime").gt(startOfDay));
        }
        return query;
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
        response.setUpdatedAt(booking.getUpdatedAt());
        response.setRejectionReason(booking.getRejectionReason());
        return response;
    }

    private Map<String, Resource> loadResourcesForBookings(List<Booking> bookings) {
        Set<String> ids = bookings.stream().map(Booking::getResourceId).collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<String, Resource> map = new HashMap<>();
        resourceRepository.findAllById(ids).forEach(r -> map.put(r.getId(), r));
        return map;
    }

    private Map<String, UserAccount> loadUsersForBookings(List<Booking> bookings) {
        Set<String> ids = bookings.stream().map(Booking::getUserId).collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<String, UserAccount> map = new HashMap<>();
        userAccountRepository.findAllById(ids).forEach(u -> map.put(u.getId(), u));
        return map;
    }

    private AdminBookingRowResponse mapToAdminRow(
            Booking booking,
            Map<String, Resource> resourcesById,
            Map<String, UserAccount> usersById
    ) {
        Resource resource = resourcesById.get(booking.getResourceId());
        UserAccount user = usersById.get(booking.getUserId());
        String resourceName = resource != null && resource.getName() != null ? resource.getName() : "—";
        String userEmail = user != null && user.getEmail() != null ? user.getEmail() : "—";
        String userFullName = user != null && user.getFullName() != null ? user.getFullName() : "—";
        return AdminBookingRowResponse.builder()
                .id(booking.getId())
                .resourceId(booking.getResourceId())
                .resourceName(resourceName)
                .userId(booking.getUserId())
                .userEmail(userEmail)
                .userFullName(userFullName)
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .status(booking.getStatus())
                .rejectionReason(booking.getRejectionReason())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    private Booking findBookingOrThrow(String bookingId) {
        return bookingRepository.findById(bookingId)
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

    private void rejectConflict(String resourceId, LocalDateTime startTime, LocalDateTime endTime) {
        boolean conflictExists = bookingRepository.existsByResourceIdAndStatusAndStartTimeBeforeAndEndTimeAfter(
                resourceId,
                BookingStatus.APPROVED,
                endTime,
                startTime);
        if (conflictExists) {
            logger.warn("Booking conflict detected for resourceId={}, startTime={}, endTime={}", resourceId, startTime, endTime);
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
            logger.warn("Availability check validation failed: startTime {} is not before endTime {}", startTime, endTime);
            throw new IllegalArgumentException("startTime must be before endTime.");
        }
        if (!startTime.toLocalDate().equals(endTime.toLocalDate())) {
            throw new IllegalArgumentException("Availability check must be within a single calendar day.");
        }
    }

    private Resource findResourceOrThrow(String resourceId) {
        return resourceRepository.findById(resourceId)
                .orElseThrow(() -> new NotFoundException("Resource not found with id " + resourceId));
    }

    private void ensureResourceAcceptsBooking(Resource resource, LocalDateTime start, LocalDateTime end) {
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This resource is not available for booking.");
        }
        if (!isIntervalWithinAnyWindow(resource, start, end)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Booking time must fall entirely within one of this resource's availability windows."
            );
        }
    }

    private boolean isIntervalWithinAnyWindow(Resource resource, LocalDateTime start, LocalDateTime end) {
        if (resource.getAvailabilityWindows() == null || resource.getAvailabilityWindows().isEmpty()) {
            return false;
        }
        if (!start.toLocalDate().equals(end.toLocalDate())) {
            return false;
        }
        DayOfWeek dow = start.getDayOfWeek();
        LocalTime reqStart = start.toLocalTime();
        LocalTime reqEnd = end.toLocalTime();
        if (!reqStart.isBefore(reqEnd)) {
            return false;
        }
        for (AvailabilityWindow w : resource.getAvailabilityWindows()) {
            if (w.getDayOfWeek() != dow || w.getStartTime() == null || w.getEndTime() == null) {
                continue;
            }
            if (!w.getStartTime().isAfter(reqStart) && !w.getEndTime().isBefore(reqEnd)) {
                return true;
            }
        }
        return false;
    }

    private String describeWhyOutsideWindows(Resource resource, LocalDateTime start, LocalDateTime end) {
        List<AvailabilityWindow> wins = resource.getAvailabilityWindows();
        if (wins == null || wins.isEmpty()) {
            return "No weekly windows are configured for this resource.";
        }
        DayOfWeek dow = start.getDayOfWeek();
        LocalDate date = start.toLocalDate();
        LocalTime rs = start.toLocalTime();
        LocalTime re = end.toLocalTime();
        String fullCatalogue = wins.stream()
                .map(w -> w.getDayOfWeek() + " " + w.getStartTime() + "-" + w.getEndTime())
                .collect(Collectors.joining("; "));
        List<AvailabilityWindow> sameDay = wins.stream()
                .filter(w -> w.getDayOfWeek() == dow)
                .toList();
        if (sameDay.isEmpty()) {
            return String.format(
                    "Requested %s is a %s; there is no catalogue window for that weekday. Full catalogue: [%s].",
                    date, dow, fullCatalogue);
        }
        String thatDay = sameDay.stream()
                .map(w -> w.getStartTime() + "-" + w.getEndTime())
                .collect(Collectors.joining("; "));
        return String.format(
                "Requested interval %s %s-%s must fall fully inside one window on %s. Catalogue that day: [%s].",
                date, rs, re, dow, thatDay);
    }

    private BookingAvailabilityResponse buildAvailabilityResponse(
            String resourceId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            boolean available,
            String reasonCode,
            String message) {
        BookingAvailabilityResponse response = new BookingAvailabilityResponse();
        response.setReasonCode(reasonCode);
        response.setResourceId(resourceId);
        response.setStartTime(startTime);
        response.setEndTime(endTime);
        response.setAvailable(available);
        response.setMessage(message);
        return response;
    }
}
