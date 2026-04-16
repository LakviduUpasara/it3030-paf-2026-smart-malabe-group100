package com.example.app.service;

import com.example.app.dto.TicketSuggestionResponse;
import com.example.app.entity.Category;
import com.example.app.entity.SubCategory;
import com.example.app.repository.CategoryRepository;
import com.example.app.repository.SubCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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
        String normalized = description == null ? "" : description.toLowerCase();

        for (SuggestionRule rule : RULES) {
            boolean matched = rule.keywords.stream().anyMatch(normalized::contains);
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

        TicketSuggestionResponse response = new TicketSuggestionResponse();
        response.setMatched(false);
        return response;
    }
}
