package com.example.app.notifications;

import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.Role;
import com.example.app.notifications.dto.AudienceResolveResponse;
import com.example.app.notifications.dto.NotificationAudienceDto;
import com.example.app.notifications.dto.NotificationRecipientDto;
import com.example.app.registration.document.Enrollment;
import com.example.app.registration.document.Intake;
import com.example.app.registration.document.LabAssistant;
import com.example.app.registration.document.Lecturer;
import com.example.app.registration.document.Student;
import com.example.app.registration.repository.EnrollmentRepository;
import com.example.app.registration.repository.IntakeRepository;
import com.example.app.registration.repository.LabAssistantRepository;
import com.example.app.registration.repository.LecturerRepository;
import com.example.app.registration.repository.StudentRepository;
import com.example.app.repository.UserAccountRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationAudienceResolutionService {

    private static final int MAX_RECIPIENTS = 5000;

    private final UserAccountRepository userAccountRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final IntakeRepository intakeRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final LabAssistantRepository labAssistantRepository;

    public AudienceResolveResponse resolve(NotificationAudienceDto audience) {
        if (audience.getRecipientUserIds() != null && !audience.getRecipientUserIds().isEmpty()) {
            return resolveExplicitIds(audience.getRecipientUserIds());
        }

        List<UserAccount> active = userAccountRepository.findByStatus(AccountStatus.ACTIVE);
        List<Role> roleFilter = parseRoles(audience.getRoles());

        Map<String, List<Enrollment>> enrollmentsByStudent =
                enrollmentRepository.findByEnrollmentStatus(AccountStatus.ACTIVE).stream()
                        .collect(Collectors.groupingBy(Enrollment::getStudentProfileId));

        Map<String, NotificationRecipientDto> out = new LinkedHashMap<>();

        for (UserAccount ua : active) {
            if (!roleFilter.isEmpty() && !roleFilter.contains(ua.getRole())) {
                continue;
            }
            if (!userRolesMatch(audience, ua)) {
                continue;
            }

            Optional<NotificationRecipientDto> rec = Optional.empty();
            if (ua.getRole() == Role.STUDENT && ua.getStudentRef() != null) {
                rec = buildStudentRecipient(ua, enrollmentsByStudent.getOrDefault(ua.getStudentRef(), List.of()), audience);
            } else if (ua.getRole() == Role.LECTURER && ua.getLecturerRef() != null) {
                rec = buildLecturerRecipient(ua, audience);
            } else if (ua.getRole() == Role.LAB_ASSISTANT && ua.getLabAssistantRef() != null) {
                rec = buildLabRecipient(ua, audience);
            } else if (ua.getRole() == Role.ADMIN || ua.getRole() == Role.LOST_ITEM_ADMIN) {
                rec = buildStaffAdminRecipient(ua, audience);
            } else if (ua.getRole() == Role.USER || ua.getRole() == Role.TECHNICIAN) {
                rec = buildGenericRecipient(ua, audience);
            }

            if (rec.isPresent()) {
                out.put(rec.get().getUserId(), rec.get());
                if (out.size() >= MAX_RECIPIENTS) {
                    break;
                }
            }
        }

        return AudienceResolveResponse.builder()
                .recipients(new ArrayList<>(out.values()))
                .total(out.size())
                .build();
    }

    private AudienceResolveResponse resolveExplicitIds(List<String> ids) {
        List<NotificationRecipientDto> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (String id : ids) {
            if (id == null || id.isBlank() || seen.contains(id)) {
                continue;
            }
            seen.add(id);
            userAccountRepository
                    .findById(id.trim())
                    .filter(u -> u.getStatus() == AccountStatus.ACTIVE)
                    .ifPresent(u -> list.add(toRecipient(u)));
            if (list.size() >= MAX_RECIPIENTS) {
                break;
            }
        }
        return AudienceResolveResponse.builder().recipients(list).total(list.size()).build();
    }

    private Optional<NotificationRecipientDto> buildStudentRecipient(
            UserAccount ua, List<Enrollment> enrollments, NotificationAudienceDto a) {
        if (enrollments.isEmpty()) {
            return Optional.empty();
        }
        boolean any = false;
        for (Enrollment e : enrollments) {
            if (enrollmentMatches(e, a)) {
                any = true;
                break;
            }
        }
        if (!any) {
            return Optional.empty();
        }
        return Optional.of(toRecipient(ua));
    }

    private boolean enrollmentMatches(Enrollment e, NotificationAudienceDto a) {
        if (has(a.getFacultyCodes()) && !containsCi(a.getFacultyCodes(), e.getFacultyId())) {
            return false;
        }
        if (has(a.getDegreeCodes()) && !containsCi(a.getDegreeCodes(), e.getDegreeProgramId())) {
            return false;
        }
        if (has(a.getIntakeIds()) && !contains(a.getIntakeIds(), e.getIntakeId())) {
            return false;
        }
        if (has(a.getStreamCodes()) && e.getStream() != null) {
            String sc = e.getStream().name();
            if (!containsCi(a.getStreamCodes(), sc)) {
                return false;
            }
        }
        if (has(a.getSubgroupCodes())) {
            String sg = normalizeSubgroup(e.getSubgroup());
            if (sg == null) {
                return false;
            }
            boolean ok =
                    a.getSubgroupCodes().stream()
                            .map(this::normalizeSubgroup)
                            .filter(x -> x != null)
                            .anyMatch(x -> x.equalsIgnoreCase(sg));
            if (!ok) {
                return false;
            }
        }
        if (has(a.getSemesterCodes())) {
            Optional<Intake> intake = intakeRepository.findByIdAndDeletedFalse(e.getIntakeId());
            if (intake.isEmpty()) {
                return false;
            }
            String ct = intake.get().getCurrentTerm();
            if (ct == null || !containsCi(a.getSemesterCodes(), ct)) {
                return false;
            }
        }
        return true;
    }

    private Optional<NotificationRecipientDto> buildLecturerRecipient(UserAccount ua, NotificationAudienceDto a) {
        Lecturer lec =
                lecturerRepository.findById(ua.getLecturerRef()).orElse(null);
        if (lec == null || lec.getStatus() != AccountStatus.ACTIVE) {
            return Optional.empty();
        }
        if (has(a.getFacultyCodes())) {
            boolean ok =
                    lec.getFacultyIds().stream()
                            .anyMatch(fc -> containsCi(a.getFacultyCodes(), fc));
            if (!ok) {
                return Optional.empty();
            }
        }
        if (has(a.getDegreeCodes())) {
            boolean ok =
                    lec.getDegreeProgramIds().stream()
                            .anyMatch(dc -> containsCi(a.getDegreeCodes(), dc));
            if (!ok) {
                return Optional.empty();
            }
        }
        if (hasDimensionsRequiringStudentOnly(a)) {
            return Optional.empty();
        }
        return Optional.of(toRecipient(ua));
    }

    private Optional<NotificationRecipientDto> buildLabRecipient(UserAccount ua, NotificationAudienceDto a) {
        LabAssistant assistant = labAssistantRepository.findById(ua.getLabAssistantRef()).orElse(null);
        if (assistant == null || assistant.getStatus() != AccountStatus.ACTIVE) {
            return Optional.empty();
        }
        if (has(a.getFacultyCodes())) {
            boolean ok =
                    assistant.getFacultyIds().stream()
                            .anyMatch(fc -> containsCi(a.getFacultyCodes(), fc));
            if (!ok) {
                return Optional.empty();
            }
        }
        if (has(a.getDegreeCodes())) {
            boolean ok =
                    assistant.getDegreeProgramIds().stream()
                            .anyMatch(dc -> containsCi(a.getDegreeCodes(), dc));
            if (!ok) {
                return Optional.empty();
            }
        }
        if (hasDimensionsRequiringStudentOnly(a)) {
            return Optional.empty();
        }
        return Optional.of(toRecipient(ua));
    }

    private Optional<NotificationRecipientDto> buildStaffAdminRecipient(UserAccount ua, NotificationAudienceDto a) {
        if (hasDimensionsRequiringStudentOnly(a)) {
            return Optional.empty();
        }
        return Optional.of(toRecipient(ua));
    }

    private Optional<NotificationRecipientDto> buildGenericRecipient(UserAccount ua, NotificationAudienceDto a) {
        if (has(a.getFacultyCodes())
                || has(a.getDegreeCodes())
                || has(a.getSemesterCodes())
                || has(a.getStreamCodes())
                || has(a.getIntakeIds())
                || has(a.getSubgroupCodes())) {
            return Optional.empty();
        }
        return Optional.of(toRecipient(ua));
    }

    private boolean hasDimensionsRequiringStudentOnly(NotificationAudienceDto a) {
        return has(a.getSemesterCodes())
                || has(a.getStreamCodes())
                || has(a.getIntakeIds())
                || has(a.getSubgroupCodes());
    }

    private boolean userRolesMatch(NotificationAudienceDto a, UserAccount ua) {
        if (!has(a.getUserRoles())) {
            return true;
        }
        String r = ua.getRole().name();
        return a.getUserRoles().stream().anyMatch(ur -> r.equalsIgnoreCase(ur.trim()));
    }

    private static boolean has(List<String> list) {
        return list != null && !list.isEmpty();
    }

    private static boolean contains(List<String> ids, String id) {
        if (id == null) {
            return false;
        }
        return ids.stream().anyMatch(x -> id.equals(x));
    }

    private static boolean containsCi(List<String> list, String value) {
        if (value == null) {
            return false;
        }
        String v = value.trim();
        return list.stream().anyMatch(x -> v.equalsIgnoreCase(x.trim()));
    }

    private String normalizeSubgroup(String raw) {
        if (raw == null) {
            return null;
        }
        String t = raw.trim().replaceAll("\\s+", " ");
        return t.isEmpty() ? null : t;
    }

    private List<Role> parseRoles(List<String> roles) {
        if (roles == null || roles.isEmpty()) {
            return List.of();
        }
        List<Role> out = new ArrayList<>();
        for (String r : roles) {
            if (r == null || r.isBlank()) {
                continue;
            }
            try {
                out.add(Role.valueOf(r.trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ignored) {
                // skip unknown
            }
        }
        return out;
    }

    private NotificationRecipientDto toRecipient(UserAccount ua) {
        String name = ua.getFullName() != null ? ua.getFullName() : ua.getEmail();
        String optional = null;
        if (ua.getStudentRef() != null) {
            optional =
                    studentRepository
                            .findById(ua.getStudentRef())
                            .map(Student::getOptionalEmail)
                            .orElse(null);
        }
        return NotificationRecipientDto.builder()
                .userId(ua.getId())
                .appRole(ua.getRole().name())
                .userRole(ua.getRole().name())
                .name(name)
                .primaryEmail(ua.getEmail())
                .optionalEmail(optional)
                .build();
    }
}
