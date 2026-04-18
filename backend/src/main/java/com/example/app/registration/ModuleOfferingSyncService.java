package com.example.app.registration;

import com.example.app.registration.document.LabAssistant;
import com.example.app.registration.document.Lecturer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ModuleOfferingSyncService {

    public void syncLecturerAssignmentsAcrossModuleOfferings(Lecturer lecturer) {
        log.debug("syncLecturerAssignmentsAcrossModuleOfferings lecturerId={}", lecturer.getId());
    }

    public void syncLabAssistantAssignmentsAcrossModuleOfferings(LabAssistant labAssistant) {
        log.debug("syncLabAssistantAssignmentsAcrossModuleOfferings labAssistantId={}", labAssistant.getId());
    }
}
