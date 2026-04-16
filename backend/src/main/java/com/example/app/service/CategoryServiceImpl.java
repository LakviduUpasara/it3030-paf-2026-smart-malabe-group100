package com.example.app.service;

import com.example.app.dto.CategoryRequest;
import com.example.app.dto.CategoryResponse;
import com.example.app.dto.SubCategoryRequest;
import com.example.app.dto.SubCategoryResponse;
import com.example.app.entity.Category;
import com.example.app.entity.SubCategory;
import com.example.app.exception.ApiException;
import com.example.app.repository.CategoryRepository;
import com.example.app.repository.SubCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SubCategoryRepository subCategoryRepository;

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::toCategoryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new ApiException(HttpStatus.CONFLICT, "Category already exists.");
        }

        Category category = new Category();
        category.setName(request.getName().trim());
        category.setIcon(request.getIcon().trim());
        category.setColor(request.getColor().trim());
        category.setCustom(true);

        return toCategoryResponse(categoryRepository.save(category));
    }

    @Override
    public CategoryResponse updateCategory(String id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found."));

        category.setName(request.getName().trim());
        category.setIcon(request.getIcon().trim());
        category.setColor(request.getColor().trim());

        return toCategoryResponse(categoryRepository.save(category));
    }

    @Override
    public void deleteCategory(String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found."));
        categoryRepository.delete(category);
        subCategoryRepository.deleteByCategoryId(id);
    }

    @Override
    public List<SubCategoryResponse> getSubCategories(String categoryId) {
        categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found."));
        return subCategoryRepository.findByCategoryIdOrderByNameAsc(categoryId).stream()
                .map(this::toSubCategoryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SubCategoryResponse createSubCategory(SubCategoryRequest request) {
        categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Category not found."));

        subCategoryRepository.findByCategoryIdAndNameIgnoreCase(request.getCategoryId(), request.getName().trim())
                .ifPresent(existing -> {
                    throw new ApiException(HttpStatus.CONFLICT, "Subcategory already exists for this category.");
                });

        SubCategory subCategory = new SubCategory();
        subCategory.setName(request.getName().trim());
        subCategory.setCategoryId(request.getCategoryId());

        return toSubCategoryResponse(subCategoryRepository.save(subCategory));
    }

    private CategoryResponse toCategoryResponse(Category category) {
        CategoryResponse response = new CategoryResponse();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setIcon(category.getIcon());
        response.setColor(category.getColor());
        response.setCustom(category.isCustom());
        return response;
    }

    private SubCategoryResponse toSubCategoryResponse(SubCategory subCategory) {
        SubCategoryResponse response = new SubCategoryResponse();
        response.setId(subCategory.getId());
        response.setName(subCategory.getName());
        response.setCategoryId(subCategory.getCategoryId());
        return response;
    }
}
