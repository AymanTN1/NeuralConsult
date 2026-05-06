package com.neuralconsult.sevrage.admin;

import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import jakarta.transaction.Transactional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the official @neuralconsult.sevrage account on first boot.
 * This account is used by the Python scraper to auto-post health articles.
 */
@Component
public class AdminAccountSeeder implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(AdminAccountSeeder.class);

  private static final String OFFICIAL_USERNAME = "neuralconsult.sevrage";
  private static final String OFFICIAL_EMAIL    = "bot@neuralconsult.internal";
  private static final String OFFICIAL_FULLNAME = "NeuralConsult Sevrage";
  private static final String OFFICIAL_BIO      =
      "Compte officiel NeuralConsult — Campagnes de sensibilisation au sevrage tabagique. "
      + "Articles scientifiques, médicaux et de santé publique.";

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Value("${app.admin.bot-password:NeuralBot@2025!}")
  private String botPassword;

  public AdminAccountSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    // Seed a Default Doctor Account for testing
    if (userRepository.findByEmailIgnoreCase("dr.amrani@neuralconsult.com").isEmpty()) {
      User doctor = new User();
      doctor.setEmail("dr.amrani@neuralconsult.com");
      doctor.setPasswordHash(passwordEncoder.encode("password"));
      doctor.setFullName("Dr. Amrani");
      doctor.setFirstName("Dr.");
      doctor.setLastName("Amrani");
      doctor.setCommunityUsername("dr.amrani");
      doctor.setAccountEnabled(true);
      doctor.setIdentityVerified(true);
      doctor.setVerifiedBadge(true);
      doctor.setStatus(User.UserStatus.ACTIVE);
      doctor.setRoles(Set.of("ROLE_DOCTOR", "ROLE_USER"));
      userRepository.save(doctor);
      log.info("✅ Default Test Doctor account created (email: dr.amrani@neuralconsult.com).");
    }

    // Seed a Default Patient Account for testing
    if (userRepository.findByEmailIgnoreCase("samy@neuralconsult.com").isEmpty()) {
      User patient = new User();
      patient.setEmail("samy@neuralconsult.com");
      patient.setPasswordHash(passwordEncoder.encode("password"));
      patient.setFullName("Samy Zen");
      patient.setFirstName("Samy");
      patient.setLastName("Zen");
      patient.setCommunityUsername("samy.zen");
      patient.setAccountEnabled(true);
      patient.setIdentityVerified(true);
      patient.setStatus(User.UserStatus.ACTIVE);
      patient.setRoles(Set.of("ROLE_PATIENT", "ROLE_USER"));
      userRepository.save(patient);
      log.info("✅ Default Test Patient account created (email: samy@neuralconsult.com).");
    }

    // Seed User's specific account (aymantantani20@gmail.com as DOCTOR)
    if (userRepository.findByEmailIgnoreCase("aymantantani20@gmail.com").isEmpty()) {
      User doctor = new User();
      doctor.setEmail("aymantantani20@gmail.com");
      doctor.setPasswordHash(passwordEncoder.encode("password"));
      doctor.setFullName("Ayman Tantani");
      doctor.setFirstName("Ayman");
      doctor.setLastName("Tantani");
      doctor.setCommunityUsername("aymantantani");
      doctor.setAccountEnabled(true);
      doctor.setIdentityVerified(true);
      doctor.setVerifiedBadge(true);
      doctor.setStatus(User.UserStatus.ACTIVE);
      doctor.setRoles(Set.of("ROLE_DOCTOR", "ROLE_USER"));
      userRepository.save(doctor);
      log.info("✅ Seeded user's Doctor account (email: aymantantani20@gmail.com).");
    }

    // Seed User's specific account (Anass@gmail.com as PATIENT)
    if (userRepository.findByEmailIgnoreCase("Anass@gmail.com").isEmpty()) {
      User patient = new User();
      patient.setEmail("Anass@gmail.com");
      patient.setPasswordHash(passwordEncoder.encode("password"));
      patient.setFullName("Anass");
      patient.setFirstName("Anass");
      patient.setLastName("");
      patient.setCommunityUsername("anass");
      patient.setAccountEnabled(true);
      patient.setIdentityVerified(true);
      patient.setStatus(User.UserStatus.ACTIVE);
      patient.setRoles(Set.of("ROLE_PATIENT", "ROLE_USER"));
      userRepository.save(patient);
      log.info("✅ Seeded user's Patient account (email: Anass@gmail.com).");
    }

    boolean exists = userRepository.findByCommunityUsernameIgnoreCase(OFFICIAL_USERNAME).isPresent();
    if (exists) {
      log.info("Official @{} account already exists — skipping seed.", OFFICIAL_USERNAME);
      return;
    }

    User bot = new User();
    bot.setEmail(OFFICIAL_EMAIL);
    bot.setPasswordHash(passwordEncoder.encode(botPassword));
    bot.setFullName(OFFICIAL_FULLNAME);
    bot.setFirstName("NeuralConsult");
    bot.setLastName("Sevrage");
    bot.setCommunityUsername(OFFICIAL_USERNAME);
    bot.setCommunityBio(OFFICIAL_BIO);
    // Official green avatar (base64 placeholder — can be replaced in admin panel)
    bot.setCommunityAvatarUrl(null);
    bot.setAccountEnabled(true);
    bot.setIdentityVerified(true);
    bot.setOfficialAccount(true);
    bot.setVerifiedBadge(true);
    bot.setStatus(User.UserStatus.ACTIVE);
    bot.setRoles(Set.of("ROLE_ADMIN", "ROLE_USER"));

    userRepository.save(bot);
    log.info("✅ Official @{} account created (email: {}).", OFFICIAL_USERNAME, OFFICIAL_EMAIL);
  }
}
