package com.example.app.registration.repository;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.registration.document.Student;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StudentRepository extends MongoRepository<Student, String> {

    Optional<Student> findByStudentId(String studentId);

    Optional<Student> findByNicNumberIgnoreCase(String nicNumber);

    boolean existsByNicNumberIgnoreCase(String nicNumber);

    Page<Student> findByStatus(AccountStatus status, Pageable pageable);

    Page<Student> findAll(Pageable pageable);

    List<Student> findByIdIn(Collection<String> ids);
}
