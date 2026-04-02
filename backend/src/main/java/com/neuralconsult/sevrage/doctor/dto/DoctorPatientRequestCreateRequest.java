package com.neuralconsult.sevrage.doctor.dto;

import java.util.UUID;

public record DoctorPatientRequestCreateRequest(
    UUID doctorProfileId,
    String patientMessage
) {
}
