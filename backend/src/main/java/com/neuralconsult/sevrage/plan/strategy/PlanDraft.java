package com.neuralconsult.sevrage.plan.strategy;

import com.neuralconsult.sevrage.plan.SevragePlan;
import java.time.LocalDate;
import java.util.List;

public record PlanDraft(
    SevragePlan.PlanIntensity intensity,
    String summary,
    String nrtRecommendation,
    String behavioralRecommendations,
    String followUpPlan,
    String relapseProtocol,
    List<String> steps,
    LocalDate targetQuitDate
) {
}
