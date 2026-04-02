package com.neuralconsult.sevrage.clinical.intelligence.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record ClinicalIntelligenceAiGenerateResponse(
    @JsonProperty("request_id") String requestId,
    @JsonProperty("model_name") String modelName,
    @JsonProperty("phase_summaries") List<PhaseSummaryAiDto> phaseSummaries,
    @JsonProperty("global_summary") GlobalSummaryAiDto globalSummary,
    @JsonProperty("plan_candidates") List<AiPlanCandidateDto> planCandidates,
    List<Map<String, String>> references
) {
}
