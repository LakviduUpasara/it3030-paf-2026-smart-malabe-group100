package com.example.app.lms.repository;

import com.example.app.lms.document.Faculty;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FacultyRepository extends MongoRepository<Faculty, String> {

    Optional<Faculty> findByCodeAndIsDeletedFalse(String code);

    boolean existsByCodeAndIsDeletedFalse(String code);

    List<Faculty> findByIsDeletedFalseOrderByUpdatedAtDescCodeAsc();
}
