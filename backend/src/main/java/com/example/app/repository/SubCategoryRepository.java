package com.example.app.repository;

import com.example.app.entity.SubCategory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SubCategoryRepository extends MongoRepository<SubCategory, String> {
    List<SubCategory> findByCategoryIdOrderByNameAsc(String categoryId);
    Optional<SubCategory> findByCategoryIdAndNameIgnoreCase(String categoryId, String name);
    void deleteByCategoryId(String categoryId);
}
