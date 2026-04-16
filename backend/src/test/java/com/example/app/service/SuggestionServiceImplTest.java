package com.example.app.service;

import com.example.app.dto.TicketSuggestionResponse;
import com.example.app.entity.Category;
import com.example.app.entity.SubCategory;
import com.example.app.repository.CategoryRepository;
import com.example.app.repository.SubCategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SuggestionServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SubCategoryRepository subCategoryRepository;

    @InjectMocks
    private SuggestionServiceImpl suggestionService;

    @Test
    void suggest_shouldReturnRuleBasedSuggestion_whenKeywordMatches() {
        Category category = category("cat-it", "IT");
        SubCategory subCategory = subCategory("sub-wifi", "WiFi Issue", "cat-it");

        when(categoryRepository.findByNameIgnoreCase("IT")).thenReturn(Optional.of(category));
        when(subCategoryRepository.findByCategoryIdAndNameIgnoreCase("cat-it", "WiFi Issue"))
                .thenReturn(Optional.of(subCategory));

        TicketSuggestionResponse response = suggestionService.suggest("Campus wifi internet is down");

        assertTrue(response.isMatched());
        assertEquals("cat-it", response.getCategoryId());
        assertEquals("IT", response.getCategoryName());
        assertEquals("sub-wifi", response.getSubCategoryId());
        assertEquals("WiFi Issue", response.getSubCategoryName());
    }

    @Test
    void suggest_shouldInferCategoryFromMatchedSubCategory_whenDynamicMatchFound() {
        Category category = category("cat-fac", "FACILITY");
        SubCategory projectorFault = subCategory("sub-proj", "Projector Fault", "cat-fac");

        when(subCategoryRepository.findAll()).thenReturn(List.of(projectorFault));
        when(categoryRepository.findById("cat-fac")).thenReturn(Optional.of(category));

        TicketSuggestionResponse response = suggestionService.suggest("Projector is not displaying in lecture hall");

        assertTrue(response.isMatched());
        assertEquals("cat-fac", response.getCategoryId());
        assertEquals("FACILITY", response.getCategoryName());
        assertEquals("sub-proj", response.getSubCategoryId());
        assertEquals("Projector Fault", response.getSubCategoryName());
    }

    @Test
    void suggest_shouldFallbackToCategoryName_whenCategoryMentioned() {
        Category category = category("cat-sec", "SECURITY");
        SubCategory subCategory = subCategory("sub-ua", "Unauthorized Access", "cat-sec");

        when(subCategoryRepository.findAll()).thenReturn(List.of());
        when(categoryRepository.findAll()).thenReturn(List.of(category));
        when(subCategoryRepository.findByCategoryIdOrderByNameAsc("cat-sec")).thenReturn(List.of(subCategory));

        TicketSuggestionResponse response = suggestionService.suggest("This looks like a security issue");

        assertTrue(response.isMatched());
        assertEquals("cat-sec", response.getCategoryId());
        assertEquals("SECURITY", response.getCategoryName());
        assertEquals("sub-ua", response.getSubCategoryId());
        assertEquals("Unauthorized Access", response.getSubCategoryName());
    }

    @Test
    void suggest_shouldReturnUnmatched_whenNothingFits() {
        when(subCategoryRepository.findAll()).thenReturn(List.of());
        when(categoryRepository.findAll()).thenReturn(List.of());

        TicketSuggestionResponse response = suggestionService.suggest("Need general help soon");

        assertFalse(response.isMatched());
        assertNull(response.getCategoryId());
        assertNull(response.getSubCategoryId());
    }

    @Test
    void suggest_shouldNotMatchPartialWordKeyword_likeAirInsideFurniture() {
        when(subCategoryRepository.findAll()).thenReturn(List.of());
        when(categoryRepository.findAll()).thenReturn(List.of());

        TicketSuggestionResponse response = suggestionService.suggest("Furniture bracket issue in class");

        assertFalse(response.isMatched());
        assertNull(response.getCategoryId());
        assertNull(response.getSubCategoryId());
    }

    private Category category(String id, String name) {
        Category category = new Category();
        category.setId(id);
        category.setName(name);
        return category;
    }

    private SubCategory subCategory(String id, String name, String categoryId) {
        SubCategory subCategory = new SubCategory();
        subCategory.setId(id);
        subCategory.setName(name);
        subCategory.setCategoryId(categoryId);
        return subCategory;
    }
}
