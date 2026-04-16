package com.example.app.exception;

public class ModuleOfferingNotFoundException extends RuntimeException {

    public ModuleOfferingNotFoundException(Long moduleOfferingId) {
        super("Module offering not found with id: " + moduleOfferingId);
    }
}
