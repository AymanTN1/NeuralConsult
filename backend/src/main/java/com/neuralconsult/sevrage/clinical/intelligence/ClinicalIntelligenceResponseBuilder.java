package com.neuralconsult.sevrage.clinical.intelligence;

import com.neuralconsult.sevrage.clinical.intelligence.dto.ClinicalIntelligenceResponse;
import java.util.List;

public final class ClinicalIntelligenceResponseBuilder {

  private ClinicalIntelligenceResponseBuilder() {
  }

  public static ClinicalIntelligenceResponse build(
      List<AiPhaseSummary> phaseSummaries,
      AiGlobalSummary globalSummary,
      List<AiPlanCandidate> planCandidates,
      ValidatedTreatmentPlan validatedPlan
  ) {
    return new ClinicalIntelligenceResponse(
        phaseSummaries.stream()
            .map(item -> new ClinicalIntelligenceResponse.PhaseSummaryResponse(
                item.getId(),
                item.getPhaseId(),
                item.getPhaseTitle(),
                item.getSummary(),
                item.getDoctorNote(),
                item.getAttentionPoints(),
                item.getMissingInformation(),
                item.getModelName(),
                item.getUpdatedAt()
            ))
            .toList(),
        globalSummary != null
            ? new ClinicalIntelligenceResponse.GlobalSummaryResponse(
                globalSummary.getId(),
                globalSummary.getSummary(),
                globalSummary.getDoctorFocusPoints(),
                globalSummary.getPatientReadiness(),
                globalSummary.getMissingInformation(),
                globalSummary.getModelName(),
                globalSummary.getUpdatedAt()
            )
            : null,
        planCandidates.stream()
            .map(item -> new ClinicalIntelligenceResponse.PlanCandidateResponse(
                item.getId(),
                item.getTrack().name(),
                item.getTitle(),
                item.getRationale(),
                item.getNrtRecommendation(),
                item.getBehavioralFocus(),
                item.getFollowUpPlan(),
                item.getDoctorWarnings(),
                item.getSteps(),
                item.getModelName(),
                item.getUpdatedAt()
            ))
            .toList(),
        validatedPlan != null
            ? new ClinicalIntelligenceResponse.ValidatedPlanResponse(
                validatedPlan.getId(),
                validatedPlan.getTrack().name(),
                validatedPlan.getTitle(),
                validatedPlan.getSummary(),
                validatedPlan.getNrtRecommendation(),
                validatedPlan.getBehavioralFocus(),
                validatedPlan.getFollowUpPlan(),
                validatedPlan.getDoctorNote(),
                validatedPlan.getSteps(),
                validatedPlan.getValidatedAt()
            )
            : null
    );
  }
}
