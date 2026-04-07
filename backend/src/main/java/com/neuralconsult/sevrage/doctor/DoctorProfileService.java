package com.neuralconsult.sevrage.doctor;

import com.neuralconsult.sevrage.doctor.dto.DoctorProfileRequest;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import jakarta.transaction.Transactional;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class DoctorProfileService {

  private final DoctorProfileRepository doctorProfileRepository;
  private final PatientProfileService patientProfileService;
  private final UserRepository userRepository;

  public DoctorProfileService(DoctorProfileRepository doctorProfileRepository,
                              PatientProfileService patientProfileService,
                              UserRepository userRepository) {
    this.doctorProfileRepository = doctorProfileRepository;
    this.patientProfileService = patientProfileService;
    this.userRepository = userRepository;
  }

  @Transactional
  public DoctorProfile createOrUpdate(User user, DoctorProfileRequest request) {
    DoctorProfile profile = doctorProfileRepository.findByUser(user).orElseGet(DoctorProfile::new);
    boolean isNewProfile = profile.getId() == null;
    profile.setUser(user);
    profile.setCity(request.city());
    profile.setCountryCode(normalizeCountryCode(request.countryCode()));
    profile.setSpecialty(request.specialty());
    profile.setBio(request.bio());
    profile.setAcceptsTeleconsultation(Boolean.TRUE.equals(request.acceptsTeleconsultation()));
    profile.setYearsExperience(request.yearsExperience());
    if (isNewProfile) {
      profile.setActive(!needsApproval(user));
    }
    return doctorProfileRepository.save(profile);
  }

  public DoctorProfile getOrNull(User user) {
    return doctorProfileRepository.findByUser(user).orElse(null);
  }

  @Transactional
  public List<DoctorMatch> listMatchesForPatient(User user) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(user);
    List<DoctorProfile> doctors = ensureMoroccanDoctorProfiles();
    return doctors.stream()
        .map(doctor -> new DoctorMatch(doctor, matchingMode(patientProfile, doctor), matchingScore(patientProfile, doctor)))
        .sorted(Comparator.comparingInt(DoctorMatch::matchingScore).reversed())
        .toList();
  }

  @Transactional
  protected List<DoctorProfile> ensureMoroccanDoctorProfiles() {
    List<User> doctorUsers = userRepository.findAllByRole("ROLE_DOCTOR");
    for (User doctorUser : doctorUsers) {
      doctorProfileRepository.findByUser(doctorUser).orElseGet(() -> {
        DoctorProfile profile = new DoctorProfile();
        profile.setUser(doctorUser);
        profile.setCountryCode("MA");
        profile.setSpecialty("Tabacologie");
        profile.setBio("Profil medecin disponible pour l'accompagnement tabacologique.");
        profile.setAcceptsTeleconsultation(true);
        profile.setActive(!needsApproval(doctorUser));
        return doctorProfileRepository.save(profile);
      });
    }

    return doctorProfileRepository.findAllByActiveTrue().stream()
        .peek(profile -> {
          if (profile.getCountryCode() == null || profile.getCountryCode().isBlank()) {
            profile.setCountryCode("MA");
          }
        })
        .toList();
  }

  @Transactional
  public List<DoctorProfile> listPendingApproval() {
    return doctorProfileRepository.findAllByActiveFalseOrderByCreatedAtAsc();
  }

  @Transactional
  public DoctorProfile approve(User adminUser, java.util.UUID doctorProfileId) {
    DoctorProfile profile = doctorProfileRepository.findById(doctorProfileId).orElseThrow();
    profile.setActive(true);
    User doctorUser = profile.getUser();
    doctorUser.setStatus(User.UserStatus.ACTIVE);
    userRepository.save(doctorUser);
    return doctorProfileRepository.save(profile);
  }

  @Transactional
  public DoctorProfile reject(User adminUser, java.util.UUID doctorProfileId) {
    DoctorProfile profile = doctorProfileRepository.findById(doctorProfileId).orElseThrow();
    profile.setActive(false);
    User doctorUser = profile.getUser();
    doctorUser.setStatus(User.UserStatus.SUSPENDED);
    doctorUser.setAccountEnabled(false);
    userRepository.save(doctorUser);
    return doctorProfileRepository.save(profile);
  }

  private DoctorPatientRequest.MatchingMode matchingMode(PatientProfile patient, DoctorProfile doctor) {
    if (same(patient.getCity(), doctor.getCity())) {
      return DoctorPatientRequest.MatchingMode.SAME_CITY;
    }
    return DoctorPatientRequest.MatchingMode.TELECONSULTATION;
  }

  private int matchingScore(PatientProfile patient, DoctorProfile doctor) {
    int score = 10;
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

  private String normalizeCountryCode(String countryCode) {
    if (countryCode == null || countryCode.isBlank()) {
      return "MA";
    }
    return countryCode.trim().toUpperCase(Locale.ROOT);
  }

  private boolean needsApproval(User user) {
    return user.getRoles().contains("ROLE_DOCTOR") && user.getStatus() == User.UserStatus.PENDING_VERIFICATION;
  }

  public record DoctorMatch(
      DoctorProfile doctorProfile,
      DoctorPatientRequest.MatchingMode matchingMode,
      Integer matchingScore
  ) {
  }
}
