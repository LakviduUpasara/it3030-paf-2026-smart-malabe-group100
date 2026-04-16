package com.example.app.lms.repository;

import com.example.app.lms.document.LmsDegreeProgram;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface LmsDegreeProgramRepository extends MongoRepository<LmsDegreeProgram, String> {

    Optional<LmsDegreeProgram> findByCodeAndIsDeletedFalse(String code);

    boolean existsByCodeAndIsDeletedFalse(String code);

    List<LmsDegreeProgram> findByFacultyCodeAndIsDeletedFalseOrderByUpdatedAtDesc(String facultyCode);

    List<LmsDegreeProgram> findByIsDeletedFalseOrderByUpdatedAtDesc();
}
