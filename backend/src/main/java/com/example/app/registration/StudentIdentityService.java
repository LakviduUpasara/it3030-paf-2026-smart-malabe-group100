package com.example.app.registration;

import com.example.app.exception.ApiException;
import com.example.app.registration.document.Intake;
import com.example.app.registration.repository.IntakeRepository;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudentIdentityService {

    private final IntakeRepository intakeRepository;
    private final SequenceCounterService sequenceCounterService;

    public String reserveNextStudentIdentityInDb(String intakeId) {
        Intake intake = intakeRepository
                .findById(intakeId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Select a valid intake"));
        String prefix = resolveStudentPrefix(intake);
        long seq = sequenceCounterService.next("student_seq:" + intakeId);
        return prefix + String.format(Locale.ROOT, "%04d", seq);
    }

    String resolveStudentPrefix(Intake intake) {
        if (intake.getStudentIdPrefix() != null && !intake.getStudentIdPrefix().isBlank()) {
            return intake.getStudentIdPrefix().trim().toUpperCase(Locale.ROOT);
        }
        String degree = intake.getDegreeCode() == null ? "XX" : intake.getDegreeCode().trim().toUpperCase(Locale.ROOT);
        String shortDeg = degree.length() >= 2 ? degree.substring(0, 2) : degree;
        if (intake.getIntakeYear() != null && intake.getIntakeMonth() != null) {
            int m = IntakeMonthUtils.monthNumber(intake.getIntakeMonth());
            if (m <= 0) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST, "Selected intake has invalid year/month configuration");
            }
            return shortDeg
                    + String.format(Locale.ROOT, "%02d%02d", intake.getIntakeYear() % 100, m);
        }
        YearMonth ym = YearMonth.now(ZoneId.systemDefault());
        return shortDeg + String.format(Locale.ROOT, "%02d%02d", ym.getYear() % 100, ym.getMonthValue());
    }
}
