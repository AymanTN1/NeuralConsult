package com.neuralconsult.sevrage.clinical.notes;

import com.neuralconsult.sevrage.patient.PatientProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicalNoteRepository extends JpaRepository<ClinicalNote, UUID> {
  Optional<ClinicalNote> findByPatientProfile(PatientProfile patientProfile);
}

