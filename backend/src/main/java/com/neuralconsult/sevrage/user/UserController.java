package com.neuralconsult.sevrage.user;

import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.user.dto.PatientProfileResponse;
import com.neuralconsult.sevrage.user.dto.ScoresResponse;
import com.neuralconsult.sevrage.user.dto.UserProfileResponse;
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
        profile != null ? toProfileResponse(profile) : null,
        profile != null
            ? new ScoresResponse(profile.getFagerstromScore(), profile.getHadAnxietyScore(), profile.getHadDepressionScore())
            : null,
        user.getRoles()
    );
  }

  private boolean isPatient(User user) {
    return user.getRoles().isEmpty() || user.getRoles().contains("ROLE_PATIENT");
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
        profile.getDependenceLevel() != null ? profile.getDependenceLevel().name() : null,
        profile.getMedicalHistoryNotes()
    );
  }
}
