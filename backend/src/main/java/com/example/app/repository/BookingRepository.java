package com.example.app.repository;

import com.example.app.entity.Booking;
import com.example.app.entity.BookingStatus;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM Booking b " +
           "WHERE b.resourceId = :resourceId " +
           "AND b.status = :status " +
           "AND b.startTime < :endTime " +
           "AND b.endTime > :startTime")
    boolean existsApprovedBookingConflict(
            @Param("resourceId") Long resourceId,
            @Param("status") BookingStatus status,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    List<Booking> findByUserIdOrderByStartTimeDesc(Long userId);
}
