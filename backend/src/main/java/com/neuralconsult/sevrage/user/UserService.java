package com.neuralconsult.sevrage.user;

import com.neuralconsult.sevrage.doctor.DoctorProfile;
import com.neuralconsult.sevrage.doctor.DoctorProfileRepository;
import com.neuralconsult.sevrage.security.dto.IdentityVerificationRequest;
import com.neuralconsult.sevrage.security.dto.RegisterRequest;
import jakarta.transaction.Transactional;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.Instant;
import java.util.Arrays;
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
          throw new IllegalArgumentException("Cette adresse email est deja utilisee.");
        });

    validateIdentityVerification(request);

    User user = new User();
    user.setEmail(request.email().toLowerCase());
    user.setFirstName(cleanName(request.firstName()));
    user.setLastName(cleanName(request.lastName()));
    user.setFullName(buildFullName(request));
    user.setDateOfBirth(request.dateOfBirth());
    user.setPhoneNumber(request.phoneNumber());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setIdentityDocumentType(request.identityVerification().documentType().trim().toUpperCase(Locale.ROOT));
    user.setIdentityVerified(true);
    user.setIdentityVerifiedAt(Instant.now());
    user.setIdentityVerificationSummary(buildVerificationSummary(request.identityVerification()));
    String accountType = request.accountType() != null ? request.accountType().trim().toUpperCase() : "PATIENT";
    String role = switch (accountType) {
      case "DOCTOR" -> "ROLE_DOCTOR";
      case "ADMIN" -> "ROLE_ADMIN";
      default -> "ROLE_PATIENT";
    };
    user.setRoles(Set.of(role));
    if (!"ADMIN".equals(accountType)) {
      user.setAccountEnabled(false);
    }
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

  public User findByEmail(String email) {
    if (email == null || email.isBlank()) {
      return null;
    }
    return userRepository.findByEmailIgnoreCase(email).orElse(null);
  }

  @Transactional
  public void updatePassword(User user, String newPassword) {
    if (user == null) {
      throw new IllegalArgumentException("Utilisateur introuvable.");
    }
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    userRepository.save(user);
  }

  private String normalizeCountryCode(String countryCode) {
    if (countryCode == null || countryCode.isBlank()) {
      return "MA";
    }
    return countryCode.trim().toUpperCase(Locale.ROOT);
  }

  private void validateIdentityVerification(RegisterRequest request) {
    IdentityVerificationRequest verification = request.identityVerification();
    if (verification == null) {
      throw new IllegalArgumentException("La verification OCR de la CIN est obligatoire.");
    }

    boolean firstNameMatches = matchesIdentityField(request.firstName(), verification.extractedFirstName(), verification.rawText());
    boolean lastNameMatches = matchesIdentityField(request.lastName(), verification.extractedLastName(), verification.rawText());
    boolean dateMatches = matchesBirthDate(request.dateOfBirth(), verification.extractedDateOfBirth(), verification.rawText());

    if (!firstNameMatches || !lastNameMatches || !dateMatches) {
      throw new IllegalArgumentException("Les donnees saisies ne correspondent pas aux informations lues sur la CIN.");
    }
  }

  private String buildFullName(RegisterRequest request) {
    if (request.fullName() != null && !request.fullName().isBlank()) {
      return request.fullName().trim();
    }
    return (cleanName(request.firstName()) + " " + cleanName(request.lastName())).trim();
  }

  private String cleanName(String value) {
    return value == null ? null : value.trim().replaceAll("\\s+", " ");
  }

  private String buildVerificationSummary(IdentityVerificationRequest verification) {
    String rawText = verification.rawText() == null ? "" : verification.rawText().replaceAll("\\s+", " ").trim();
    String compact = rawText.length() > 220 ? rawText.substring(0, 220) + "..." : rawText;
    return "OCR CIN | nom=" + cleanName(verification.extractedLastName())
        + " | prenom=" + cleanName(verification.extractedFirstName())
        + " | naissance=" + verification.extractedDateOfBirth()
        + " | confiance=" + (verification.confidence() == null ? "n/a" : verification.confidence())
        + " | extrait=" + compact;
  }

  private String normalizeIdentityToken(String value) {
    if (value == null) {
      return "";
    }
    String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
        .replaceAll("\\p{M}+", "")
        .replace('’', '\'')
        .replaceAll("[^A-Za-z0-9' -]", " ")
        .toUpperCase(Locale.ROOT)
        .replaceAll("\\s+", " ")
        .trim();
    return normalized;
  }

  private boolean matchesIdentityField(String expected, String extracted, String rawText) {
    String normalizedExpected = normalizeIdentityToken(expected);
    if (normalizedExpected.isBlank()) {
      return false;
    }

    if (normalizedExpected.equals(normalizeIdentityToken(extracted))) {
      return true;
    }

    return Arrays.stream(normalizeIdentityToken(rawText).split(" "))
        .filter(token -> !token.isBlank())
        .anyMatch(token -> token.equals(normalizedExpected) || isNearTokenMatch(token, normalizedExpected));
  }

  private boolean matchesBirthDate(LocalDate expectedDate, LocalDate extractedDate, String rawText) {
    if (expectedDate == null) {
      return false;
    }
    if (expectedDate.equals(extractedDate)) {
      return true;
    }

    String dd = String.format("%02d", expectedDate.getDayOfMonth());
    String mm = String.format("%02d", expectedDate.getMonthValue());
    String yyyy = String.valueOf(expectedDate.getYear());
    String flattenedRawText = rawText == null ? "" : rawText.replaceAll("\\s+", " ").trim();

    String[] patterns = new String[] {
        dd + "/" + mm + "/" + yyyy,
        dd + "." + mm + "." + yyyy,
        dd + "-" + mm + "-" + yyyy,
        dd + " " + mm + " " + yyyy,
        yyyy + "-" + mm + "-" + dd
    };

    for (String pattern : patterns) {
      if (flattenedRawText.contains(pattern)) {
        return true;
      }
    }

    LocalDate mrzDate = extractMrzBirthDate(flattenedRawText);
    return expectedDate.equals(mrzDate);
  }

  private LocalDate extractMrzBirthDate(String rawText) {
    if (rawText == null || rawText.isBlank()) {
      return null;
    }
    java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(\\d{6})\\d?[MFX<]").matcher(rawText.toUpperCase(Locale.ROOT));
    if (!matcher.find()) {
      return null;
    }

    String birth = matcher.group(1);
    int yy = Integer.parseInt(birth.substring(0, 2));
    int mm = Integer.parseInt(birth.substring(2, 4));
    int dd = Integer.parseInt(birth.substring(4, 6));
    int currentYearTwoDigits = java.time.Year.now().getValue() % 100;
    int fullYear = yy <= currentYearTwoDigits ? 2000 + yy : 1900 + yy;

    try {
      return LocalDate.of(fullYear, mm, dd);
    } catch (Exception ignored) {
      return null;
    }
  }

  private boolean isNearTokenMatch(String token, String expected) {
    if (token.length() < 4 || expected.length() < 4) {
      return false;
    }
    return levenshteinDistance(token, expected) <= 1;
  }

  private int levenshteinDistance(String left, String right) {
    int[][] matrix = new int[right.length() + 1][left.length() + 1];
    for (int row = 0; row <= right.length(); row++) {
      matrix[row][0] = row;
    }
    for (int col = 0; col <= left.length(); col++) {
      matrix[0][col] = col;
    }

    for (int row = 1; row <= right.length(); row++) {
      for (int col = 1; col <= left.length(); col++) {
        int cost = left.charAt(col - 1) == right.charAt(row - 1) ? 0 : 1;
        matrix[row][col] = Math.min(
            Math.min(matrix[row - 1][col] + 1, matrix[row][col - 1] + 1),
            matrix[row - 1][col - 1] + cost
        );
      }
    }
    return matrix[right.length()][left.length()];
  }
}
