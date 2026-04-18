package com.example.app.lms.repository;

import com.example.app.lms.document.LmsModuleOffering;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface LmsModuleOfferingRepository extends MongoRepository<LmsModuleOffering, String> {

    Optional<LmsModuleOffering> findByIdAndDeletedFalse(String id);

    boolean existsByIntakeIdAndTermCodeAndModuleCodeAndDeletedFalse(
            String intakeId, String termCode, String moduleCode);

    List<LmsModuleOffering> findByDeletedFalseOrderByUpdatedAtDesc();
}
