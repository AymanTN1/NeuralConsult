package com.neuralconsult.sevrage.patient;

import com.neuralconsult.sevrage.patient.dto.ScoreUpdateRequest;
import com.neuralconsult.sevrage.patient.dto.UpdateProfileRequest;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import com.neuralconsult.sevrage.user.dto.PatientProfileResponse;
import com.neuralconsult.sevrage.user.dto.ScoresResponse;
import com.neuralconsult.sevrage.user.dto.UserProfileResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/patient-profile")
public class PatientProfileController {

  private final PatientProfileService patientProfileService;
  private final UserRepository userRepository;

  public PatientProfileController(PatientProfileService patientProfileService, UserRepository userRepository) {
    this.patientProfileService = patientProfileService;
    this.userRepository = userRepository;
  }

  @PutMapping
  public UserProfileResponse updateProfile(@AuthenticationPrincipal UserDetails principal,
                                           @Valid @RequestBody UpdateProfileRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername())
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    PatientProfile profile = patientProfileService.updateProfile(user, request);

    return new UserProfileResponse(
        user.getId(),
        user.getEmail(),
        user.getFullName(),
        toProfileResponse(profile),
        new ScoresResponse(profile.getFagerstromScore(), profile.getHadAnxietyScore(), profile.getHadDepressionScore())
    );
  }

  @PostMapping("/scores")
  public UserProfileResponse updateScores(@AuthenticationPrincipal UserDetails principal,
                                          @Valid @RequestBody ScoreUpdateRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername())
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    PatientProfile profile = patientProfileService.updateScores(user, request);

    return new UserProfileResponse(
        user.getId(),
        user.getEmail(),
        user.getFullName(),
        toProfileResponse(profile),
        new ScoresResponse(profile.getFagerstromScore(), profile.getHadAnxietyScore(), profile.getHadDepressionScore())
    );
  }

  @DeleteMapping
  public UserProfileResponse reset(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername())
        .orElseThrow();
    PatientProfile profile = patientProfileService.resetProfile(user);
    return new UserProfileResponse(
        user.getId(),
        user.getEmail(),
        user.getFullName(),
        toProfileResponse(profile),
        new ScoresResponse(profile.getFagerstromScore(), profile.getHadAnxietyScore(), profile.getHadDepressionScore())
    );
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
        profile.getDependenceLevel() != null ? profile.getDependenceLevel().name() : null,
        profile.getMedicalHistoryNotes()
    );
  }
}
