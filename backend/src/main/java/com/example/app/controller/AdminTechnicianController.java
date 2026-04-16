package com.example.app.controller;

import com.example.app.dto.TechnicianSummaryResponse;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.Role;
import com.example.app.repository.UserAccountRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/technicians")
@CrossOrigin
public class AdminTechnicianController {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @GetMapping
    public ResponseEntity<List<TechnicianSummaryResponse>> listTechnicians() {
        List<TechnicianSummaryResponse> list = userAccountRepository.findByRoleOrderByFullNameAsc(Role.TECHNICIAN)
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    private TechnicianSummaryResponse toSummary(UserAccount u) {
        TechnicianSummaryResponse r = new TechnicianSummaryResponse();
        r.setId(u.getId());
        r.setFullName(u.getFullName());
        r.setEmail(u.getEmail());
        return r;
    }
}
