package com.example.app.registration;

import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.lms.document.Faculty;
import com.example.app.lms.document.LmsDegreeProgram;
import com.example.app.lms.repository.FacultyRepository;
import com.example.app.lms.repository.LmsDegreeProgramRepository;
import com.example.app.registration.document.Enrollment;
import com.example.app.registration.document.Intake;
import com.example.app.registration.document.Student;
import com.example.app.registration.dto.LatestEnrollmentDto;
import com.example.app.registration.dto.PagedStudentListResponse;
import com.example.app.registration.dto.StudentCreateRequest;
import com.example.app.registration.dto.StudentListItemResponse;
import com.example.app.registration.enums.StudentStream;
import com.example.app.registration.repository.EnrollmentRepository;
import com.example.app.registration.repository.IntakeRepository;
import com.example.app.registration.repository.StudentRepository;
import com.example.app.repository.UserAccountRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudentRegistrationService {

    private static final String REQUIRED_PROFILE =
            "First name, last name, NIC number, faculty, degree, intake, and stream are required";

    private final StudentRelationValidationService studentRelationValidationService;
    private final StudentIdentityService studentIdentityService;
    private final StudentRepository studentRepository;
    private final UserAccountRepository userAccountRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final FacultyRepository facultyRepository;
    private final LmsDegreeProgramRepository degreeProgramRepository;
    private final IntakeRepository intakeRepository;
    private final PasswordEncoder passwordEncoder;
    private final MongoTemplate mongoTemplate;

    @Value("${app.registration.student-email-domain:student.smartcampus.local}")
    private String studentEmailDomain;

    public StudentListItemResponse create(StudentCreateRequest request) {
        String firstName = RegistrationStringUtils.trimToNull(request.getFirstName());
        String lastName = RegistrationStringUtils.trimToNull(request.getLastName());
        String nicNumber = RegistrationStringUtils.trimToNull(request.getNicNumber());
        String facultyId = RegistrationStringUtils.trimToNull(request.getFacultyId());
        String degreeProgramId = RegistrationStringUtils.trimToNull(request.getDegreeProgramId());
        String intakeId = RegistrationStringUtils.trimToNull(request.getIntakeId());
        String streamRaw = RegistrationStringUtils.trimToNull(request.getStream());

        if (firstName == null
                || lastName == null
                || nicNumber == null
                || facultyId == null
                || degreeProgramId == null
                || intakeId == null
                || streamRaw == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, REQUIRED_PROFILE);
        }

        StudentStream stream;
        try {
            stream = StudentStream.valueOf(streamRaw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, REQUIRED_PROFILE);
        }

        if (studentRepository.existsByNicNumberIgnoreCase(nicNumber)) {
            throw new ApiException(HttpStatus.CONFLICT, "NIC number already exists");
        }

        String subgroup = RegistrationStringUtils.trimToNull(request.getSubgroup());
        if (subgroup != null && subgroup.length() > 40) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Subgroup must be at most 40 characters");
        }

        AccountStatus profileStatus = request.getStatus() == null ? AccountStatus.ACTIVE : request.getStatus();
        if (profileStatus != AccountStatus.ACTIVE && profileStatus != AccountStatus.INACTIVE) {
            profileStatus = AccountStatus.ACTIVE;
        }

        AccountStatus enrollmentStatus =
                request.getEnrollmentStatus() == null ? AccountStatus.ACTIVE : request.getEnrollmentStatus();
        if (enrollmentStatus != AccountStatus.ACTIVE && enrollmentStatus != AccountStatus.INACTIVE) {
            enrollmentStatus = AccountStatus.ACTIVE;
        }

        String facultyCode = facultyId.toUpperCase(Locale.ROOT);
        String degreeCode = degreeProgramId.trim();

        studentRelationValidationService.validateStudentRelations(
                facultyCode, degreeCode, intakeId, stream, subgroup);

        String phone = RegistrationStringUtils.sanitizeOptionalContact(request.getPhone());
        String optionalEmail = RegistrationStringUtils.sanitizeOptionalContact(request.getOptionalEmail());

        Student student = null;
        String studentIdValue = null;
        for (int attempt = 0; attempt < 6; attempt++) {
            studentIdValue = studentIdentityService.reserveNextStudentIdentityInDb(intakeId);
            Student candidate = Student.builder()
                    .studentId(studentIdValue)
                    .firstName(firstName)
                    .lastName(lastName)
                    .nicNumber(nicNumber)
                    .phone(phone)
                    .optionalEmail(optionalEmail)
                    .status(profileStatus)
                    .build();
            try {
                student = studentRepository.save(candidate);
                break;
            } catch (DuplicateKeyException e) {
                String msg = String.valueOf(e.getMessage());
                if (msg.contains("nicNumber") || msg.contains("nic_number")) {
                    throw new ApiException(HttpStatus.CONFLICT, "NIC number already exists");
                }
            }
        }
        if (student == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Could not allocate a unique student id");
        }

        String email = student.getStudentId().toLowerCase(Locale.ROOT) + "@" + studentEmailDomain.toLowerCase(Locale.ROOT);
        UserAccount user = null;
        try {
            user = UserAccount.builder()
                    .fullName(firstName + " " + lastName)
                    .email(email)
                    .username(student.getStudentId())
                    .passwordHash(passwordEncoder.encode(nicNumber))
                    .role(Role.STUDENT)
                    .status(mapUserStatus(profileStatus))
                    .provider(AuthProvider.LOCAL)
                    .mustChangePassword(true)
                    .studentRef(student.getId())
                    .build();
            user = userAccountRepository.save(user);
        } catch (Exception e) {
            studentRepository.deleteById(student.getId());
            if (e instanceof DuplicateKeyException) {
                throw new ApiException(HttpStatus.CONFLICT, "Email or username already exists");
            }
            throw e;
        }

        student.setUserAccountId(user.getId());
        studentRepository.save(student);

        Enrollment enrollment = Enrollment.builder()
                .studentProfileId(student.getId())
                .facultyId(facultyCode)
                .degreeProgramId(degreeCode)
                .intakeId(intakeId.trim())
                .stream(stream)
                .subgroup(subgroup)
                .enrollmentStatus(enrollmentStatus)
                .build();
        try {
            enrollmentRepository.save(enrollment);
        } catch (Exception e) {
            userAccountRepository.deleteById(user.getId());
            studentRepository.deleteById(student.getId());
            throw e;
        }

        return toListItem(student, List.of(enrollment));
    }

    public PagedStudentListResponse list(
            String search, AccountStatus status, String sort, int page, int pageSize) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(pageSize, 1), 200);

        Query countQuery = buildStudentSearchQuery(search, status);
        long total = mongoTemplate.count(countQuery, Student.class);

        Query pageQuery = buildStudentSearchQuery(search, status);
        Sort sortObj = resolveSort(sort);
        Pageable pageable = PageRequest.of(safePage, safeSize, sortObj);
        pageQuery.with(pageable);

        List<Student> students = mongoTemplate.find(pageQuery, Student.class);
        List<String> ids = students.stream().map(Student::getId).collect(Collectors.toList());
        List<Enrollment> allEnrollments =
                ids.isEmpty() ? List.of() : enrollmentRepository.findByStudentProfileIdIn(ids);
        Map<String, List<Enrollment>> byStudent = new HashMap<>();
        for (Enrollment e : allEnrollments) {
            byStudent.computeIfAbsent(e.getStudentProfileId(), k -> new ArrayList<>()).add(e);
        }

        List<StudentListItemResponse> items = students.stream()
                .map(s -> toListItem(s, byStudent.getOrDefault(s.getId(), List.of())))
                .collect(Collectors.toList());

        int totalPages = safeSize == 0 ? 0 : (int) Math.ceil((double) total / safeSize);
        return PagedStudentListResponse.builder()
                .items(items)
                .totalElements(total)
                .totalPages(totalPages)
                .page(safePage)
                .pageSize(safeSize)
                .build();
    }

    private Query buildStudentSearchQuery(String search, AccountStatus status) {
        Query query = new Query();
        if (status != null) {
            query.addCriteria(Criteria.where("status").is(status));
        }
        if (search != null && !search.isBlank()) {
            String term = search.trim();
            String studentIdPart = term.contains("@") ? term.substring(0, term.indexOf('@')).trim() : term;
            Pattern pFull = Pattern.compile(Pattern.quote(term), Pattern.CASE_INSENSITIVE);
            Pattern pId = Pattern.compile(Pattern.quote(studentIdPart), Pattern.CASE_INSENSITIVE);
            query.addCriteria(new Criteria()
                    .orOperator(
                            Criteria.where("studentId").regex(pId),
                            Criteria.where("studentId").regex(pFull),
                            Criteria.where("firstName").regex(pFull),
                            Criteria.where("lastName").regex(pFull),
                            Criteria.where("optionalEmail").regex(pFull),
                            Criteria.where("nicNumber").regex(pFull)));
        }
        return query;
    }

    private Sort resolveSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        Sort.Direction dir =
                parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC;
        return Sort.by(dir, field);
    }

    private AccountStatus mapUserStatus(AccountStatus profile) {
        return profile == AccountStatus.INACTIVE ? AccountStatus.INACTIVE : AccountStatus.ACTIVE;
    }

    private StudentListItemResponse toListItem(Student s, List<Enrollment> enrollments) {
        String email = s.getStudentId().toLowerCase(Locale.ROOT) + "@" + studentEmailDomain.toLowerCase(Locale.ROOT);
        Optional<Enrollment> latest = enrollments.stream()
                .max(Comparator.comparing(Enrollment::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder())));

        LatestEnrollmentDto latestDto = null;
        if (latest.isPresent()) {
            Enrollment e = latest.get();
            Faculty faculty = facultyRepository.findById(e.getFacultyId()).orElse(null);
            LmsDegreeProgram degree = degreeProgramRepository.findById(e.getDegreeProgramId()).orElse(null);
            Intake intake = intakeRepository.findById(e.getIntakeId()).orElse(null);
            latestDto = LatestEnrollmentDto.builder()
                    .facultyCode(e.getFacultyId())
                    .facultyName(faculty != null ? faculty.getName() : null)
                    .degreeCode(e.getDegreeProgramId())
                    .degreeName(degree != null ? degree.getName() : null)
                    .intakeId(e.getIntakeId())
                    .intakeLabel(intake != null ? intake.getLabel() : null)
                    .currentTerm(null)
                    .stream(e.getStream())
                    .subgroup(e.getSubgroup())
                    .build();
        }

        return StudentListItemResponse.builder()
                .id(s.getId())
                .studentId(s.getStudentId())
                .firstName(s.getFirstName())
                .lastName(s.getLastName())
                .email(email)
                .optionalEmail(s.getOptionalEmail())
                .nicNumber(s.getNicNumber())
                .status(s.getStatus())
                .enrollmentCount(enrollments.size())
                .latestEnrollment(latestDto)
                .build();
    }
}
