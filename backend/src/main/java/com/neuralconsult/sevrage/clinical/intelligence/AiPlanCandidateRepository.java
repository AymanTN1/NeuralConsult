package com.neuralconsult.sevrage.clinical.intelligence;

import com.neuralconsult.sevrage.patient.PatientProfile;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiPlanCandidateRepository extends JpaRepository<AiPlanCandidate, UUID> {
  List<AiPlanCandidate> findAllByPatientProfileOrderByTrackAsc(PatientProfile patientProfile);
  void deleteAllByPatientProfile(PatientProfile patientProfile);
}
