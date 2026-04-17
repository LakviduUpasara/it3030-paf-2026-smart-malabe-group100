package com.example.app.registration.repository;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.registration.document.Enrollment;
import com.example.app.registration.enums.StudentStream;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface EnrollmentRepository extends MongoRepository<Enrollment, String> {

    List<Enrollment> findByStudentProfileId(String studentProfileId);

    void deleteByStudentProfileId(String studentProfileId);

    List<Enrollment> findByIntakeIdAndEnrollmentStatus(String intakeId, AccountStatus enrollmentStatus);

    List<Enrollment> findByEnrollmentStatus(AccountStatus enrollmentStatus);

    List<Enrollment> findByStudentProfileIdIn(Collection<String> studentProfileIds);

    boolean existsByIntakeIdAndFacultyIdAndDegreeProgramIdAndStreamAndSubgroupAndEnrollmentStatus(
            String intakeId,
            String facultyId,
            String degreeProgramId,
            StudentStream stream,
            String subgroup,
            AccountStatus enrollmentStatus);

    List<Enrollment> findByIntakeIdAndFacultyIdAndDegreeProgramIdAndStream(
            String intakeId, String facultyId, String degreeProgramId, StudentStream stream);

    Optional<Enrollment> findFirstByStudentProfileIdOrderByCreatedAtDesc(String studentProfileId);
}
