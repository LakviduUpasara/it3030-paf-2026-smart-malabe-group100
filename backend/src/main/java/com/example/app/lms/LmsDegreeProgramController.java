package com.example.app.lms;

import com.example.app.lms.dto.DegreeProgramCreateRequest;
import com.example.app.lms.dto.DegreeProgramResponse;
import com.example.app.lms.dto.DegreeProgramUpdateRequest;
import com.example.app.lms.dto.PagedResponse;
import jakarta.validation.Valid;
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
@RequestMapping("/api/v1/degree-programs")
@RequiredArgsConstructor
public class LmsDegreeProgramController {

    private final LmsDegreeProgramService lmsDegreeProgramService;

    @GetMapping
    public PagedResponse<DegreeProgramResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String faculty,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String award,
            @RequestParam(required = false) Integer creditsMin,
            @RequestParam(required = false) Integer creditsMax,
            @RequestParam(required = false) Integer durationYears,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "updated") String sort,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false) Integer pageSize) {
        return lmsDegreeProgramService.list(
                search, faculty, code, award, creditsMin, creditsMax, durationYears, status, sort, page, pageSize);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DegreeProgramResponse create(@Valid @RequestBody DegreeProgramCreateRequest request) {
        return lmsDegreeProgramService.create(request);
    }

    @PutMapping("/{code}")
    public DegreeProgramResponse update(@PathVariable String code, @Valid @RequestBody DegreeProgramUpdateRequest request) {
        return lmsDegreeProgramService.update(code, request);
    }

    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String code) {
        lmsDegreeProgramService.softDelete(code);
    }
}
