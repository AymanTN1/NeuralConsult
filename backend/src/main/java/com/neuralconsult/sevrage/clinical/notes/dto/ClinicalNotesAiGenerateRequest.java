package com.neuralconsult.sevrage.clinical.notes.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public record ClinicalNotesAiGenerateRequest(
    @JsonProperty("request_id") String requestId,
    @JsonProperty("facts") Map<String, Object> facts
) {
}

