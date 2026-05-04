package com.neuralconsult.sevrage.medical;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConsultationReportRepository extends JpaRepository<ConsultationReport, UUID> {
    Optional<ConsultationReport> findByAppointmentId(UUID appointmentId);
    long countByAppointmentPatientProfileUserId(UUID userId);
    List<ConsultationReport> findAllByAppointmentPatientProfileUserIdOrderByConsultationDateDesc(UUID userId);
    List<ConsultationReport> findAllByAppointmentPatientProfileIdOrderByConsultationDateDesc(UUID patientProfileId);
}
