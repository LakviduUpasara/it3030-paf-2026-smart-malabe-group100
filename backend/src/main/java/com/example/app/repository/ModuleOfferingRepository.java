package com.example.app.repository;

import com.example.app.entity.ModuleOffering;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModuleOfferingRepository extends JpaRepository<ModuleOffering, Long> {

    boolean existsByAcademicModuleIdAndSemesterIdAndAcademicYearLabel(
            Long academicModuleId,
            Long semesterId,
            String academicYearLabel);

    boolean existsByAcademicModuleIdAndSemesterIdAndAcademicYearLabelAndIdNot(
            Long academicModuleId,
            Long semesterId,
            String academicYearLabel,
            Long id);

    List<ModuleOffering> findBySemesterIdOrderByAcademicYearLabelAsc(Long semesterId);

    List<ModuleOffering> findByAcademicModuleIdOrderByAcademicYearLabelAsc(Long academicModuleId);

    List<ModuleOffering> findAllByOrderByAcademicYearLabelAsc();
}
