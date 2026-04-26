package com.neuralconsult.sevrage.patient;

import com.neuralconsult.sevrage.medical.tests.FagerstromTestRepository;
import com.neuralconsult.sevrage.medical.tests.HadTestRepository;
import com.neuralconsult.sevrage.patient.dto.ScoreUpdateRequest;
import com.neuralconsult.sevrage.patient.dto.UpdateProfileRequest;
import com.neuralconsult.sevrage.report.DailyReportRepository;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class PatientProfileService {

  private final PatientProfileRepository repository;
  private final FagerstromTestRepository fagerstromTestRepository;
  private final HadTestRepository hadTestRepository;
  private final DailyReportRepository dailyReportRepository;

  public PatientProfileService(PatientProfileRepository repository,
                               FagerstromTestRepository fagerstromTestRepository,
                               HadTestRepository hadTestRepository,
                               DailyReportRepository dailyReportRepository) {
    this.repository = repository;
    this.fagerstromTestRepository = fagerstromTestRepository;
    this.hadTestRepository = hadTestRepository;
    this.dailyReportRepository = dailyReportRepository;
  }

  @Transactional
  public PatientProfile getOrCreate(User user) {
    PatientProfile profile = repository.findByUser(user).orElseGet(() -> {
      PatientProfile createdProfile = new PatientProfile();
      createdProfile.setUser(user);
      return repository.save(createdProfile);
    });
    return synchronizeProgress(profile);
  }

  @Transactional
  public PatientProfile synchronizeProgress(PatientProfile profile) {
    boolean testsComplete = fagerstromTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(profile).isPresent()
        && hadTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(profile).isPresent();
    boolean journalComplete = !dailyReportRepository.findAllByPatientProfileAndReportDateBetween(
        profile,
        java.time.LocalDate.now().minusYears(5),
        java.time.LocalDate.now()
    ).isEmpty();

    if (profile.isTestsComplete() != testsComplete || profile.isJournalComplete() != journalComplete) {
      profile.setTestsComplete(testsComplete);
      profile.setJournalComplete(journalComplete);
      return repository.save(profile);
    }
    return profile;
  }

  @Transactional
  public PatientProfile updateProfile(User user, UpdateProfileRequest request) {
    PatientProfile profile = getOrCreate(user);
    if (user.getDateOfBirth() != null && request.dateOfBirth() != null && !user.getDateOfBirth().equals(request.dateOfBirth())) {
      throw new IllegalArgumentException("La date de naissance doit correspondre a celle verifiee par la CIN.");
    }
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
    return repository.save(profile);
  }

  @Transactional
  public PatientProfile seedIdentityProfile(User user, java.time.LocalDate dateOfBirth) {
    PatientProfile profile = getOrCreate(user);
    if (profile.getDateOfBirth() == null && dateOfBirth != null) {
      profile.setDateOfBirth(dateOfBirth);
      return repository.save(profile);
    }
    return profile;
  }

  @Transactional
  public PatientProfile markTestsComplete(User user, boolean testsComplete) {
    PatientProfile profile = getOrCreate(user);
    profile.setTestsComplete(testsComplete);
    return repository.save(profile);
  }

  @Transactional
  public PatientProfile markJournalComplete(User user, boolean journalComplete) {
    PatientProfile profile = getOrCreate(user);
    profile.setJournalComplete(journalComplete);
    return repository.save(profile);
  }

  @Transactional
  public PatientProfile updateScores(User user, ScoreUpdateRequest request) {
    PatientProfile profile = getOrCreate(user);
    if (request.fagerstromScore() != null) {
      profile.setFagerstromScore(request.fagerstromScore());
      profile.setDependenceLevel(resolveDependenceLevel(request.fagerstromScore()));
    }
    if (request.hadAnxietyScore() != null) {
      profile.setHadAnxietyScore(request.hadAnxietyScore());
    }
    if (request.hadDepressionScore() != null) {
      profile.setHadDepressionScore(request.hadDepressionScore());
    }
    return repository.save(profile);
  }

  @Transactional
  public PatientProfile resetProfile(User user) {
    PatientProfile profile = getOrCreate(user);
    profile.setDateOfBirth(null);
    profile.setSex(null);
    profile.setHeightCm(null);
    profile.setWeightKg(null);
    profile.setCity(null);
    profile.setCountryCode(null);
    profile.setOccupation(null);
    profile.setCigarettesPerDay(null);
    profile.setSmokingStartAge(null);
    profile.setFagerstromScore(null);
    profile.setHadAnxietyScore(null);
    profile.setHadDepressionScore(null);
    profile.setDependenceLevel(null);
    profile.setMedicalHistoryNotes(null);
    profile.setOnboardingComplete(false);
    profile.setTestsComplete(false);
    profile.setJournalComplete(false);
    return repository.save(profile);
  }

  private PatientProfile.DependenceLevel resolveDependenceLevel(int fagerstromScore) {
    if (fagerstromScore >= 9) {
      return PatientProfile.DependenceLevel.VERY_HIGH;
    }
    if (fagerstromScore >= 7) {
      return PatientProfile.DependenceLevel.HIGH;
    }
    if (fagerstromScore >= 5) {
      return PatientProfile.DependenceLevel.MODERATE;
    }
    if (fagerstromScore >= 3) {
      return PatientProfile.DependenceLevel.LOW;
    }
    return PatientProfile.DependenceLevel.NONE;
  }

  @Transactional
  public PatientProfile setScores(User user, Integer fagerstromScore, Integer hadAnxietyScore, Integer hadDepressionScore) {
    PatientProfile profile = getOrCreate(user);
    profile.setFagerstromScore(fagerstromScore);
    profile.setDependenceLevel(fagerstromScore != null ? resolveDependenceLevel(fagerstromScore) : null);
    profile.setHadAnxietyScore(hadAnxietyScore);
    profile.setHadDepressionScore(hadDepressionScore);
    return repository.save(profile);
  }
}
