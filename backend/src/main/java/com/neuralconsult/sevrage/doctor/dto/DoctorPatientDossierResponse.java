package com.neuralconsult.sevrage.doctor.dto;

import com.neuralconsult.sevrage.clinical.intelligence.dto.ClinicalIntelligenceResponse;
import com.neuralconsult.sevrage.clinical.notes.dto.ClinicalNoteResponse;
import com.neuralconsult.sevrage.onboarding.dto.OnboardingAssessmentResponse;
import com.neuralconsult.sevrage.user.dto.PatientProfileResponse;
import java.util.UUID;

public record DoctorPatientDossierResponse(
    UUID patientProfileId,
    String patientName,
    String patientEmail,
    PatientProfileResponse profile,
    OnboardingAssessmentResponse assessment,
    DoctorFagerstromSummaryResponse latestFagerstrom,
    DoctorHadSummaryResponse latestHad,
    ClinicalNoteResponse clinicalNote,
    ClinicalIntelligenceResponse clinicalIntelligence
) {
}
