package com.neuralconsult.sevrage.plan;

import com.neuralconsult.sevrage.patient.PatientProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SevragePlanRepository extends JpaRepository<SevragePlan, UUID> {
  Optional<SevragePlan> findByPatientProfile(PatientProfile patientProfile);
}
