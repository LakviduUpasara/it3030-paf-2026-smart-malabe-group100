package com.example.app.config;

import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.TwoFactorMethod;
import com.example.app.entity.Category;
import com.example.app.entity.SubCategory;
import com.example.app.repository.CategoryRepository;
import com.example.app.repository.SubCategoryRepository;
import com.example.app.repository.UserAccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner seedDefaultAccounts(UserAccountRepository userAccountRepository,
                                                 PasswordEncoder passwordEncoder,
                                                 CategoryRepository categoryRepository,
                                                 SubCategoryRepository subCategoryRepository) {
        return args -> {
            if (!userAccountRepository.existsByEmailIgnoreCase("user@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Campus Student")
                        .email("user@smartcampus.edu")
                        .passwordHash(passwordEncoder.encode("User@12345"))
                        .role(Role.USER)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.LOCAL)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            if (!userAccountRepository.existsByEmailIgnoreCase("student@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Demo Student")
                        .email("student@smartcampus.edu")
                        .passwordHash(passwordEncoder.encode("Student@12345"))
                        .role(Role.USER)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.LOCAL)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            if (!userAccountRepository.existsByEmailIgnoreCase("admin@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Campus Operations Admin")
                        .email("admin@smartcampus.edu")
                        .passwordHash(passwordEncoder.encode("Admin@12345"))
                        .role(Role.ADMIN)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.LOCAL)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            if (!userAccountRepository.existsByEmailIgnoreCase("technician@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Campus Technician")
                        .email("technician@smartcampus.edu")
                        .passwordHash(passwordEncoder.encode("Tech@12345"))
                        .role(Role.TECHNICIAN)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.LOCAL)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            if (!userAccountRepository.existsByEmailIgnoreCase("google.user@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Google Campus User")
                        .email("google.user@smartcampus.edu")
                        .role(Role.USER)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.GOOGLE)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            if (!userAccountRepository.existsByEmailIgnoreCase("google.admin@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Google Campus Admin")
                        .email("google.admin@smartcampus.edu")
                        .role(Role.ADMIN)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.GOOGLE)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            if (!userAccountRepository.existsByEmailIgnoreCase("apple.user@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Apple Campus User")
                        .email("apple.user@smartcampus.edu")
                        .role(Role.USER)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.APPLE)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            if (!userAccountRepository.existsByEmailIgnoreCase("apple.admin@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Apple Campus Admin")
                        .email("apple.admin@smartcampus.edu")
                        .role(Role.ADMIN)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.APPLE)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            seedCategoryWithSubcategories(categoryRepository, subCategoryRepository, "FACILITY", "building", "#3B82F6",
                    "AC Issue", "Water Leak", "Furniture Damage");
            seedCategoryWithSubcategories(categoryRepository, subCategoryRepository, "IT", "wifi", "#2563EB",
                    "WiFi Issue", "Printer Problem", "Software Access");
            seedCategoryWithSubcategories(categoryRepository, subCategoryRepository, "ELECTRICAL", "zap", "#FACC15",
                    "Power Outage", "Lighting Fault", "Socket Damage");
            seedCategoryWithSubcategories(categoryRepository, subCategoryRepository, "EQUIPMENT", "tool", "#F97316",
                    "Projector Fault", "Lab Device Issue", "Audio System");
            seedCategoryWithSubcategories(categoryRepository, subCategoryRepository, "CLEANING", "sparkles", "#22C55E",
                    "Restroom Cleaning", "Spill Cleanup", "Waste Collection");
            seedCategoryWithSubcategories(categoryRepository, subCategoryRepository, "SECURITY", "shield", "#EF4444",
                    "Unauthorized Access", "Lost and Found", "Suspicious Activity");
            seedCategoryWithSubcategories(categoryRepository, subCategoryRepository, "BOOKING", "calendar", "#A855F7",
                    "Double Booking", "Booking Conflict", "Reservation Update");
            seedCategoryWithSubcategories(categoryRepository, subCategoryRepository, "ACADEMIC", "graduation-cap", "#0EA5E9",
                    "Course Material Issue", "Lecturer Issue", "Timetable Issue", "Exam Issue",
                    "LMS Issue", "Classroom Issue", "Results Issue");
            seedCategoryWithSubcategories(categoryRepository, subCategoryRepository, "TRANSPORT", "bus", "#14B8A6",
                    "Bus Delay", "Bus Not Available", "Route Issue", "Driver Issue",
                    "Vehicle Breakdown", "Overcrowding", "Pass Issue", "Parking Issue");
            seedCategoryWithSubcategories(categoryRepository, subCategoryRepository, "OTHER", "circle-help", "#6B7280",
                    "General Inquiry", "Other Incident");
        };
    }

    private void seedCategoryWithSubcategories(CategoryRepository categoryRepository,
                                               SubCategoryRepository subCategoryRepository,
                                               String categoryName,
                                               String icon,
                                               String color,
                                               String... subCategoryNames) {
        Category category = categoryRepository.findByNameIgnoreCase(categoryName).orElseGet(() -> {
            Category created = new Category();
            created.setName(categoryName);
            created.setIcon(icon);
            created.setColor(color);
            created.setCustom(false);
            return categoryRepository.save(created);
        });

        for (String subCategoryName : subCategoryNames) {
            subCategoryRepository.findByCategoryIdAndNameIgnoreCase(category.getId(), subCategoryName)
                    .orElseGet(() -> {
                        SubCategory subCategory = new SubCategory();
                        subCategory.setCategoryId(category.getId());
                        subCategory.setName(subCategoryName);
                        return subCategoryRepository.save(subCategory);
                    });
        }
    }
}
