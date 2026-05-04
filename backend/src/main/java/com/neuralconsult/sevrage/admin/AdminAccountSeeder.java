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
