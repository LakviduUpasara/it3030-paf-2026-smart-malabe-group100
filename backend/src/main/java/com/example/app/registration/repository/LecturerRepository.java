package com.example.app.registration.repository;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.registration.document.Lecturer;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface LecturerRepository extends MongoRepository<Lecturer, String> {

    boolean existsByLoginEmailIgnoreCase(String loginEmail);

    List<Lecturer> findByStatusOrderByCreatedAtDesc(AccountStatus status);

    List<Lecturer> findAllByOrderByCreatedAtDesc();
}
