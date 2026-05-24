package com.neuralconsult.sevrage.support.dto;

import java.util.List;

public record AiSupportVoiceChatResponse(
    String requestId,
    String transcription,
    Integer voiceStressScore,
    String voiceStressLevel,
    String voiceStressSummary,
    List<String> voiceStressSignals,
    String reply,
    String riskLevel,
    Boolean shouldAlertDoctor,
    String alertReason,
    String recommendedDoctorAction,
    String summary,
    String modelName
) {
}
