package com.neuralconsult.sevrage.user.dto;

public record ScoresResponse(
    Integer fagerstromScore,
    Integer hadAnxietyScore,
    Integer hadDepressionScore
) {
}
