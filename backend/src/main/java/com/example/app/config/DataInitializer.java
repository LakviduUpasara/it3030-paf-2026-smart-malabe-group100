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
import com.example.app.repository.IncidentTicketRepository;
import com.example.app.repository.UserAccountRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner seedDefaultAccounts(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            upsertLocalDemoAccount(
                    userAccountRepository,
                    passwordEncoder,
                    "admin@smartcampus.edu",
                    "Campus Operations Admin",
                    "Admin@12345",
                    Role.ADMIN
            );
            upsertLocalDemoAccount(
                    userAccountRepository,
                    passwordEncoder,
                    "technician@smartcampus.edu",
                    "Campus Technician",
                    "Tech@12345",
                    Role.TECHNICIAN
            );
            upsertLocalDemoAccount(
                    userAccountRepository,
                    passwordEncoder,
                    "manager@smartcampus.edu",
                    "Campus User Manager",
                    "Manager@12345",
                    Role.MANAGER
            );
            upsertSocialDemoAccount(
                    userAccountRepository,
                    "google.user@smartcampus.edu",
                    "Google Campus User",
                    Role.USER,
                    AuthProvider.GOOGLE
            );
            upsertSocialDemoAccount(
                    userAccountRepository,
                    "google.admin@smartcampus.edu",
                    "Google Campus Admin",
                    Role.ADMIN,
                    AuthProvider.GOOGLE
            );
            upsertSocialDemoAccount(
                    userAccountRepository,
                    "apple.user@smartcampus.edu",
                    "Apple Campus User",
                    Role.USER,
                    AuthProvider.APPLE
            );
            upsertSocialDemoAccount(
                    userAccountRepository,
                    "apple.admin@smartcampus.edu",
                    "Apple Campus Admin",
                    Role.ADMIN,
                    AuthProvider.APPLE
            );
        };
    }

    @Bean
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

    private void upsertLocalDemoAccount(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            String email,
            String fullName,
            String rawPassword,
            Role role
    ) {
        UserAccount account = userAccountRepository.findByEmailIgnoreCase(email)
                .orElseGet(UserAccount::new);

        account.setFullName(fullName);
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(rawPassword));
        account.setRole(role);
        account.setStatus(AccountStatus.ACTIVE);
        account.setProvider(AuthProvider.LOCAL);
        account.setProviderSubject(null);
        account.setPreferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP);
        account.setAuthenticatorSecret(null);
        account.setAuthenticatorConfirmed(false);
        account.setTwoFactorEnabled(false);
        account.setGoogleTwoFactorPromptDismissed(true);

        userAccountRepository.save(account);
    }

    private void upsertSocialDemoAccount(
            UserAccountRepository userAccountRepository,
            String email,
            String fullName,
            Role role,
            AuthProvider provider
    ) {
        UserAccount account = userAccountRepository.findByEmailIgnoreCase(email)
                .orElseGet(UserAccount::new);

        account.setFullName(fullName);
        account.setEmail(email);
        account.setPasswordHash(null);
        account.setRole(role);
        account.setStatus(AccountStatus.ACTIVE);
        account.setProvider(provider);
        account.setProviderSubject(null);
        account.setPreferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP);
        account.setAuthenticatorSecret(null);
        account.setAuthenticatorConfirmed(false);
        account.setTwoFactorEnabled(false);
        account.setGoogleTwoFactorPromptDismissed(provider == AuthProvider.GOOGLE ? false : true);

        userAccountRepository.save(account);
    }
}
