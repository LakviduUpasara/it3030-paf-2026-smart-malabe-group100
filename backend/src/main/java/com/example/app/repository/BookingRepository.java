package com.example.app.repository;

import com.example.app.entity.Booking;
import com.example.app.entity.BookingStatus;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BookingRepository extends MongoRepository<Booking, String> {

    long countByStatus(BookingStatus status);

    boolean existsByResourceIdAndStatusAndStartTimeBeforeAndEndTimeAfter(
            String resourceId,
            BookingStatus status,
            LocalDateTime endTime,
            LocalDateTime startTime);

    List<Booking> findByUserIdOrderByStartTimeDesc(String userId);

    List<Booking> findByStatusOrderByStartTimeAsc(BookingStatus status);
}
