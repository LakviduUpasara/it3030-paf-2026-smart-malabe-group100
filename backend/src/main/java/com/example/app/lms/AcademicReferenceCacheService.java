package com.example.app.lms;

import com.example.app.lms.document.Faculty;
import com.example.app.lms.document.LmsDegreeProgram;
import com.example.app.lms.repository.FacultyRepository;
import com.example.app.lms.repository.LmsDegreeProgramRepository;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * In-memory reference data refreshed after faculty / degree mutations so UI and services stay aligned with DB.
 */
@Service
@RequiredArgsConstructor
public class AcademicReferenceCacheService {

    private final FacultyRepository facultyRepository;
    private final LmsDegreeProgramRepository degreeProgramRepository;

    private volatile Map<String, Faculty> facultyByCode = Map.of();
    private volatile Map<String, List<LmsDegreeProgram>> degreesByFaculty = Map.of();

    public void syncAcademicReferenceCaches(boolean force) {
        if (!force && !facultyByCode.isEmpty()) {
            return;
        }
        List<Faculty> faculties = facultyRepository.findByIsDeletedFalseOrderByUpdatedAtDescCodeAsc();
        Map<String, Faculty> nextFaculty = faculties.stream()
                .collect(Collectors.toMap(Faculty::getCode, f -> f, (a, b) -> a));
        facultyByCode = nextFaculty;

        List<LmsDegreeProgram> degrees = degreeProgramRepository.findByIsDeletedFalseOrderByUpdatedAtDesc();
        degreesByFaculty = degrees.stream().collect(Collectors.groupingBy(LmsDegreeProgram::getFacultyCode));
    }

    public Map<String, Faculty> getFacultyByCode() {
        syncAcademicReferenceCaches(false);
        return facultyByCode;
    }

    public Faculty findFaculty(String code) {
        if (code == null) {
            return null;
        }
        syncAcademicReferenceCaches(false);
        return facultyByCode.get(code.trim().toUpperCase());
    }
}
