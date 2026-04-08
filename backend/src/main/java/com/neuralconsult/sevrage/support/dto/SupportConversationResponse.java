package com.neuralconsult.sevrage.support.dto;

import java.util.List;
import java.util.UUID;

public record SupportConversationResponse(
    UUID conversationId,
    UUID patientProfileId,
    UUID doctorProfileId,
    String doctorName,
    String latestRiskLevel,
    String latestSummary,
    List<SupportMessageResponse> messages,
    List<DoctorAlertResponse> alerts
) {
}
