package com.example.app.dto;

import jakarta.validation.constraints.NotBlank;

public class SubCategoryRequest {

    @NotBlank(message = "Subcategory name is required")
    private String name;

    @NotBlank(message = "Category ID is required")
    private String categoryId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }
}
