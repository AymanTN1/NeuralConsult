package com.neuralconsult.sevrage.medical;

import com.neuralconsult.sevrage.appointment.Appointment;
import com.neuralconsult.sevrage.appointment.AppointmentRepository;
import com.neuralconsult.sevrage.medical.dto.ConsultationReportRequest;
import com.neuralconsult.sevrage.medical.dto.ConsultationReportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConsultationReportService {

    private final ConsultationReportRepository reportRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional(readOnly = true)
    public ConsultationReportResponse getReportByAppointment(UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        return reportRepository.findByAppointmentId(appointmentId)
                .map(this::toResponse)
                .orElseGet(() -> buildNewReportDraft(appointment));
    }

    @Transactional
    public ConsultationReportResponse saveReport(UUID appointmentId, ConsultationReportRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        ConsultationReport report = reportRepository.findByAppointmentId(appointmentId)
                .orElse(new ConsultationReport());

        if (report.getId() == null) {
            report.setAppointment(appointment);
            report.setConsultationDate(LocalDate.now());
            
            // Logic to determine type
            long existingReports = reportRepository.countByAppointmentPatientProfileUserId(appointment.getPatientProfile().getUser().getId());
            if (existingReports == 0) {
                report.setReportType(ConsultationReport.ReportType.INITIAL_ASSESSMENT);
                report.setFollowUpNumber(0);
            } else {
                report.setReportType(ConsultationReport.ReportType.FOLLOW_UP);
                report.setFollowUpNumber((int) existingReports);
            }
        }

        updateReportFields(report, request);
        ConsultationReport saved = reportRepository.save(report);
        return toResponse(saved);
    }

    private ConsultationReportResponse buildNewReportDraft(Appointment appointment) {
        long existingReports = reportRepository.countByAppointmentPatientProfileUserId(appointment.getPatientProfile().getUser().getId());
        
        ConsultationReport.ReportType type;
        int followUpNum;
        String title;

        if (existingReports == 0) {
            type = ConsultationReport.ReportType.INITIAL_ASSESSMENT;
            followUpNum = 0;
            title = "Bilan lors de la consultation initiale";
        } else {
            type = ConsultationReport.ReportType.FOLLOW_UP;
            followUpNum = (int) existingReports;
            title = "Consultation de suivi N°" + followUpNum;
        }

        return ConsultationReportResponse.builder()
                .appointmentId(appointment.getId())
                .consultationDate(LocalDate.now())
                .reportType(type)
                .followUpNumber(followUpNum)
                .title(title)
                .build();
    }

    private void updateReportFields(ConsultationReport report, ConsultationReportRequest request) {
        report.setTobaccoConsumptionDaily(request.getTobaccoConsumptionDaily());
        report.setCoExpiredPpm(request.getCoExpiredPpm());
        report.setTimeSinceLastCigarette(request.getTimeSinceLastCigarette());
        report.setObservations(request.getObservations());
        report.setCigarettesSinceWaking(request.getCigarettesSinceWaking());
        report.setStopDateFixed(request.getStopDateFixed());
        report.setReductionStrategy(request.getReductionStrategy());
        report.setPatientStopped(request.getPatientStopped());
        report.setDaysSinceStop(request.getDaysSinceStop());
        report.setReductionPlus50Percent(request.getReductionPlus50Percent());
        report.setUsesElectronicCigarette(request.getUsesElectronicCigarette());
        report.setELiquidVolumePerWeek(request.getELiquidVolumePerWeek());
        report.setUsesNicotineCartridges(request.getUsesNicotineCartridges());
        report.setNicotineCartridgeDosage(request.getNicotineCartridgeDosage());
        report.setECigUsageIncreased(request.getECigUsageIncreased());
        report.setPrescribedNrt(request.getPrescribedNrt());
        report.setNrtPatch(request.getNrtPatch());
        report.setNrtPatchDosage(request.getNrtPatchDosage());
        report.setNrtGum(request.getNrtGum());
        report.setNrtGumDosage(request.getNrtGumDosage());
        report.setNrtLozenge(request.getNrtLozenge());
        report.setNrtLozengeDosage(request.getNrtLozengeDosage());
        report.setNrtMouthSpray(request.getNrtMouthSpray());
        report.setNrtInhaler(request.getNrtInhaler());
        report.setNrtMicrotab(request.getNrtMicrotab());
        report.setPrescribedBupropion(request.getPrescribedBupropion());
        report.setPrescribedVarenicline(request.getPrescribedVarenicline());
        report.setBehavioralTechniques(request.getBehavioralTechniques());
        report.setPsychologicalReferral(request.getPsychologicalReferral());
        report.setDieteticCare(request.getDieteticCare());
        report.setOtherTreatment(request.getOtherTreatment());
    }

    public ConsultationReportResponse toResponse(ConsultationReport report) {
        String title = report.getReportType() == ConsultationReport.ReportType.INITIAL_ASSESSMENT ?
                "Bilan lors de la consultation initiale" :
                "Consultation de suivi N°" + report.getFollowUpNumber();

        return ConsultationReportResponse.builder()
                .id(report.getId())
                .appointmentId(report.getAppointment().getId())
                .consultationDate(report.getConsultationDate())
                .reportType(report.getReportType())
                .followUpNumber(report.getFollowUpNumber())
                .title(title)
                .tobaccoConsumptionDaily(report.getTobaccoConsumptionDaily())
                .coExpiredPpm(report.getCoExpiredPpm())
                .timeSinceLastCigarette(report.getTimeSinceLastCigarette())
                .observations(report.getObservations())
                .cigarettesSinceWaking(report.getCigarettesSinceWaking())
                .stopDateFixed(report.getStopDateFixed())
                .reductionStrategy(report.getReductionStrategy())
                .patientStopped(report.getPatientStopped())
                .daysSinceStop(report.getDaysSinceStop())
                .reductionPlus50Percent(report.getReductionPlus50Percent())
                .usesElectronicCigarette(report.getUsesElectronicCigarette())
                .eLiquidVolumePerWeek(report.getELiquidVolumePerWeek())
                .usesNicotineCartridges(report.getUsesNicotineCartridges())
                .nicotineCartridgeDosage(report.getNicotineCartridgeDosage())
                .eCigUsageIncreased(report.getECigUsageIncreased())
                .prescribedNrt(report.getPrescribedNrt())
                .nrtPatch(report.getNrtPatch())
                .nrtPatchDosage(report.getNrtPatchDosage())
                .nrtGum(report.getNrtGum())
                .nrtGumDosage(report.getNrtGumDosage())
                .nrtLozenge(report.getNrtLozenge())
                .nrtLozengeDosage(report.getNrtLozengeDosage())
                .nrtMouthSpray(report.getNrtMouthSpray())
                .nrtInhaler(report.getNrtInhaler())
                .nrtMicrotab(report.getNrtMicrotab())
                .prescribedBupropion(report.getPrescribedBupropion())
                .prescribedVarenicline(report.getPrescribedVarenicline())
                .behavioralTechniques(report.getBehavioralTechniques())
                .psychologicalReferral(report.getPsychologicalReferral())
                .dieteticCare(report.getDieteticCare())
                .otherTreatment(report.getOtherTreatment())
                .build();
    }
}
