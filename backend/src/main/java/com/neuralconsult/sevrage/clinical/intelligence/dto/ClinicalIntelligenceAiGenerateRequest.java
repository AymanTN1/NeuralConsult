package com.neuralconsult.sevrage.clinical.intelligence.dto;

import java.util.Map;

public record ClinicalIntelligenceAiGenerateRequest(
    String requestId,
    Map<String, Object> facts
) {
}
