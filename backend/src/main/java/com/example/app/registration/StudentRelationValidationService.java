package com.example.app.registration;

import com.example.app.exception.ApiException;
import com.example.app.lms.document.Faculty;
import com.example.app.lms.document.LmsDegreeProgram;
import com.example.app.lms.repository.FacultyRepository;
import com.example.app.lms.repository.LmsDegreeProgramRepository;
import com.example.app.registration.document.Intake;
import com.example.app.registration.enums.StudentStream;
import com.example.app.registration.repository.EnrollmentRepository;
import com.example.app.registration.repository.IntakeRepository;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudentRelationValidationService {

    private final FacultyRepository facultyRepository;
    private final LmsDegreeProgramRepository degreeProgramRepository;
    private final IntakeRepository intakeRepository;
    private final EnrollmentRepository enrollmentRepository;

    public void validateStudentRelations(
            String facultyId,
            String degreeProgramId,
            String intakeId,
            StudentStream stream,
            String subgroupRaw) {

        String facultyCode = facultyId == null ? null : facultyId.trim().toUpperCase(Locale.ROOT);
        String degreeCode = degreeProgramId == null ? null : degreeProgramId.trim();
        String intakeKey = intakeId == null ? null : intakeId.trim();

        Faculty faculty = facultyRepository
                .findByCodeAndIsDeletedFalse(facultyCode)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Select a valid faculty"));

        LmsDegreeProgram degree = degreeProgramRepository
                .findByCodeAndIsDeletedFalse(degreeCode)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Select a valid degree"));

        if (!faculty.getCode().equalsIgnoreCase(degree.getFacultyCode())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected degree does not belong to selected faculty");
        }

        Intake intake = intakeRepository
                .findById(intakeKey)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Select a valid intake"));

        if (intake.isDeleted()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a valid intake");
        }

        if (!faculty.getCode().equalsIgnoreCase(intake.getFacultyCode())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected intake does not belong to selected faculty");
        }
        if (!degree.getCode().equalsIgnoreCase(intake.getDegreeCode())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected intake does not belong to selected degree");
        }

        String subgroup = RegistrationStringUtils.trimToNull(subgroupRaw);
        if (subgroup != null) {
            boolean exists = enrollmentRepository.existsByIntakeIdAndFacultyIdAndDegreeProgramIdAndStreamAndSubgroupAndEnrollmentStatus(
                    intake.getId(),
                    facultyCode,
                    degreeCode,
                    stream,
                    subgroup,
                    com.example.app.entity.enums.AccountStatus.ACTIVE);
            if (!exists) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Select subgroup from the available list");
            }
        }
    }
}
