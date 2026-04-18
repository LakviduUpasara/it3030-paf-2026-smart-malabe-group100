package com.example.app.registration;

import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.registration.dto.AdminCreateRequest;
import com.example.app.registration.dto.AdminCreateResponse;
import com.example.app.registration.dto.AdminUpdateRequest;
import com.example.app.registration.dto.AdminUserResponse;
import com.example.app.repository.UserAccountRepository;
import com.example.app.security.AuthenticatedUser;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminRegistrationService {

    /** Roles that may be created, listed, updated, or deleted from the console user directory (includes sign-up approvals). */
    private static final Set<Role> MANAGEABLE_ROLES = EnumSet.allOf(Role.class);

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final MongoTemplate mongoTemplate;

    @Value("${app.registration.generated-password-length:14}")
    private int generatedPasswordLength;

    public AdminCreateResponse create(AdminCreateRequest request) {
        String fullName = RegistrationStringUtils.sanitizePersonName(request.getFullName());
        String username = RegistrationStringUtils.trimToNull(request.getUsername());
        String email = RegistrationStringUtils.trimToNull(request.getEmail());
        if (fullName == null || username == null || email == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Full name, username, and email are required");
        }

        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        String normalizedUsername = username.trim();

        Role role = request.getRole() == null ? Role.ADMIN : request.getRole();
        if (!MANAGEABLE_ROLES.contains(role)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid role for this registration");
        }

        AccountStatus status = request.getStatus() == null ? AccountStatus.ACTIVE : request.getStatus();
        if (status != AccountStatus.ACTIVE && status != AccountStatus.INACTIVE) {
            status = AccountStatus.ACTIVE;
        }

        String plainPassword = RegistrationStringUtils.trimToNull(request.getPassword());
        String generatedPassword = null;
        if (plainPassword == null) {
            generatedPassword = buildGeneratedPassword();
            plainPassword = generatedPassword;
        } else if (plainPassword.length() < 8) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
        }

        if (userAccountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }
        if (userAccountRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new ApiException(HttpStatus.CONFLICT, "Username already exists");
        }

        UserAccount user = UserAccount.builder()
                .fullName(fullName)
                .email(normalizedEmail)
                .username(normalizedUsername)
                .passwordHash(passwordEncoder.encode(plainPassword))
                .role(role)
                .status(status)
                .provider(AuthProvider.LOCAL)
                .twoFactorEnabled(false)
                .mustChangePassword(true)
                .build();

        try {
            user = userAccountRepository.save(user);
        } catch (DuplicateKeyException e) {
            String msg = String.valueOf(e.getMessage());
            if (msg.contains("email")) {
                throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
            }
            if (msg.contains("username")) {
                throw new ApiException(HttpStatus.CONFLICT, "Username already exists");
            }
            throw new ApiException(HttpStatus.CONFLICT, "Email or username already exists");
        }

        return AdminCreateResponse.builder()
                .item(toAdminUserResponse(user))
                .generatedPassword(generatedPassword)
                .build();
    }

    public AdminUserResponse getById(String id) {
        UserAccount user = userAccountRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        if (!MANAGEABLE_ROLES.contains(user.getRole())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Account not found");
        }
        return toAdminUserResponse(user);
    }

    public AdminUserResponse update(String id, AdminUpdateRequest request) {
        UserAccount user = userAccountRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        if (!MANAGEABLE_ROLES.contains(user.getRole())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This account cannot be edited from the console user directory");
        }

        String fullName = RegistrationStringUtils.sanitizePersonName(request.getFullName());
        String username = RegistrationStringUtils.trimToNull(request.getUsername());
        String email = RegistrationStringUtils.trimToNull(request.getEmail());
        if (fullName == null || username == null || email == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Full name, username, and email are required");
        }

        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        String normalizedUsername = username.trim();

        Role role = request.getRole() == null ? user.getRole() : request.getRole();
        if (!MANAGEABLE_ROLES.contains(role)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid role for this registration");
        }

        AccountStatus status = request.getStatus() == null ? user.getStatus() : request.getStatus();
        if (status != AccountStatus.ACTIVE && status != AccountStatus.INACTIVE) {
            status = user.getStatus();
        }

        if (userAccountRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, id)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }
        if (userAccountRepository.existsByUsernameIgnoreCaseAndIdNot(normalizedUsername, id)) {
            throw new ApiException(HttpStatus.CONFLICT, "Username already exists");
        }

        String plainPassword = RegistrationStringUtils.trimToNull(request.getPassword());
        if (plainPassword != null) {
            if (plainPassword.length() < 8) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
            }
            user.setPasswordHash(passwordEncoder.encode(plainPassword));
            user.setMustChangePassword(true);
        }

        user.setFullName(fullName);
        user.setUsername(normalizedUsername);
        user.setEmail(normalizedEmail);
        user.setRole(role);
        user.setStatus(status);

        try {
            user = userAccountRepository.save(user);
        } catch (DuplicateKeyException e) {
            String msg = String.valueOf(e.getMessage());
            if (msg.contains("email")) {
                throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
            }
            if (msg.contains("username")) {
                throw new ApiException(HttpStatus.CONFLICT, "Username already exists");
            }
            throw new ApiException(HttpStatus.CONFLICT, "Email or username already exists");
        }

        return toAdminUserResponse(user);
    }

    public void delete(String id, AuthenticatedUser reviewer) {
        if (reviewer != null && id.equals(reviewer.getUserId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot delete your own account");
        }
        UserAccount user = userAccountRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        if (!MANAGEABLE_ROLES.contains(user.getRole())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This account cannot be removed from the console user directory");
        }
        userAccountRepository.deleteById(id);
    }

    public List<AdminUserResponse> list(Role roleFilter, AccountStatus statusFilter, String search) {
        if (roleFilter != null && !MANAGEABLE_ROLES.contains(roleFilter)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid role filter");
        }
        Query query = new Query();
        if (roleFilter != null) {
            query.addCriteria(Criteria.where("role").is(roleFilter));
        } else {
            query.addCriteria(Criteria.where("role").in(new ArrayList<>(MANAGEABLE_ROLES)));
        }
        if (statusFilter != null) {
            query.addCriteria(Criteria.where("status").is(statusFilter));
        }
        if (search != null && !search.isBlank()) {
            Pattern p = Pattern.compile(Pattern.quote(search.trim()), Pattern.CASE_INSENSITIVE);
            query.addCriteria(new Criteria()
                    .orOperator(
                            Criteria.where("fullName").regex(p),
                            Criteria.where("username").regex(p),
                            Criteria.where("email").regex(p)));
        }
        query.with(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<UserAccount> list = mongoTemplate.find(query, UserAccount.class);
        return list.stream().map(this::toAdminUserResponse).collect(Collectors.toList());
    }

    private String buildGeneratedPassword() {
        String raw = UUID.randomUUID().toString().replace("-", "");
        int len = Math.min(Math.max(generatedPasswordLength, 10), 32);
        return raw.substring(0, len);
    }

    private AdminUserResponse toAdminUserResponse(UserAccount u) {
        return AdminUserResponse.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .status(u.getStatus())
                .build();
    }
}
