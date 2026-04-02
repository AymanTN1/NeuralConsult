package com.neuralconsult.sevrage.clinical.intelligence;

import com.neuralconsult.sevrage.patient.PatientProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ValidatedTreatmentPlanRepository extends JpaRepository<ValidatedTreatmentPlan, UUID> {
  Optional<ValidatedTreatmentPlan> findByPatientProfile(PatientProfile patientProfile);
}
