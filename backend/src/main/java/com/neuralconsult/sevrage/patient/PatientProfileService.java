package com.neuralconsult.sevrage.patient;

import com.neuralconsult.sevrage.patient.dto.ScoreUpdateRequest;
import com.neuralconsult.sevrage.patient.dto.UpdateProfileRequest;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class PatientProfileService {

  private final PatientProfileRepository repository;

  public PatientProfileService(PatientProfileRepository repository) {
    this.repository = repository;
  }

  @Transactional
  public PatientProfile getOrCreate(User user) {
    return repository.findByUser(user).orElseGet(() -> {
      PatientProfile profile = new PatientProfile();
      profile.setUser(user);
      return repository.save(profile);
    });
  }

  @Transactional
  public PatientProfile updateProfile(User user, UpdateProfileRequest request) {
    PatientProfile profile = getOrCreate(user);
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
