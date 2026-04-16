package com.example.app.config;

import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.TwoFactorMethod;
import java.util.Optional;
import com.example.app.repository.UserAccountRepository;
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

        userAccountRepository.save(account);
    }
}
