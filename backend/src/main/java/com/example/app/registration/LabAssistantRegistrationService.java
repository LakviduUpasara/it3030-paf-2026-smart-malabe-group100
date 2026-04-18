package com.example.app.registration;

import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.registration.document.LabAssistant;
import com.example.app.registration.dto.EligibilityCountsDto;
import com.example.app.registration.dto.LabAssistantCreateRequest;
import com.example.app.registration.dto.LabAssistantResponse;
import com.example.app.registration.repository.LabAssistantRepository;
import com.example.app.repository.UserAccountRepository;
import com.example.app.service.PlatformSecurityService;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class LabAssistantRegistrationService {

    private final StaffEligibilityService staffEligibilityService;
    private final LabAssistantRepository labAssistantRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModuleOfferingSyncService moduleOfferingSyncService;
    private final MongoTemplate mongoTemplate;
    private final PlatformSecurityService platformSecurityService;

    @Value("${app.registration.lab-assistant-email-domain:lab.smartcampus.local}")
    private String labAssistantEmailDomain;

    @Value("${app.registration.default-staff-password:ChangeMe123!}")
    private String defaultStaffPassword;

    public LabAssistantResponse create(LabAssistantCreateRequest request) {
        String fullName = RegistrationStringUtils.sanitizePersonName(request.getFullName());
        if (fullName == null || fullName.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Full name is required");
        }
        AccountStatus status = request.getStatus() == null ? AccountStatus.ACTIVE : request.getStatus();
        if (status != AccountStatus.ACTIVE && status != AccountStatus.INACTIVE) {
            status = AccountStatus.ACTIVE;
        }

        StaffScopeResult scope;
        try {
            scope = staffEligibilityService.validateStaffEligibilityWithDb(
                    request.getFacultyIds(), request.getDegreeProgramIds(), request.getModuleIds());
        } catch (ApiException e) {
            if (e.getStatus() == HttpStatus.BAD_REQUEST) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid support scope");
            }
            throw e;
        }

        String optionalEmail = RegistrationStringUtils.sanitizeOptionalContact(request.getOptionalEmail());
        String phone = RegistrationStringUtils.sanitizeOptionalContact(request.getPhone());
        String nicStaffId = RegistrationStringUtils.sanitizeOptionalContact(request.getNicStaffId());

        for (int attempt = 1; attempt <= 10; attempt++) {
            String local = RegistrationStringUtils.buildLabAssistantEmailLocalPart(fullName);
            String suffix = attempt == 1 ? "" : String.valueOf(attempt);
            if (!suffix.isEmpty()) {
                local = local + suffix;
            }
            String loginEmail = local + "@" + labAssistantEmailDomain.toLowerCase(Locale.ROOT);
            if (userAccountRepository.existsByEmailIgnoreCase(loginEmail)) {
                continue;
            }

            LabAssistant labAssistant = LabAssistant.builder()
                    .fullName(fullName)
                    .loginEmail(loginEmail.toLowerCase(Locale.ROOT))
                    .optionalEmail(optionalEmail)
                    .phone(phone)
                    .nicStaffId(nicStaffId)
                    .status(status)
                    .facultyIds(new ArrayList<>(scope.getFacultyIds()))
                    .degreeProgramIds(new ArrayList<>(scope.getDegreeProgramIds()))
                    .moduleIds(new ArrayList<>(scope.getModuleIds()))
                    .build();

            try {
                labAssistant = labAssistantRepository.save(labAssistant);
            } catch (DuplicateKeyException e) {
                String msg = String.valueOf(e.getMessage());
                if (msg.contains("nicStaffId") || msg.contains("nic_staff_id")) {
                    throw new ApiException(HttpStatus.CONFLICT, "NIC/Staff ID already exists");
                }
                continue;
            }

            try {
                var policy = platformSecurityService.getOrCreateDefault();
                UserAccount user = UserAccount.builder()
                        .fullName(fullName)
                        .email(loginEmail.toLowerCase(Locale.ROOT))
                        .passwordHash(passwordEncoder.encode(defaultStaffPassword))
                        .role(Role.LAB_ASSISTANT)
                        .status(mapUserStatus(status))
                        .provider(AuthProvider.LOCAL)
                        .twoFactorEnabled(policy.isNewUsersMustEnableTwoFactor() ? Boolean.TRUE : Boolean.FALSE)
                        .mustChangePassword(policy.isRequirePasswordChangeOnFirstLoginForLocalUsers())
                        .labAssistantRef(labAssistant.getId())
                        .build();
                userAccountRepository.save(user);
            } catch (Exception e) {
                labAssistantRepository.deleteById(labAssistant.getId());
                if (e instanceof DuplicateKeyException) {
                    continue;
                }
                throw e;
            }

            moduleOfferingSyncService.syncLabAssistantAssignmentsAcrossModuleOfferings(labAssistant);
            return toResponse(labAssistant);
        }

        throw new ApiException(HttpStatus.CONFLICT, "Could not allocate a unique lab assistant email");
    }

    public LabAssistantResponse update(String id, LabAssistantCreateRequest request) {
        LabAssistant labAssistant =
                labAssistantRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lab assistant not found"));

        String fullName = RegistrationStringUtils.sanitizePersonName(request.getFullName());
        if (fullName == null || fullName.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Full name is required");
        }
        AccountStatus status = request.getStatus() == null ? AccountStatus.ACTIVE : request.getStatus();
        if (status != AccountStatus.ACTIVE && status != AccountStatus.INACTIVE) {
            status = AccountStatus.ACTIVE;
        }

        StaffScopeResult scope = staffEligibilityService.validateStaffEligibilityWithDb(
                request.getFacultyIds(), request.getDegreeProgramIds(), request.getModuleIds());

        String optionalEmail = RegistrationStringUtils.sanitizeOptionalContact(request.getOptionalEmail());
        String phone = RegistrationStringUtils.sanitizeOptionalContact(request.getPhone());
        String nicStaffId = RegistrationStringUtils.sanitizeOptionalContact(request.getNicStaffId());

        String previousNic = labAssistant.getNicStaffId();
        if (nicStaffId != null
                && (previousNic == null || !nicStaffId.equalsIgnoreCase(previousNic))) {
            if (labAssistantRepository.existsByNicStaffIdIgnoreCaseAndIdNot(nicStaffId, id)) {
                throw new ApiException(HttpStatus.CONFLICT, "NIC/Staff ID already exists");
            }
        }

        labAssistant.setFullName(fullName);
        labAssistant.setOptionalEmail(optionalEmail);
        labAssistant.setPhone(phone);
        labAssistant.setNicStaffId(nicStaffId);
        labAssistant.setStatus(status);
        labAssistant.setFacultyIds(new ArrayList<>(scope.getFacultyIds()));
        labAssistant.setDegreeProgramIds(new ArrayList<>(scope.getDegreeProgramIds()));
        labAssistant.setModuleIds(new ArrayList<>(scope.getModuleIds()));
        try {
            labAssistant = labAssistantRepository.save(labAssistant);
        } catch (DuplicateKeyException e) {
            String msg = String.valueOf(e.getMessage());
            if (msg.contains("nicStaffId") || msg.contains("nic_staff_id")) {
                throw new ApiException(HttpStatus.CONFLICT, "NIC/Staff ID already exists");
            }
            throw e;
        }

        UserAccount user = userAccountRepository
                .findByLabAssistantRef(labAssistant.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        if (user.getRole() != Role.LAB_ASSISTANT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Linked account is not a lab assistant account");
        }
        user.setFullName(fullName);
        user.setStatus(mapUserStatus(status));
        userAccountRepository.save(user);

        moduleOfferingSyncService.syncLabAssistantAssignmentsAcrossModuleOfferings(labAssistant);
        return toResponse(labAssistant);
    }

    public void delete(String id) {
        LabAssistant labAssistant =
                labAssistantRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lab assistant not found"));
        userAccountRepository.findByLabAssistantRef(id).ifPresent(userAccountRepository::delete);
        labAssistantRepository.delete(labAssistant);
    }

    public List<LabAssistantResponse> list(AccountStatus statusFilter, String search) {
        Query query = new Query();
        if (statusFilter != null) {
            query.addCriteria(Criteria.where("status").is(statusFilter));
        }
        if (search != null && !search.isBlank()) {
            Pattern p = Pattern.compile(Pattern.quote(search.trim()), Pattern.CASE_INSENSITIVE);
            query.addCriteria(new Criteria()
                    .orOperator(
                            Criteria.where("fullName").regex(p),
                            Criteria.where("loginEmail").regex(p),
                            Criteria.where("optionalEmail").regex(p),
                            Criteria.where("phone").regex(p),
                            Criteria.where("nicStaffId").regex(p)));
        }
        query.with(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<LabAssistant> list = mongoTemplate.find(query, LabAssistant.class);
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private AccountStatus mapUserStatus(AccountStatus staffStatus) {
        return staffStatus == AccountStatus.INACTIVE ? AccountStatus.INACTIVE : AccountStatus.ACTIVE;
    }

    private LabAssistantResponse toResponse(LabAssistant l) {
        return LabAssistantResponse.builder()
                .id(l.getId())
                .fullName(l.getFullName())
                .loginEmail(l.getLoginEmail())
                .optionalEmail(l.getOptionalEmail())
                .phone(l.getPhone())
                .nicStaffId(l.getNicStaffId())
                .status(l.getStatus())
                .facultyIds(l.getFacultyIds())
                .degreeProgramIds(l.getDegreeProgramIds())
                .moduleIds(l.getModuleIds())
                .eligibilityCounts(EligibilityCountsDto.builder()
                        .faculties(l.getFacultyIds().size())
                        .degrees(l.getDegreeProgramIds().size())
                        .modules(l.getModuleIds().size())
                        .build())
                .build();
    }
}
