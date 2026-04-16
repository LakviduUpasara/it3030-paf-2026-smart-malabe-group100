package com.example.app.service;

import com.example.app.dto.CategoryRequest;
import com.example.app.dto.CategoryResponse;
import com.example.app.dto.SubCategoryRequest;
import com.example.app.dto.SubCategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(String id, CategoryRequest request);
    void deleteCategory(String id);
    List<SubCategoryResponse> getSubCategories(String categoryId);
    SubCategoryResponse createSubCategory(SubCategoryRequest request);
}
