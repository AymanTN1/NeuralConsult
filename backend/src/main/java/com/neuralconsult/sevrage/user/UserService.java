package com.neuralconsult.sevrage.user;

import com.neuralconsult.sevrage.doctor.DoctorProfile;
import com.neuralconsult.sevrage.doctor.DoctorProfileRepository;
import com.neuralconsult.sevrage.security.dto.RegisterRequest;
import jakarta.transaction.Transactional;
import java.util.Locale;
import java.util.Set;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

  private final UserRepository userRepository;
  private final DoctorProfileRepository doctorProfileRepository;
  private final PasswordEncoder passwordEncoder;

  public UserService(UserRepository userRepository,
                     DoctorProfileRepository doctorProfileRepository,
                     PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.doctorProfileRepository = doctorProfileRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional
  public User register(RegisterRequest request) {
    userRepository.findByEmailIgnoreCase(request.email())
        .ifPresent(existing -> {
          throw new IllegalArgumentException("Email already in use");
        });

    User user = new User();
    user.setEmail(request.email().toLowerCase());
    user.setFullName(request.fullName());
    user.setPhoneNumber(request.phoneNumber());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    String accountType = request.accountType() != null ? request.accountType().trim().toUpperCase() : "PATIENT";
    String role = switch (accountType) {
      case "DOCTOR" -> "ROLE_DOCTOR";
      case "ADMIN" -> "ROLE_ADMIN";
      default -> "ROLE_PATIENT";
    };
    user.setRoles(Set.of(role));
    if ("DOCTOR".equals(accountType)) {
      user.setStatus(User.UserStatus.PENDING_VERIFICATION);
    }

    User savedUser = userRepository.save(user);
    if ("DOCTOR".equals(accountType)) {
      DoctorProfile doctorProfile = new DoctorProfile();
      doctorProfile.setUser(savedUser);
      doctorProfile.setCity(request.city());
      doctorProfile.setCountryCode(normalizeCountryCode(request.countryCode()));
      doctorProfile.setSpecialty(request.specialty());
      doctorProfile.setBio(request.bio());
      doctorProfile.setAcceptsTeleconsultation(Boolean.TRUE.equals(request.acceptsTeleconsultation()));
      doctorProfile.setYearsExperience(request.yearsExperience());
      doctorProfile.setActive(false);
      doctorProfileRepository.save(doctorProfile);
    }

    return savedUser;
  }

  private String normalizeCountryCode(String countryCode) {
    if (countryCode == null || countryCode.isBlank()) {
      return "MA";
    }
    return countryCode.trim().toUpperCase(Locale.ROOT);
  }
}
