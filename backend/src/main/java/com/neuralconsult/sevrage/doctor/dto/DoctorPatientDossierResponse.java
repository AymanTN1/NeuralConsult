package com.neuralconsult.sevrage.doctor.dto;

import com.neuralconsult.sevrage.appointment.dto.AppointmentResponse;
import com.neuralconsult.sevrage.clinical.intelligence.dto.ClinicalIntelligenceResponse;
import com.neuralconsult.sevrage.clinical.notes.dto.ClinicalNoteResponse;
import com.neuralconsult.sevrage.medical.tests.dto.FagerstromTestResponse;
import com.neuralconsult.sevrage.medical.tests.dto.HadTestResponse;
import com.neuralconsult.sevrage.onboarding.dto.OnboardingAssessmentResponse;
import com.neuralconsult.sevrage.report.dto.DailyReportResponse;
import com.neuralconsult.sevrage.support.dto.DoctorAlertResponse;
import com.neuralconsult.sevrage.support.dto.SupportConversationResponse;
import com.neuralconsult.sevrage.user.dto.PatientProfileResponse;
import java.util.List;
import java.util.UUID;

public record DoctorPatientDossierResponse(
    UUID patientProfileId,
    String patientName,
    String patientEmail,
    PatientProfileResponse profile,
    OnboardingAssessmentResponse assessment,
    DoctorFagerstromSummaryResponse latestFagerstrom,
    DoctorHadSummaryResponse latestHad,
    List<FagerstromTestResponse> fagerstromHistory,
    List<HadTestResponse> hadHistory,
    List<DailyReportResponse> dailyReports,
    ClinicalNoteResponse clinicalNote,
    ClinicalIntelligenceResponse clinicalIntelligence,
    List<AppointmentResponse> appointments,
    SupportConversationResponse supportConversation,
    List<DoctorAlertResponse> supportAlerts
) {
}
