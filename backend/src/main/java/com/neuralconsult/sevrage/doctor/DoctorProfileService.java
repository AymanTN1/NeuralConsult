package com.neuralconsult.sevrage.doctor;

import com.neuralconsult.sevrage.doctor.dto.DoctorProfileRequest;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DoctorProfileService {

  private final DoctorProfileRepository doctorProfileRepository;
  private final PatientProfileService patientProfileService;

  public DoctorProfileService(DoctorProfileRepository doctorProfileRepository,
                              PatientProfileService patientProfileService) {
    this.doctorProfileRepository = doctorProfileRepository;
    this.patientProfileService = patientProfileService;
  }

  @Transactional
  public DoctorProfile createOrUpdate(User user, DoctorProfileRequest request) {
    DoctorProfile profile = doctorProfileRepository.findByUser(user).orElseGet(DoctorProfile::new);
    profile.setUser(user);
    profile.setCity(request.city());
    profile.setCountryCode(request.countryCode());
    profile.setSpecialty(request.specialty());
    profile.setBio(request.bio());
    profile.setAcceptsTeleconsultation(Boolean.TRUE.equals(request.acceptsTeleconsultation()));
    profile.setYearsExperience(request.yearsExperience());
    profile.setActive(true);
    return doctorProfileRepository.save(profile);
  }

  public DoctorProfile getOrNull(User user) {
    return doctorProfileRepository.findByUser(user).orElse(null);
  }

  @Transactional
  public List<DoctorMatch> listMatchesForPatient(User user) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(user);
    return doctorProfileRepository.findAllByActiveTrue().stream()
        .map(doctor -> new DoctorMatch(doctor, matchingMode(patientProfile, doctor), matchingScore(patientProfile, doctor)))
        .sorted(Comparator.comparingInt(DoctorMatch::matchingScore).reversed())
        .toList();
  }

  private DoctorPatientRequest.MatchingMode matchingMode(PatientProfile patient, DoctorProfile doctor) {
    if (same(patient.getCity(), doctor.getCity())) {
      return DoctorPatientRequest.MatchingMode.SAME_CITY;
    }
    if (same(patient.getCountryCode(), doctor.getCountryCode())) {
      return DoctorPatientRequest.MatchingMode.SAME_COUNTRY;
    }
    return DoctorPatientRequest.MatchingMode.TELECONSULTATION;
  }

  private int matchingScore(PatientProfile patient, DoctorProfile doctor) {
    int score = 10;
    if (same(patient.getCountryCode(), doctor.getCountryCode())) {
      score += 30;
    }
    if (same(patient.getCity(), doctor.getCity())) {
      score += 50;
    }
    if (doctor.isAcceptsTeleconsultation()) {
      score += 10;
    }
    if (doctor.getSuccessScore() != null) {
      score += Math.min(doctor.getSuccessScore(), 20);
    }
    return score;
  }

  private boolean same(String left, String right) {
    return left != null && right != null && left.equalsIgnoreCase(right);
  }

  public record DoctorMatch(
      DoctorProfile doctorProfile,
      DoctorPatientRequest.MatchingMode matchingMode,
      Integer matchingScore
  ) {
  }
}
