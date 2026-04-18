package com.example.app.lms.document;

import com.example.app.lms.enums.OutlineWeekType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutlineWeek {

    private int weekNo;

    private String title;

    private OutlineWeekType type;
}
