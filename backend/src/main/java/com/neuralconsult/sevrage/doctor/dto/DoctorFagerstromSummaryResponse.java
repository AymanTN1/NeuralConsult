package com.neuralconsult.sevrage.doctor.dto;

import java.time.Instant;
import java.util.UUID;

public record DoctorFagerstromSummaryResponse(
    UUID id,
    Integer totalScore,
    String dependenceLevel,
    String timeToFirstCigarette,
    String cigarettesPerDay,
    Instant createdAt
) {
}
