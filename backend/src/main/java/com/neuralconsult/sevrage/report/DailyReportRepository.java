package com.neuralconsult.sevrage.report;

import com.neuralconsult.sevrage.patient.PatientProfile;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyReportRepository extends JpaRepository<DailyReport, UUID> {
  Optional<DailyReport> findByPatientProfileAndReportDate(PatientProfile patientProfile, LocalDate reportDate);

  Optional<DailyReport> findByIdAndPatientProfile(UUID id, PatientProfile patientProfile);

  List<DailyReport> findAllByPatientProfileAndReportDateBetween(
      PatientProfile patientProfile,
      LocalDate from,
      LocalDate to
  );
}
