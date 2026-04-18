package com.example.app.lms.dto;

import com.example.app.lms.enums.OutlineWeekType;
import lombok.Data;

@Data
public class OutlineWeekDto {

    private int weekNo;
    private String title;
    private OutlineWeekType type;
}
