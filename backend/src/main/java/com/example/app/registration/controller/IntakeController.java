package com.example.app.registration.controller;

import com.example.app.exception.ApiException;
import com.example.app.registration.IntakeRegistrationService;
import com.example.app.registration.IntakeSubgroupService;
import com.example.app.registration.dto.IntakeApiResponse;
import com.example.app.registration.dto.IntakeCreateRequest;
import com.example.app.registration.dto.IntakeMinimalResponse;
import com.example.app.registration.dto.IntakeSummaryResponse;
import com.example.app.registration.dto.PagedIntakeListResponse;
import com.example.app.registration.dto.SubgroupListResponse;
import com.example.app.entity.enums.AccountStatus;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/intakes")
@RequiredArgsConstructor
public class IntakeController {

    private final IntakeRegistrationService intakeRegistrationService;
    private final IntakeSubgroupService intakeSubgroupService;

    @GetMapping("/dropdown")
    public List<IntakeSummaryResponse> dropdown(
            @RequestParam(required = false) String facultyCode,
            @RequestParam(required = false) String faculty,
            @RequestParam(required = false) String facultyId,
            @RequestParam(required = false) String degreeCode,
            @RequestParam(required = false) String degree,
            @RequestParam(required = false) String degreeProgramId) {
        String fc = firstNonBlank(facultyCode, faculty, facultyId);
        String dc = firstNonBlank(degreeCode, degree, degreeProgramId);
        return intakeRegistrationService.listForDropdown(fc, dc);
    }

    @GetMapping
    public PagedIntakeListResponse list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "updated") String sort,
            @RequestParam(required = false) String faculty,
            @RequestParam(required = false) String facultyId,
            @RequestParam(required = false) String facultyCode,
            @RequestParam(required = false) String degree,
            @RequestParam(required = false) String degreeProgramId,
            @RequestParam(required = false) String degreeCode,
            @RequestParam(required = false) String currentTerm,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "25") int pageSize) {
        String fc = firstNonBlank(faculty, facultyId, facultyCode);
        String dc = firstNonBlank(degree, degreeProgramId, degreeCode);
        return intakeRegistrationService.listPaged(
                search, status, sort, fc, dc, currentTerm, page, pageSize);
    }

    @GetMapping("/{id}/detail")
    public IntakeApiResponse getDetail(@PathVariable String id) {
        if (id == null || id.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Intake id is required");
        }
        return intakeRegistrationService.getFull(id);
    }

    @GetMapping("/{id}")
    public IntakeMinimalResponse getMinimal(@PathVariable String id) {
        if (id == null || id.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Intake id is required");
        }
        return intakeRegistrationService.getMinimal(id);
    }

    @GetMapping("/{intakeId}/subgroups")
    public SubgroupListResponse listSubgroups(
            @PathVariable String intakeId,
            @RequestParam(required = false) String facultyId,
            @RequestParam(required = false) String degreeProgramId,
            @RequestParam(required = false) String stream,
            @RequestParam(required = false) AccountStatus status) {
        return intakeSubgroupService.listSubgroups(intakeId, facultyId, degreeProgramId, stream, status);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IntakeApiResponse create(@Valid @RequestBody IntakeCreateRequest request) {
        return intakeRegistrationService.create(request);
    }

    @PutMapping("/{id}")
    public IntakeApiResponse update(@PathVariable String id, @Valid @RequestBody IntakeCreateRequest request) {
        if (id == null || id.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Intake id is required");
        }
        return intakeRegistrationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        if (id == null || id.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Intake id is required");
        }
        intakeRegistrationService.softDelete(id);
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return null;
    }
}
