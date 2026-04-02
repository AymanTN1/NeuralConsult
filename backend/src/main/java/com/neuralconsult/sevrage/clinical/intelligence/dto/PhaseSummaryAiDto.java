package com.neuralconsult.sevrage.clinical.intelligence.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record PhaseSummaryAiDto(
    @JsonProperty("phase_id") Integer phaseId,
    @JsonProperty("phase_title") String phaseTitle,
    String summary,
    @JsonProperty("attention_points") List<String> attentionPoints,
    @JsonProperty("missing_information") List<String> missingInformation
) {
}
