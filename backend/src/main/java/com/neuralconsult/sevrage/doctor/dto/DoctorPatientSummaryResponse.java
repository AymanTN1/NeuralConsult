package com.neuralconsult.sevrage.doctor.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DoctorPatientSummaryResponse(
    UUID patientProfileId,
    String patientName,
    String patientEmail,
    LocalDate dateOfBirth,
    String city,
    String occupation,
    Integer fagerstromScore,
    Integer hadAnxietyScore,
    Integer hadDepressionScore,
    boolean onboardingComplete,
    boolean testsComplete,
    boolean journalComplete,
    String dependenceLevel,
    Instant assignedAt
) {
}
