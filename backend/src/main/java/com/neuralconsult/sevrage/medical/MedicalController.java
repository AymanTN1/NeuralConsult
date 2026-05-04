package com.neuralconsult.sevrage.medical;

import com.neuralconsult.sevrage.medical.dto.ConsultationReportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/medical")
@RequiredArgsConstructor
public class MedicalController {

    private final ConsultationReportService reportService;
    private final ConsultationReportRepository reportRepository;

    @GetMapping("/appointments/{appointmentId}/report")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ConsultationReportResponse> getReport(@PathVariable UUID appointmentId) {
        return ResponseEntity.ok(reportService.getReportByAppointment(appointmentId));
    }

    @PostMapping("/appointments/{appointmentId}/report")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ConsultationReportResponse> saveReport(
            @PathVariable UUID appointmentId,
            @RequestBody com.neuralconsult.sevrage.medical.dto.ConsultationReportRequest request) {
        return ResponseEntity.ok(reportService.saveReport(appointmentId, request));
    }

    @GetMapping("/patients/{patientProfileId}/reports")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<ConsultationReportResponse>> getPatientReports(@PathVariable UUID patientProfileId) {
        return ResponseEntity.ok(reportRepository.findAllByAppointmentPatientProfileIdOrderByConsultationDateDesc(patientProfileId)
                .stream()
                .map(reportService::toResponse)
                .collect(Collectors.toList()));
    }
}
