package com.example.app.repository;

import com.example.app.entity.DegreeProgram;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DegreeProgramRepository extends JpaRepository<DegreeProgram, Long> {

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    List<DegreeProgram> findAllByOrderByCodeAsc();
}
