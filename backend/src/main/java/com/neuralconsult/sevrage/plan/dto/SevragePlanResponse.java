package com.neuralconsult.sevrage.plan.dto;

import java.time.LocalDate;
import java.util.List;

public record SevragePlanResponse(
    String intensity,
    String summary,
    String nrtRecommendation,
    String behavioralRecommendations,
    String followUpPlan,
    String relapseProtocol,
    LocalDate startDate,
    LocalDate targetQuitDate,
    List<String> steps
) {
}
