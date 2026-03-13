package com.neuralconsult.sevrage.medical.tests.dto;

import java.time.Instant;
import java.util.UUID;

public record HadTestResponse(
    UUID id,
    Instant createdAt,
    int q1,
    int q2,
    int q3,
    int q4,
    int q5,
    int q6,
    int q7,
    int q8,
    int q9,
    int q10,
    int q11,
    int q12,
    int q13,
    int q14,
    int anxietyScore,
    String anxietyInterpretation,
    int depressionScore,
    String depressionInterpretation
) {
}
