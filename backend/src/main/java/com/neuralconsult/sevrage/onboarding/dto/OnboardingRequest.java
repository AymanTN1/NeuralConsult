package com.neuralconsult.sevrage.onboarding.dto;

import com.neuralconsult.sevrage.onboarding.OnboardingAssessment;
import com.neuralconsult.sevrage.patient.PatientProfile.Sex;
import java.time.LocalDate;

public record OnboardingRequest(
    LocalDate dateOfBirth,
    Sex sex,
    Integer heightCm,
    Integer weightKg,
    String city,
    String countryCode,
    String occupation,
    Integer cigarettesPerDay,
    Integer smokingStartAge,
    String medicalHistoryNotes,
    Integer quitAttempts,
    Integer longestQuitDays,
    Integer motivationScore,
    Integer confidenceScore,
    Boolean smokesAtHome,
    Boolean usesOtherTobacco,
    String triggers,
    Boolean cageCutDown,
    Boolean cageAnnoyed,
    Boolean cageGuilty,
    Boolean cageEyeOpener,
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
    String notes
) {
}
