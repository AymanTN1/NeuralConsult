package com.neuralconsult.sevrage.medical.tests.dto;

import com.neuralconsult.sevrage.medical.scoring.dto.FagerstromRequest;
import java.time.Instant;
import java.util.UUID;

public record FagerstromTestResponse(
    UUID id,
    Instant createdAt,
    FagerstromRequest.TimeToFirstCigarette timeToFirstCigarette,
    boolean difficultToRefrain,
    FagerstromRequest.MostDifficultCigarette mostDifficultCigarette,
    FagerstromRequest.CigarettesPerDay cigarettesPerDay,
    boolean smokeMoreInMorning,
    boolean smokeWhenIll,
    int totalScore,
    String dependenceLevel
) {
}
