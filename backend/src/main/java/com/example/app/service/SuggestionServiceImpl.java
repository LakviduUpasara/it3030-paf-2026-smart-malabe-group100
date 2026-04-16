package com.example.app.service;

import com.example.app.dto.TicketSuggestionResponse;
import com.example.app.entity.Category;
import com.example.app.entity.SubCategory;
import com.example.app.repository.CategoryRepository;
import com.example.app.repository.SubCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class SuggestionServiceImpl implements SuggestionService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SubCategoryRepository subCategoryRepository;

    private record SuggestionRule(List<String> keywords, String categoryName, String subCategoryName) {}

    private static final List<SuggestionRule> RULES = List.of(
            new SuggestionRule(List.of("wifi", "internet", "network"), "IT", "WiFi Issue"),
            new SuggestionRule(List.of("ac", "air"), "FACILITY", "AC Issue"),
            new SuggestionRule(List.of("power", "electricity", "outage"), "ELECTRICAL", "Power Outage")
    );

    @Override
    public TicketSuggestionResponse suggest(String description) {
        String normalized = description == null ? "" : description.toLowerCase(Locale.ROOT).trim();
        if (normalized.isBlank()) {
            return noMatch();
        }

        // 1) Explicit keyword rules for high-confidence suggestions
        for (SuggestionRule rule : RULES) {
            boolean matched = rule.keywords.stream().anyMatch(keyword -> containsKeyword(normalized, keyword));
            if (!matched) {
                continue;
            }

            Optional<Category> categoryOpt = categoryRepository.findByNameIgnoreCase(rule.categoryName);
            if (categoryOpt.isEmpty()) {
                continue;
            }

            Category category = categoryOpt.get();
            Optional<SubCategory> subCategoryOpt = subCategoryRepository
                    .findByCategoryIdAndNameIgnoreCase(category.getId(), rule.subCategoryName);

            TicketSuggestionResponse response = new TicketSuggestionResponse();
            response.setMatched(true);
            response.setCategoryId(category.getId());
            response.setCategoryName(category.getName());
            subCategoryOpt.ifPresent(subCategory -> {
                response.setSubCategoryId(subCategory.getId());
                response.setSubCategoryName(subCategory.getName());
            });
            return response;
        }

        // 2) Dynamic match: if text mentions a subcategory phrase/keyword, infer its parent category
        List<SubCategory> subCategories = subCategoryRepository.findAll();
        Optional<SubCategory> subCategoryMatch = subCategories.stream()
                .filter(subCategory -> isSubCategoryMentioned(normalized, subCategory.getName()))
                .max(Comparator.comparingInt(subCategory -> subCategory.getName() != null ? subCategory.getName().length() : 0));

        if (subCategoryMatch.isPresent()) {
            return toResponseFromSubCategory(subCategoryMatch.get());
        }

        // 3) Fallback: category name mentioned in description
        List<Category> categories = categoryRepository.findAll();
        Optional<Category> categoryMatch = categories.stream()
                .filter(category -> category.getName() != null && normalized.contains(category.getName().toLowerCase(Locale.ROOT)))
                .findFirst();

        if (categoryMatch.isPresent()) {
            Category category = categoryMatch.get();
            TicketSuggestionResponse response = new TicketSuggestionResponse();
            response.setMatched(true);
            response.setCategoryId(category.getId());
            response.setCategoryName(category.getName());
            subCategoryRepository.findByCategoryIdOrderByNameAsc(category.getId()).stream().findFirst().ifPresent(subCategory -> {
                response.setSubCategoryId(subCategory.getId());
                response.setSubCategoryName(subCategory.getName());
            });
            return response;
        }

        return noMatch();
    }

    private boolean isSubCategoryMentioned(String normalizedDescription, String subCategoryName) {
        if (subCategoryName == null || subCategoryName.isBlank()) {
            return false;
        }
        String normalizedSubCategory = subCategoryName.toLowerCase(Locale.ROOT);
        if (normalizedDescription.contains(normalizedSubCategory)) {
            return true;
        }

        // Token-level matching catches descriptions like "wifi not working" for "WiFi Issue"
        return Arrays.stream(normalizedSubCategory.split("[\\s\\-_/]+"))
                .map(String::trim)
                .filter(token -> token.length() >= 3)
                .anyMatch(token -> containsKeyword(normalizedDescription, token));
    }

    private boolean containsKeyword(String text, String keyword) {
        if (text == null || keyword == null) {
            return false;
        }
        String normalizedKeyword = keyword.toLowerCase(Locale.ROOT).trim();
        if (normalizedKeyword.isBlank()) {
            return false;
        }
        String regex = "(?<![a-z0-9])" + Pattern.quote(normalizedKeyword) + "(?![a-z0-9])";
        return Pattern.compile(regex).matcher(text).find();
    }

    private TicketSuggestionResponse toResponseFromSubCategory(SubCategory subCategory) {
        TicketSuggestionResponse response = new TicketSuggestionResponse();
        response.setMatched(true);
        response.setSubCategoryId(subCategory.getId());
        response.setSubCategoryName(subCategory.getName());
        categoryRepository.findById(subCategory.getCategoryId()).ifPresent(category -> {
            response.setCategoryId(category.getId());
            response.setCategoryName(category.getName());
        });
        return response;
    }

    private TicketSuggestionResponse noMatch() {
        TicketSuggestionResponse response = new TicketSuggestionResponse();
        response.setMatched(false);
        return response;
    }
}
