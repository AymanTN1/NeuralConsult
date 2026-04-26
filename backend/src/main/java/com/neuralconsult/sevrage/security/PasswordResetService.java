package com.neuralconsult.sevrage.security;

import com.neuralconsult.sevrage.mail.MailDeliveryService;
import com.neuralconsult.sevrage.mail.MailProperties;
import com.neuralconsult.sevrage.mail.MailTemplateService;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import com.neuralconsult.sevrage.user.UserService;
import jakarta.transaction.Transactional;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetService {

  private static final SecureRandom RANDOM = new SecureRandom();

  private final PasswordResetCodeRepository passwordResetCodeRepository;
  private final UserRepository userRepository;
  private final UserService userService;
  private final MailTemplateService mailTemplateService;
  private final MailDeliveryService mailDeliveryService;
  private final MailProperties mailProperties;

  public PasswordResetService(PasswordResetCodeRepository passwordResetCodeRepository,
                              UserRepository userRepository,
                              UserService userService,
                              MailTemplateService mailTemplateService,
                              MailDeliveryService mailDeliveryService,
                              MailProperties mailProperties) {
    this.passwordResetCodeRepository = passwordResetCodeRepository;
    this.userRepository = userRepository;
    this.userService = userService;
    this.mailTemplateService = mailTemplateService;
    this.mailDeliveryService = mailDeliveryService;
    this.mailProperties = mailProperties;
  }

  @Transactional
  public void issueResetCode(String email) {
    User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
    if (user == null) {
      return;
    }

    invalidateOpenCodes(user);

    PasswordResetCode token = new PasswordResetCode();
    token.setUser(user);
    token.setCode(generateCode());
    token.setExpiresAt(Instant.now().plusSeconds(mailProperties.passwordResetCodeTtlMinutes() * 60L));
    passwordResetCodeRepository.save(token);

    mailDeliveryService.send(
        user,
        mailTemplateService.buildPasswordResetEmail(user, token.getCode(), mailProperties.passwordResetCodeTtlMinutes())
    );
  }

  @Transactional
  public void resetPassword(String email, String code, String newPassword) {
    User user = userRepository.findByEmailIgnoreCase(email)
        .orElseThrow(() -> new IllegalArgumentException("Aucun compte ne correspond a cet email."));

    PasswordResetCode resetCode = passwordResetCodeRepository
        .findFirstByUserAndCodeAndUsedAtIsNullOrderByCreatedAtDesc(user, code)
        .orElseThrow(() -> new IllegalArgumentException("Le code de reinitialisation est incorrect."));

    if (resetCode.getExpiresAt().isBefore(Instant.now())) {
      throw new IllegalArgumentException("Le code de reinitialisation a expire. Demandez-en un nouveau.");
    }

    resetCode.setUsedAt(Instant.now());
    passwordResetCodeRepository.save(resetCode);
    userService.updatePassword(user, newPassword);
  }

  private void invalidateOpenCodes(User user) {
    List<PasswordResetCode> previousCodes = passwordResetCodeRepository.findAllByUserAndUsedAtIsNull(user);
    Instant now = Instant.now();
    previousCodes.forEach(code -> code.setUsedAt(now));
    passwordResetCodeRepository.saveAll(previousCodes);
  }

  private String generateCode() {
    int value = 100000 + RANDOM.nextInt(900000);
    return Integer.toString(value);
  }
}
