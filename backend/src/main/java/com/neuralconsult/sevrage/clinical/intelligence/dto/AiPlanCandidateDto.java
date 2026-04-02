package com.neuralconsult.sevrage.clinical.intelligence.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record AiPlanCandidateDto(
    String track,
    String title,
    String rationale,
    @JsonProperty("nrt_recommendation") String nrtRecommendation,
    @JsonProperty("behavioral_focus") String behavioralFocus,
    @JsonProperty("follow_up_plan") String followUpPlan,
    @JsonProperty("doctor_warnings") List<String> doctorWarnings,
    List<String> steps
) {
}
