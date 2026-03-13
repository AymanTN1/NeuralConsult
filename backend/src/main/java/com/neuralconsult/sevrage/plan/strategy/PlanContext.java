package com.neuralconsult.sevrage.plan.strategy;

import com.neuralconsult.sevrage.onboarding.OnboardingAssessment;
import com.neuralconsult.sevrage.patient.PatientProfile;
import java.util.Optional;

public record PlanContext(
    PatientProfile profile,
    OnboardingAssessment assessment
) {
  public int fagerstromScore() {
    return Optional.ofNullable(profile.getFagerstromScore()).orElse(0);
  }

  public int hadAnxietyScore() {
    return Optional.ofNullable(profile.getHadAnxietyScore()).orElse(0);
  }

  public int hadDepressionScore() {
    return Optional.ofNullable(profile.getHadDepressionScore()).orElse(0);
  }

  public boolean hasSevereMoodSymptoms() {
    return hadAnxietyScore() >= 11 || hadDepressionScore() >= 11;
  }

  public boolean hasBorderlineMoodSymptoms() {
    return hadAnxietyScore() >= 8 || hadDepressionScore() >= 8;
  }

  public boolean cagePositive() {
    return assessment != null && Boolean.TRUE.equals(assessment.getCagePositive());
  }

  public boolean honcHighDependence() {
    return assessment != null && Boolean.TRUE.equals(assessment.getHoncHighDependence());
  }

  public boolean cannabisFrequentUse() {
    if (assessment == null || assessment.getCannabisFrequency() == null) {
      return false;
    }
    return switch (assessment.getCannabisFrequency()) {
      case TEN_TO_19, TWENTY_TO_29, DAILY -> true;
      default -> false;
    };
  }
}
