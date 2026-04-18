package com.example.app.repository;

import com.example.app.entity.Resource;
import com.example.app.entity.ResourceStatus;
import com.example.app.entity.ResourceType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    @Query("""
            select distinct r from Resource r
            left join fetch r.availabilityWindows
            where r.id = :id
            """)
    Optional<Resource> findByIdWithAvailabilityWindows(@Param("id") Long id);

    @Query("""
            select distinct r
            from Resource r
            where (:type is null or r.type = :type)
              and (:status is null or r.status = :status)
              and (:minCapacity is null or r.capacity >= :minCapacity)
              and (:location is null or lower(r.location) like lower(concat('%', :location, '%')))
            """)
    List<Resource> findAllByFilters(
            @Param("type") ResourceType type,
            @Param("status") ResourceStatus status,
            @Param("minCapacity") Integer minCapacity,
            @Param("location") String location);
}
