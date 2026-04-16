package com.example.app.lms;

import com.example.app.lms.dto.CatalogModuleCreateRequest;
import com.example.app.lms.dto.CatalogModuleResponse;
import com.example.app.lms.dto.CatalogModuleUpdateRequest;
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
@RequestMapping("/api/v1/catalog/modules")
@RequiredArgsConstructor
public class CatalogModuleController {

    private final CatalogModuleService catalogModuleService;

    @GetMapping
    public PagedResponse<CatalogModuleResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String facultyCode,
            @RequestParam(required = false) String degreeIds,
            @RequestParam(required = false) String term,
            @RequestParam(required = false, defaultValue = "updated") String sort,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false) Integer pageSize) {
        return catalogModuleService.list(search, facultyCode, degreeIds, term, sort, page, pageSize);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogModuleResponse create(@Valid @RequestBody CatalogModuleCreateRequest request) {
        return catalogModuleService.create(request);
    }

    @PutMapping("/{code}")
    public CatalogModuleResponse update(@PathVariable String code, @Valid @RequestBody CatalogModuleUpdateRequest request) {
        return catalogModuleService.update(code, request);
    }

    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String code) {
        catalogModuleService.softDelete(code);
    }
}
