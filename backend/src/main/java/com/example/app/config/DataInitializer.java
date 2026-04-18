package com.example.app.config;

import com.example.app.entity.IncidentTicket;
import com.example.app.entity.TicketProgressNote;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.IncidentTicketStatus;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.TicketPriority;
import com.example.app.entity.enums.TwoFactorMethod;
import com.example.app.entity.Category;
import com.example.app.entity.SubCategory;
import com.example.app.repository.CategoryRepository;
import com.example.app.repository.IncidentTicketRepository;
import com.example.app.repository.SubCategoryRepository;
import com.example.app.repository.UserAccountRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
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

            if (!userAccountRepository.existsByEmailIgnoreCase("tech.alex@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Alex Rivera (Facilities)")
                        .email("tech.alex@smartcampus.edu")
                        .passwordHash(passwordEncoder.encode("Tech@12345"))
                        .role(Role.TECHNICIAN)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.LOCAL)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            if (!userAccountRepository.existsByEmailIgnoreCase("tech.sam@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Sam Patel (IT)")
                        .email("tech.sam@smartcampus.edu")
                        .passwordHash(passwordEncoder.encode("Tech@12345"))
                        .role(Role.TECHNICIAN)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.LOCAL)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            if (!userAccountRepository.existsByEmailIgnoreCase("tech.jordan@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Jordan Lee (Facilities)")
                        .email("tech.jordan@smartcampus.edu")
                        .passwordHash(passwordEncoder.encode("TechJordan@12345"))
                        .role(Role.TECHNICIAN)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.LOCAL)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            if (!userAccountRepository.existsByEmailIgnoreCase("tech.morgan@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Morgan Chen (Electrical)")
                        .email("tech.morgan@smartcampus.edu")
                        .passwordHash(passwordEncoder.encode("TechMorgan@12345"))
                        .role(Role.TECHNICIAN)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.LOCAL)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            if (!userAccountRepository.existsByEmailIgnoreCase("tech.casey@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Casey Brooks (Cleaning)")
                        .email("tech.casey@smartcampus.edu")
                        .passwordHash(passwordEncoder.encode("TechCasey@12345"))
                        .role(Role.TECHNICIAN)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.LOCAL)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            if (!userAccountRepository.existsByEmailIgnoreCase("tech.riley@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Riley Nguyen (Security)")
                        .email("tech.riley@smartcampus.edu")
                        .passwordHash(passwordEncoder.encode("TechRiley@12345"))
                        .role(Role.TECHNICIAN)
                        .status(AccountStatus.ACTIVE)
                        .provider(AuthProvider.LOCAL)
                        .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                        .authenticatorConfirmed(false)
                        .build());
            }

            if (!userAccountRepository.existsByEmailIgnoreCase("tech.quinn@smartcampus.edu")) {
                userAccountRepository.save(UserAccount.builder()
                        .fullName("Quinn Foster (IT)")
                        .email("tech.quinn@smartcampus.edu")
                        .passwordHash(passwordEncoder.encode("TechQuinn@12345"))
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

    @Bean
    @Profile("dev")
    public CommandLineRunner seedDemoIncidentTickets(
            IncidentTicketRepository incidentTicketRepository,
            UserAccountRepository userAccountRepository
    ) {
        return args -> {
            if (incidentTicketRepository.count() > 0) {
                return;
            }
            Optional<UserAccount> technician = userAccountRepository.findByEmailIgnoreCase("technician@smartcampus.edu");
            Optional<UserAccount> reporter = userAccountRepository.findByEmailIgnoreCase("google.user@smartcampus.edu");
            if (technician.isEmpty() || reporter.isEmpty()) {
                return;
            }
            String techId = technician.get().getId();
            String reporterId = reporter.get().getId();

            List<TicketProgressNote> notes = new ArrayList<>();
            notes.add(
                    TicketProgressNote.builder()
                            .id(UUID.randomUUID().toString())
                            .content("On-site inspection scheduled; parts ordered.")
                            .authorUserId(techId)
                            .authorDisplayName(technician.get().getFullName())
                            .createdAt(LocalDateTime.now().minusHours(2))
                            .build()
            );

            IncidentTicket assigned = IncidentTicket.builder()
                    .id(UUID.randomUUID().toString())
                    .reference("TK-DEMO01")
                    .title("Lab HVAC temperature fluctuation")
                    .description("Climate readings swing more than 3°C during peak hours in Lab 2B.")
                    .category("Facilities")
                    .location("Engineering Lab 2B")
                    .priority(TicketPriority.HIGH)
                    .status(IncidentTicketStatus.IN_PROGRESS)
                    .reporterUserId(reporterId)
                    .assigneeTechnicianId(techId)
                    .progressNotes(notes)
                    .build();

            IncidentTicket openQueue = IncidentTicket.builder()
                    .id(UUID.randomUUID().toString())
                    .reference("TK-DEMO02")
                    .title("Broken projector in Seminar Room C")
                    .description("HDMI input not detected; power LED blinks amber.")
                    .category("AV")
                    .location("Seminar Room C")
                    .priority(TicketPriority.MEDIUM)
                    .status(IncidentTicketStatus.OPEN)
                    .reporterUserId(reporterId)
                    .assigneeTechnicianId(null)
                    .progressNotes(new ArrayList<>())
                    .build();

            incidentTicketRepository.save(assigned);
            incidentTicketRepository.save(openQueue);
        };
    }
}
