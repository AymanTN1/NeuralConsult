package com.neuralconsult.sevrage.doctor.dto;

import java.util.UUID;

public record DoctorPatientSummaryResponse(
    UUID patientProfileId,
    String patientName,
    Integer fagerstromScore,
    Integer hadAnxietyScore,
    Integer hadDepressionScore,
    boolean onboardingComplete
) {
}
