package com.neuralconsult.sevrage.onboarding;

import com.neuralconsult.sevrage.patient.PatientProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OnboardingRepository extends JpaRepository<OnboardingAssessment, UUID> {
  Optional<OnboardingAssessment> findByPatientProfile(PatientProfile patientProfile);
}
