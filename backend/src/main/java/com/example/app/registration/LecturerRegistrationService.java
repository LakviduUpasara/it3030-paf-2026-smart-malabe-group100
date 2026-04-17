package com.example.app.registration;

import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.registration.document.Lecturer;
import com.example.app.registration.dto.EligibilityCountsDto;
import com.example.app.registration.dto.LecturerCreateRequest;
import com.example.app.registration.dto.LecturerResponse;
import com.example.app.registration.repository.LecturerRepository;
import com.example.app.repository.UserAccountRepository;
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
public class LecturerRegistrationService {

    private final StaffEligibilityService staffEligibilityService;
    private final LecturerRepository lecturerRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModuleOfferingSyncService moduleOfferingSyncService;
    private final MongoTemplate mongoTemplate;

    @Value("${app.registration.lecturer-email-domain:lecturer.smartcampus.local}")
    private String lecturerEmailDomain;

    @Value("${app.registration.default-staff-password:ChangeMe123!}")
    private String defaultStaffPassword;

    public LecturerResponse create(LecturerCreateRequest request) {
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

        for (int attempt = 1; attempt <= 10; attempt++) {
            String local = RegistrationStringUtils.buildLecturerEmailLocalPart(fullName);
            String suffix = attempt == 1 ? "" : String.valueOf(attempt);
            if (!suffix.isEmpty()) {
                local = local + suffix;
            }
            String loginEmail = local + "@" + lecturerEmailDomain.toLowerCase(Locale.ROOT);
            if (userAccountRepository.existsByEmailIgnoreCase(loginEmail)) {
                continue;
            }

            Lecturer lecturer = Lecturer.builder()
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
                lecturer = lecturerRepository.save(lecturer);
            } catch (DuplicateKeyException e) {
                String msg = String.valueOf(e.getMessage());
                if (msg.contains("nicStaffId") || msg.contains("nic_staff_id")) {
                    throw new ApiException(HttpStatus.CONFLICT, "NIC/Staff ID already exists");
                }
                continue;
            }

            try {
                UserAccount user = UserAccount.builder()
                        .fullName(fullName)
                        .email(loginEmail.toLowerCase(Locale.ROOT))
                        .passwordHash(passwordEncoder.encode(defaultStaffPassword))
                        .role(Role.LECTURER)
                        .status(mapUserStatus(status))
                        .provider(AuthProvider.LOCAL)
                        .mustChangePassword(true)
                        .lecturerRef(lecturer.getId())
                        .build();
                userAccountRepository.save(user);
            } catch (Exception e) {
                lecturerRepository.deleteById(lecturer.getId());
                if (e instanceof DuplicateKeyException) {
                    continue;
                }
                throw e;
            }

            moduleOfferingSyncService.syncLecturerAssignmentsAcrossModuleOfferings(lecturer);
            return toResponse(lecturer);
        }

        throw new ApiException(HttpStatus.CONFLICT, "Could not allocate a unique lecturer email");
    }

    public LecturerResponse update(String id, LecturerCreateRequest request) {
        Lecturer lecturer =
                lecturerRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lecturer not found"));

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

        String previousNic = lecturer.getNicStaffId();
        if (nicStaffId != null
                && (previousNic == null || !nicStaffId.equalsIgnoreCase(previousNic))) {
            if (lecturerRepository.existsByNicStaffIdIgnoreCaseAndIdNot(nicStaffId, id)) {
                throw new ApiException(HttpStatus.CONFLICT, "NIC/Staff ID already exists");
            }
        }

        lecturer.setFullName(fullName);
        lecturer.setOptionalEmail(optionalEmail);
        lecturer.setPhone(phone);
        lecturer.setNicStaffId(nicStaffId);
        lecturer.setStatus(status);
        lecturer.setFacultyIds(new ArrayList<>(scope.getFacultyIds()));
        lecturer.setDegreeProgramIds(new ArrayList<>(scope.getDegreeProgramIds()));
        lecturer.setModuleIds(new ArrayList<>(scope.getModuleIds()));
        try {
            lecturer = lecturerRepository.save(lecturer);
        } catch (DuplicateKeyException e) {
            String msg = String.valueOf(e.getMessage());
            if (msg.contains("nicStaffId") || msg.contains("nic_staff_id")) {
                throw new ApiException(HttpStatus.CONFLICT, "NIC/Staff ID already exists");
            }
            throw e;
        }

        UserAccount user = userAccountRepository
                .findByLecturerRef(lecturer.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        if (user.getRole() != Role.LECTURER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Linked account is not a lecturer account");
        }
        user.setFullName(fullName);
        user.setStatus(mapUserStatus(status));
        userAccountRepository.save(user);

        moduleOfferingSyncService.syncLecturerAssignmentsAcrossModuleOfferings(lecturer);
        return toResponse(lecturer);
    }

    public void delete(String id) {
        Lecturer lecturer =
                lecturerRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lecturer not found"));
        userAccountRepository.findByLecturerRef(id).ifPresent(userAccountRepository::delete);
        lecturerRepository.delete(lecturer);
    }

    public List<LecturerResponse> list(AccountStatus statusFilter, String search) {
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
        List<Lecturer> list = mongoTemplate.find(query, Lecturer.class);
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private AccountStatus mapUserStatus(AccountStatus lecturerStatus) {
        return lecturerStatus == AccountStatus.INACTIVE ? AccountStatus.INACTIVE : AccountStatus.ACTIVE;
    }

    private LecturerResponse toResponse(Lecturer l) {
        return LecturerResponse.builder()
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
