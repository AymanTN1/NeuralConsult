package com.neuralconsult.sevrage.support.dto;

public record AiSupportChatResponse(
    String reply,
    String riskLevel,
    Boolean shouldAlertDoctor,
    String alertReason,
    String recommendedDoctorAction,
    String summary,
    String modelName
) {
}
