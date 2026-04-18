package com.example.app.service.impl;

import com.example.app.dto.TechnicianSummaryResponse;
import com.example.app.dto.admin.CreateTechnicianRequest;
import com.example.app.dto.admin.UpdateTechnicianRequest;
import com.example.app.entity.Ticket;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.TwoFactorMethod;
import com.example.app.exception.ApiException;
import com.example.app.entity.PlatformSecuritySettings;
import com.example.app.repository.TicketRepository;
import com.example.app.repository.UserAccountRepository;
import com.example.app.service.AdminTechnicianService;
import com.example.app.service.PlatformSecurityService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminTechnicianServiceImpl implements AdminTechnicianService {

    private final UserAccountRepository userAccountRepository;
    private final TicketRepository ticketRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<TechnicianSummaryResponse> listTechnicians() {
        return userAccountRepository.findByRoleOrderByFullNameAsc(Role.TECHNICIAN).stream()
                .map(this::toSummary)
                .toList();
    }

    @Override
    public TechnicianSummaryResponse create(CreateTechnicianRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        PlatformSecuritySettings policy = platformSecurityService.getOrCreateDefault();
        UserAccount user = UserAccount.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.TECHNICIAN)
                .status(AccountStatus.ACTIVE)
                .provider(AuthProvider.LOCAL)
                .twoFactorEnabled(policy.isNewUsersMustEnableTwoFactor() ? Boolean.TRUE : Boolean.FALSE)
                .mustChangePassword(policy.isRequirePasswordChangeOnFirstLoginForLocalUsers())
                .preferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP)
                .authenticatorConfirmed(false)
                .build();
        UserAccount saved = userAccountRepository.save(user);
        return toSummary(saved);
    }

    @Override
    public TechnicianSummaryResponse update(String id, UpdateTechnicianRequest request) {
        UserAccount user = userAccountRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Technician was not found."));
        if (user.getRole() != Role.TECHNICIAN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This account is not a technician.");
        }
        String newEmail = normalizeEmail(request.getEmail());
        if (!newEmail.equalsIgnoreCase(user.getEmail())) {
            userAccountRepository
                    .findByEmailIgnoreCase(newEmail)
                    .ifPresent(other -> {
                        if (!other.getId().equals(user.getId())) {
                            throw new ApiException(HttpStatus.CONFLICT, "Another account already uses this email.");
                        }
                    });
        }
        user.setFullName(request.getFullName().trim());
        user.setEmail(newEmail);
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().length() < 8) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters.");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        UserAccount saved = userAccountRepository.save(user);
        return toSummary(saved);
    }

    @Override
    public void delete(String id) {
        UserAccount user = userAccountRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Technician was not found."));
        if (user.getRole() != Role.TECHNICIAN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This account is not a technician.");
        }
        List<Ticket> assigned = ticketRepository.findByAssignedTechnicianUserIdOrderByCreatedAtDesc(id);
        for (Ticket ticket : assigned) {
            ticket.setAssignedTechnicianUserId(null);
            String status = ticket.getStatus() != null ? ticket.getStatus().trim().toUpperCase() : "";
            if ("IN_PROGRESS".equals(status)) {
                ticket.setStatus("OPEN");
            }
        }
        if (!assigned.isEmpty()) {
            ticketRepository.saveAll(assigned);
        }
        userAccountRepository.deleteById(id);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private TechnicianSummaryResponse toSummary(UserAccount u) {
        TechnicianSummaryResponse r = new TechnicianSummaryResponse();
        r.setId(u.getId());
        r.setFullName(u.getFullName());
        r.setEmail(u.getEmail());
        return r;
    }
}
