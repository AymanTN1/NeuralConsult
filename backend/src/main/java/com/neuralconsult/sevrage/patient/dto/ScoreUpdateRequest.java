package com.neuralconsult.sevrage.patient.dto;

public record ScoreUpdateRequest(
    Integer fagerstromScore,
    Integer hadAnxietyScore,
    Integer hadDepressionScore
) {
}
