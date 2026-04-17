package com.example.app.registration.repository;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.registration.document.LabAssistant;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface LabAssistantRepository extends MongoRepository<LabAssistant, String> {

    boolean existsByLoginEmailIgnoreCase(String loginEmail);

    boolean existsByNicStaffIdIgnoreCaseAndIdNot(String nicStaffId, String id);

    List<LabAssistant> findByStatusOrderByCreatedAtDesc(AccountStatus status);

    List<LabAssistant> findAllByOrderByCreatedAtDesc();
}
