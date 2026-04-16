package com.example.app.repository;

import com.example.app.entity.Semester;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SemesterRepository extends JpaRepository<Semester, Long> {

    boolean existsByDegreeProgramIdAndYearNumberAndSemesterNumber(
            Long degreeProgramId,
            Integer yearNumber,
            Integer semesterNumber);

    boolean existsByDegreeProgramIdAndYearNumberAndSemesterNumberAndIdNot(
            Long degreeProgramId,
            Integer yearNumber,
            Integer semesterNumber,
            Long id);

    List<Semester> findByDegreeProgramIdOrderByYearNumberAscSemesterNumberAsc(Long degreeProgramId);

    List<Semester> findAllByOrderByYearNumberAscSemesterNumberAsc();
}
