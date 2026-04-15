package com.example.app.repository;

import com.example.app.entity.StudentGroup;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentGroupRepository extends JpaRepository<StudentGroup, Long> {

    boolean existsByDegreeProgramIdAndCodeIgnoreCase(Long degreeProgramId, String code);

    boolean existsByDegreeProgramIdAndCodeIgnoreCaseAndIdNot(Long degreeProgramId, String code, Long id);

    List<StudentGroup> findByDegreeProgramIdOrderByCodeAsc(Long degreeProgramId);

    List<StudentGroup> findBySemesterIdOrderByCodeAsc(Long semesterId);

    List<StudentGroup> findAllByOrderByCodeAsc();
}
