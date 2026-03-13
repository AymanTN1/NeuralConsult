package com.neuralconsult.sevrage.onboarding.dto;

import com.neuralconsult.sevrage.user.dto.PatientProfileResponse;

public record OnboardingResponse(
    PatientProfileResponse profile,
    OnboardingAssessmentResponse assessment
) {
}
