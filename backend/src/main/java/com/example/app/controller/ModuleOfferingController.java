package com.example.app.controller;

import com.example.app.dto.ModuleOfferingRequest;
import com.example.app.dto.ModuleOfferingResponse;
import com.example.app.service.ModuleOfferingService;
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
@RequestMapping("/api/v1/module-offerings")
@RequiredArgsConstructor
public class ModuleOfferingController {

    private final ModuleOfferingService moduleOfferingService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ModuleOfferingResponse createModuleOffering(@Valid @RequestBody ModuleOfferingRequest request) {
        return moduleOfferingService.createModuleOffering(request);
    }

    @GetMapping
    public List<ModuleOfferingResponse> getAllModuleOfferings(
            @RequestParam(required = false) Long academicModuleId,
            @RequestParam(required = false) Long semesterId) {
        return moduleOfferingService.getAllModuleOfferings(academicModuleId, semesterId);
    }

    @GetMapping("/{id}")
    public ModuleOfferingResponse getModuleOfferingById(@PathVariable Long id) {
        return moduleOfferingService.getModuleOfferingById(id);
    }

    @PutMapping("/{id}")
    public ModuleOfferingResponse updateModuleOffering(
            @PathVariable Long id,
            @Valid @RequestBody ModuleOfferingRequest request) {
        return moduleOfferingService.updateModuleOffering(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteModuleOffering(@PathVariable Long id) {
        moduleOfferingService.deleteModuleOffering(id);
    }
}
