package com.neuralconsult.sevrage.clinical.intelligence.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ClinicalIntelligenceResponse(
    List<PhaseSummaryResponse> phaseSummaries,
    GlobalSummaryResponse globalSummary,
    List<PlanCandidateResponse> planCandidates,
    ValidatedPlanResponse validatedPlan
) {
  public record PhaseSummaryResponse(
      UUID id,
      Integer phaseId,
      String phaseTitle,
      String summary,
      List<String> attentionPoints,
      List<String> missingInformation,
      String modelName,
      Instant updatedAt
  ) {
  }

  public record GlobalSummaryResponse(
      UUID id,
      String summary,
      List<String> doctorFocusPoints,
      String patientReadiness,
      List<String> missingInformation,
      String modelName,
      Instant updatedAt
  ) {
  }

  public record PlanCandidateResponse(
      UUID id,
      String track,
      String title,
      String rationale,
      String nrtRecommendation,
      String behavioralFocus,
      String followUpPlan,
      List<String> doctorWarnings,
      List<String> steps,
      String modelName,
      Instant updatedAt
  ) {
  }

  public record ValidatedPlanResponse(
      UUID id,
      String track,
      String title,
      String summary,
      String nrtRecommendation,
      String behavioralFocus,
      String followUpPlan,
      String doctorNote,
      List<String> steps,
      Instant validatedAt
  ) {
  }
}
