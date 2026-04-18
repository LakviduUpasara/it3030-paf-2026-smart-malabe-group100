package com.example.app.lms;

import com.example.app.lms.document.StaffAssigneeSnapshot;
import com.example.app.lms.dto.LmsModuleOfferingApiResponse;
import com.example.app.lms.dto.LmsModuleOfferingPageResponse;
import com.example.app.lms.dto.LmsModuleOfferingWriteRequest;
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
@RequestMapping("/api/v1/module-offerings")
@RequiredArgsConstructor
public class LmsModuleOfferingController {

    private final LmsModuleOfferingService lmsModuleOfferingService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LmsModuleOfferingApiResponse create(@RequestBody LmsModuleOfferingWriteRequest body) {
        return lmsModuleOfferingService.create(body);
    }

    @GetMapping("/eligible-lecturers")
    public List<StaffAssigneeSnapshot> eligibleLecturers(
            @RequestParam String facultyCode,
            @RequestParam String degreeCode,
            @RequestParam String moduleCode) {
        return lmsModuleOfferingService.listEligibleLecturers(facultyCode, degreeCode, moduleCode);
    }

    @GetMapping("/eligible-lab-assistants")
    public List<StaffAssigneeSnapshot> eligibleLabAssistants(
            @RequestParam String facultyCode,
            @RequestParam String degreeCode,
            @RequestParam String moduleCode) {
        return lmsModuleOfferingService.listEligibleLabAssistants(facultyCode, degreeCode, moduleCode);
    }

    @GetMapping
    public LmsModuleOfferingPageResponse list(
            @RequestParam(required = false) String facultyCode,
            @RequestParam(required = false) String facultyId,
            @RequestParam(required = false) String degreeCode,
            @RequestParam(required = false) String degreeProgramId,
            @RequestParam(required = false) String degreeId,
            @RequestParam(required = false) String intakeName,
            @RequestParam(required = false) String intakeId,
            @RequestParam(required = false) String termCode,
            @RequestParam(required = false) String moduleCode,
            @RequestParam(required = false) String moduleId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "updated") String sort,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false) Integer pageSize) {
        return lmsModuleOfferingService.list(
                facultyCode,
                facultyId,
                degreeCode,
                degreeProgramId,
                degreeId,
                intakeName,
                intakeId,
                termCode,
                moduleCode,
                moduleId,
                search,
                status,
                sort,
                page,
                pageSize);
    }

    @GetMapping("/{id}")
    public LmsModuleOfferingApiResponse getById(@PathVariable String id) {
        return lmsModuleOfferingService.getById(id);
    }

    @PutMapping("/{id}")
    public LmsModuleOfferingApiResponse update(
            @PathVariable String id, @RequestBody LmsModuleOfferingWriteRequest body) {
        return lmsModuleOfferingService.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        lmsModuleOfferingService.softDelete(id);
    }
}
