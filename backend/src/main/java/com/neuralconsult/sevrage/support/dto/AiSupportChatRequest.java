package com.neuralconsult.sevrage.support.dto;

import java.util.List;
import java.util.Map;

public record AiSupportChatRequest(
    String requestId,
    Map<String, Object> patientFacts,
    List<Map<String, String>> conversationHistory,
    String latestPatientMessage,
    Boolean emergencyMode,
    String preferredLanguage
) {
}
