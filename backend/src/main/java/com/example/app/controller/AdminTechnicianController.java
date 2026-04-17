package com.example.app.controller;

import com.example.app.dto.TechnicianSummaryResponse;
import com.example.app.dto.admin.CreateTechnicianRequest;
import com.example.app.dto.admin.UpdateTechnicianRequest;
import com.example.app.service.AdminTechnicianService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/technicians")
@CrossOrigin
@RequiredArgsConstructor
public class AdminTechnicianController {

    private final AdminTechnicianService adminTechnicianService;

    @GetMapping
    public ResponseEntity<List<TechnicianSummaryResponse>> listTechnicians() {
        return ResponseEntity.ok(adminTechnicianService.listTechnicians());
    }

    @PostMapping
    public ResponseEntity<TechnicianSummaryResponse> create(@Valid @RequestBody CreateTechnicianRequest request) {
        return ResponseEntity.ok(adminTechnicianService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TechnicianSummaryResponse> update(
            @PathVariable String id, @Valid @RequestBody UpdateTechnicianRequest request) {
        return ResponseEntity.ok(adminTechnicianService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        adminTechnicianService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
