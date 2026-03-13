package com.neuralconsult.sevrage.report.dto;

import java.time.LocalDate;
import java.util.UUID;

public record DailyReportResponse(
    UUID id,
    LocalDate reportDate,
    Integer cigarettesSmoked,
    Integer cravingsIntensity,
    Integer moodScore,
    Integer stressScore,
    Boolean usedNrt,
    Boolean relapseEvent,
    String notes
) {
}
