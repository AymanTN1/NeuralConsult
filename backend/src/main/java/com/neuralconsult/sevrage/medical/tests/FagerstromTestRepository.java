package com.neuralconsult.sevrage.medical.tests;

import com.neuralconsult.sevrage.patient.PatientProfile;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FagerstromTestRepository extends JpaRepository<FagerstromTest, UUID> {
  List<FagerstromTest> findAllByPatientProfileOrderByCreatedAtDesc(PatientProfile patientProfile);

  Optional<FagerstromTest> findFirstByPatientProfileOrderByCreatedAtDesc(PatientProfile patientProfile);

  Optional<FagerstromTest> findByIdAndPatientProfile(UUID id, PatientProfile patientProfile);
}
