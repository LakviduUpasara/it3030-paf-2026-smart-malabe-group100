package com.example.app.lms.repository;

import com.example.app.lms.document.CatalogModule;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CatalogModuleRepository extends MongoRepository<CatalogModule, String> {

    Optional<CatalogModule> findByCodeAndIsDeletedFalse(String code);

    boolean existsByCodeAndIsDeletedFalse(String code);

    List<CatalogModule> findByFacultyCodeAndIsDeletedFalseOrderByUpdatedAtDesc(String facultyCode);

    List<CatalogModule> findByIsDeletedFalseOrderByUpdatedAtDesc();
}
