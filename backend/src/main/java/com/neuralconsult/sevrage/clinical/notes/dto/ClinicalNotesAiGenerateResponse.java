package com.neuralconsult.sevrage.clinical.notes.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record ClinicalNotesAiGenerateResponse(
    @JsonProperty("request_id") String requestId,
    @JsonProperty("medical_summary") String medicalSummary,
    @JsonProperty("complementary_note") String complementaryNote,
    @JsonProperty("validation") ClinicalNotesAiValidationResult validation,
    @JsonProperty("model_name") String modelName,
    @JsonProperty("references") List<Map<String, String>> references
) {
}

