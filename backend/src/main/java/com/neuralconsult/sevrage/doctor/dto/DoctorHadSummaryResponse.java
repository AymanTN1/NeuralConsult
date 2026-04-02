package com.neuralconsult.sevrage.doctor.dto;

import java.time.Instant;
import java.util.UUID;

public record DoctorHadSummaryResponse(
    UUID id,
    Integer anxietyScore,
    Integer depressionScore,
    String anxietyInterpretation,
    String depressionInterpretation,
    Instant createdAt
) {
}
