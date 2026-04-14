package com.example.app.config;

import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.TwoFactorMethod;
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
        };
    }
}
