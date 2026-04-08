package com.neuralconsult.sevrage.support;

import com.neuralconsult.sevrage.patient.PatientProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportConversationRepository extends JpaRepository<SupportConversation, UUID> {
  Optional<SupportConversation> findByPatientProfile(PatientProfile patientProfile);
}
