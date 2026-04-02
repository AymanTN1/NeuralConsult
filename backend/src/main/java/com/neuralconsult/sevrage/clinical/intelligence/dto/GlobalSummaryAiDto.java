package com.neuralconsult.sevrage.clinical.intelligence.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record GlobalSummaryAiDto(
    String summary,
    @JsonProperty("doctor_focus_points") List<String> doctorFocusPoints,
    @JsonProperty("patient_readiness") String patientReadiness,
    @JsonProperty("missing_information") List<String> missingInformation
) {
}
