package com.neuralconsult.sevrage.medical.tests;

import com.neuralconsult.sevrage.patient.PatientProfile;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HadTestRepository extends JpaRepository<HadTest, UUID> {
  List<HadTest> findAllByPatientProfileOrderByCreatedAtDesc(PatientProfile patientProfile);

  Optional<HadTest> findFirstByPatientProfileOrderByCreatedAtDesc(PatientProfile patientProfile);

  Optional<HadTest> findByIdAndPatientProfile(UUID id, PatientProfile patientProfile);
}
