package com.example.app.registration.repository;

import com.example.app.registration.document.Intake;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface IntakeRepository extends MongoRepository<Intake, String> {

    List<Intake> findByFacultyCodeAndDegreeCodeOrderByCreatedAtDesc(String facultyCode, String degreeCode);

    List<Intake> findByFacultyCodeOrderByCreatedAtDesc(String facultyCode);

    List<Intake> findAllByOrderByCreatedAtDesc();

    List<Intake> findByFacultyCodeAndDegreeCodeAndDeletedFalse(String facultyCode, String degreeCode);

    Optional<Intake> findByIdAndFacultyCodeAndDegreeCode(String id, String facultyCode, String degreeCode);

    Optional<Intake> findByIdAndDeletedFalse(String id);
}
