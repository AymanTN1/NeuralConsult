package com.neuralconsult.sevrage.user;

import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.user.dto.PatientProfileResponse;
import com.neuralconsult.sevrage.user.dto.ScoresResponse;
import com.neuralconsult.sevrage.user.dto.UserProfileResponse;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class UserController {

  private final UserRepository userRepository;
  private final PatientProfileService patientProfileService;

  public UserController(UserRepository userRepository, PatientProfileService patientProfileService) {
    this.userRepository = userRepository;
    this.patientProfileService = patientProfileService;
  }

  @GetMapping("/me")
  public UserProfileResponse me(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername())
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    PatientProfile profile = isPatient(user) ? patientProfileService.getOrCreate(user) : null;

    return new UserProfileResponse(
        user.getId(),
        user.getEmail(),
        user.getFullName(),
        user.getFirstName(),
        user.getLastName(),
        user.getDateOfBirth(),
        user.isIdentityVerified(),
        profile != null ? toProfileResponse(profile) : null,
        profile != null
            ? new ScoresResponse(profile.getFagerstromScore(), profile.getHadAnxietyScore(), profile.getHadDepressionScore())
            : null,
        normalizeRoles(user)
    );
  }

  private boolean isPatient(User user) {
    Set<String> roles = user.getRoles();
    if (roles.contains("ROLE_DOCTOR") || roles.contains("ROLE_ADMIN")) {
      return false;
    }
    return roles.contains("ROLE_PATIENT") || roles.contains("PATIENT");
  }

  private Set<String> normalizeRoles(User user) {
    Set<String> roles = new HashSet<>(user.getRoles());
    // Only add ROLE_PATIENT for ROLE_USER if the user is NOT a doctor or admin
    if (roles.contains("ROLE_USER")
        && !roles.contains("ROLE_DOCTOR")
        && !roles.contains("ROLE_ADMIN")) {
      roles.add("ROLE_PATIENT");
    }
    return roles;
  }

  private PatientProfileResponse toProfileResponse(PatientProfile profile) {
    return new PatientProfileResponse(
        profile.getDateOfBirth(),
        profile.getSex(),
        profile.getHeightCm(),
        profile.getWeightKg(),
        profile.getCity(),
        profile.getCountryCode(),
        profile.getOccupation(),
        profile.getCigarettesPerDay(),
        profile.getSmokingStartAge(),
        profile.isOnboardingComplete(),
        profile.isTestsComplete(),
        profile.isJournalComplete(),
        profile.getDependenceLevel() != null ? profile.getDependenceLevel().name() : null,
        profile.getMedicalHistoryNotes()
    );
  }
}
