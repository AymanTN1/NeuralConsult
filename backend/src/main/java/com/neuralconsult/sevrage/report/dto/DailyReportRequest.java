package com.neuralconsult.sevrage.report.dto;

import java.time.LocalDate;

public record DailyReportRequest(
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
