package com.example.app.repository;

import com.example.app.entity.AcademicSession;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AcademicSessionRepository extends JpaRepository<AcademicSession, Long> {

    @Query("""
            select s
            from AcademicSession s
            where (:moduleOfferingId is null or s.moduleOffering.id = :moduleOfferingId)
              and (:studentGroupId is null or s.studentGroup.id = :studentGroupId)
              and (:resourceId is null or s.campusResourceId = :resourceId)
              and (:sessionDate is null or s.sessionDate = :sessionDate)
            order by s.sessionDate asc, s.startTime asc
            """)
    List<AcademicSession> findAllByFilters(
            @Param("moduleOfferingId") Long moduleOfferingId,
            @Param("studentGroupId") Long studentGroupId,
            @Param("resourceId") String resourceId,
            @Param("sessionDate") LocalDate sessionDate);

    @Query("""
            select case when count(s) > 0 then true else false end
            from AcademicSession s
            where s.campusResourceId = :resourceId
              and s.sessionDate = :sessionDate
              and (:excludeId is null or s.id <> :excludeId)
              and s.startTime < :endTime
              and s.endTime > :startTime
            """)
    boolean existsOverlappingSession(
            @Param("resourceId") String resourceId,
            @Param("sessionDate") LocalDate sessionDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId);
}
