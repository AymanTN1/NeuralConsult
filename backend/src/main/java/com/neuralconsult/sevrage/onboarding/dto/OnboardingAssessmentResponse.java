package com.neuralconsult.sevrage.onboarding.dto;

import com.neuralconsult.sevrage.onboarding.OnboardingAssessment;

public record OnboardingAssessmentResponse(
    Integer quitAttempts,
    Integer longestQuitDays,
    Integer motivationScore,
    Integer confidenceScore,
    Boolean smokesAtHome,
    Boolean usesOtherTobacco,
    String triggers,
    String notes,
    Boolean cageCutDown,
    Boolean cageAnnoyed,
    Boolean cageGuilty,
    Boolean cageEyeOpener,
    Integer cageScore,
    Boolean cagePositive,
    Boolean cannabisLast12Months,
    OnboardingAssessment.CannabisFrequency cannabisFrequency,
    Integer weightConcernScore,
    Integer weightConfidenceScore,
    OnboardingAssessment.PhysicalActivityLevel physicalActivityLevel,
    Boolean honcQ1,
    Boolean honcQ2,
    Boolean honcQ3,
    Boolean honcQ4,
    Boolean honcQ5,
    Boolean honcQ6,
    Boolean honcQ7,
    Boolean honcQ8,
    Boolean honcQ9,
    Boolean honcQ10,
    Integer honcScore,
    Boolean honcHighDependence
) {
}
