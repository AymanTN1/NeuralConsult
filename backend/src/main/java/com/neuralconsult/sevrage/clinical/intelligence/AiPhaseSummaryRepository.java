package com.neuralconsult.sevrage.clinical.intelligence;

import com.neuralconsult.sevrage.patient.PatientProfile;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiPhaseSummaryRepository extends JpaRepository<AiPhaseSummary, UUID> {
  List<AiPhaseSummary> findAllByPatientProfileOrderByPhaseIdAsc(PatientProfile patientProfile);
  void deleteAllByPatientProfile(PatientProfile patientProfile);
}
