package com.example.app.controller;

import com.example.app.dto.CategoryRequest;
import com.example.app.dto.CategoryResponse;
import com.example.app.dto.SubCategoryRequest;
import com.example.app.dto.SubCategoryResponse;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.security.AuthenticatedUser;
import com.example.app.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        assertAdmin();
        return ResponseEntity.ok(categoryService.createCategory(request));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(@PathVariable String id,
                                                           @Valid @RequestBody CategoryRequest request) {
        assertAdmin();
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable String id) {
        assertAdmin();
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories/{id}/subcategories")
    public ResponseEntity<List<SubCategoryResponse>> getSubCategories(@PathVariable String id) {
        return ResponseEntity.ok(categoryService.getSubCategories(id));
    }

    @PostMapping("/subcategories")
    public ResponseEntity<SubCategoryResponse> createSubCategory(@Valid @RequestBody SubCategoryRequest request) {
        assertAdmin();
        return ResponseEntity.ok(categoryService.createSubCategory(request));
    }

    private void assertAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthenticatedUser user) || user.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Admin access required.");
        }
    }
}
