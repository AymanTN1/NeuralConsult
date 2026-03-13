package com.neuralconsult.sevrage.onboarding;

import com.neuralconsult.sevrage.onboarding.dto.OnboardingRequest;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class OnboardingService {

  private final OnboardingRepository repository;
  private final PatientProfileService patientProfileService;

  public OnboardingService(OnboardingRepository repository, PatientProfileService patientProfileService) {
    this.repository = repository;
    this.patientProfileService = patientProfileService;
  }

  @Transactional
  public OnboardingAssessment save(User user, OnboardingRequest request) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    applyProfile(profile, request);

    OnboardingAssessment assessment = repository.findByPatientProfile(profile).orElseGet(() -> {
      OnboardingAssessment created = new OnboardingAssessment();
      created.setPatientProfile(profile);
      return created;
    });

    applyAssessment(assessment, request);
    computeDerivedScores(assessment);
    return repository.save(assessment);
  }

  @Transactional
  public OnboardingAssessment get(User user) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    return repository.findByPatientProfile(profile).orElse(null);
  }

  private void applyProfile(PatientProfile profile, OnboardingRequest request) {
    profile.setDateOfBirth(request.dateOfBirth());
    profile.setSex(request.sex());
    profile.setHeightCm(request.heightCm());
    profile.setWeightKg(request.weightKg());
    profile.setCity(request.city());
    profile.setCountryCode(request.countryCode());
    profile.setOccupation(request.occupation());
    profile.setCigarettesPerDay(request.cigarettesPerDay());
    profile.setSmokingStartAge(request.smokingStartAge());
    profile.setMedicalHistoryNotes(request.medicalHistoryNotes());
  }

  private void applyAssessment(OnboardingAssessment assessment, OnboardingRequest request) {
    assessment.setQuitAttempts(request.quitAttempts());
    assessment.setLongestQuitDays(request.longestQuitDays());
    assessment.setMotivationScore(request.motivationScore());
    assessment.setConfidenceScore(request.confidenceScore());
    assessment.setSmokesAtHome(request.smokesAtHome());
    assessment.setUsesOtherTobacco(request.usesOtherTobacco());
    assessment.setTriggers(request.triggers());
    assessment.setNotes(request.notes());

    assessment.setCageCutDown(request.cageCutDown());
    assessment.setCageAnnoyed(request.cageAnnoyed());
    assessment.setCageGuilty(request.cageGuilty());
    assessment.setCageEyeOpener(request.cageEyeOpener());

    assessment.setCannabisLast12Months(request.cannabisLast12Months());
    assessment.setCannabisFrequency(request.cannabisFrequency());

    assessment.setWeightConcernScore(request.weightConcernScore());
    assessment.setWeightConfidenceScore(request.weightConfidenceScore());
    assessment.setPhysicalActivityLevel(request.physicalActivityLevel());

    assessment.setHoncQ1(request.honcQ1());
    assessment.setHoncQ2(request.honcQ2());
    assessment.setHoncQ3(request.honcQ3());
    assessment.setHoncQ4(request.honcQ4());
    assessment.setHoncQ5(request.honcQ5());
    assessment.setHoncQ6(request.honcQ6());
    assessment.setHoncQ7(request.honcQ7());
    assessment.setHoncQ8(request.honcQ8());
    assessment.setHoncQ9(request.honcQ9());
    assessment.setHoncQ10(request.honcQ10());
  }

  private void computeDerivedScores(OnboardingAssessment assessment) {
    int cageScore = countTrue(
        assessment.getCageCutDown(),
        assessment.getCageAnnoyed(),
        assessment.getCageGuilty(),
        assessment.getCageEyeOpener()
    );
    assessment.setCageScore(cageScore);
    assessment.setCagePositive(cageScore >= 2);

    int honcScore = countTrue(
        assessment.getHoncQ1(),
        assessment.getHoncQ2(),
        assessment.getHoncQ3(),
        assessment.getHoncQ4(),
        assessment.getHoncQ5(),
        assessment.getHoncQ6(),
        assessment.getHoncQ7(),
        assessment.getHoncQ8(),
        assessment.getHoncQ9(),
        assessment.getHoncQ10()
    );
    assessment.setHoncScore(honcScore);
    assessment.setHoncHighDependence(honcScore >= 7);
  }

  private int countTrue(Boolean... values) {
    int total = 0;
    for (Boolean value : values) {
      if (Boolean.TRUE.equals(value)) {
        total += 1;
      }
    }
    return total;
  }
}
