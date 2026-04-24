package com.neuralconsult.sevrage.security;

import com.neuralconsult.sevrage.mail.MailDeliveryService;
import com.neuralconsult.sevrage.mail.MailProperties;
import com.neuralconsult.sevrage.mail.MailTemplateService;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import jakarta.transaction.Transactional;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class EmailVerificationService {

  private static final SecureRandom RANDOM = new SecureRandom();

  private final EmailVerificationCodeRepository verificationCodeRepository;
  private final UserRepository userRepository;
  private final MailTemplateService mailTemplateService;
  private final MailDeliveryService mailDeliveryService;
  private final MailProperties mailProperties;

  public EmailVerificationService(EmailVerificationCodeRepository verificationCodeRepository,
                                  UserRepository userRepository,
                                  MailTemplateService mailTemplateService,
                                  MailDeliveryService mailDeliveryService,
                                  MailProperties mailProperties) {
    this.verificationCodeRepository = verificationCodeRepository;
    this.userRepository = userRepository;
    this.mailTemplateService = mailTemplateService;
    this.mailDeliveryService = mailDeliveryService;
    this.mailProperties = mailProperties;
  }

  @Transactional
  public void issueVerificationCode(User user) {
    if (user == null || user.isAccountEnabled()) {
      return;
    }
    invalidateOpenCodes(user);

    EmailVerificationCode token = new EmailVerificationCode();
    token.setUser(user);
    token.setCode(generateCode());
    token.setExpiresAt(Instant.now().plusSeconds(mailProperties.verificationCodeTtlMinutes() * 60L));
    verificationCodeRepository.save(token);

    mailDeliveryService.send(
        user,
        mailTemplateService.buildVerificationEmail(user, token.getCode(), mailProperties.verificationCodeTtlMinutes())
    );
  }

  @Transactional
  public User verify(String email, String code) {
    User user = userRepository.findByEmailIgnoreCase(email).orElseThrow(() -> new IllegalArgumentException("Compte introuvable pour cet email."));
    if (user.isAccountEnabled()) {
      return user;
    }

    EmailVerificationCode verificationCode = verificationCodeRepository
        .findFirstByUserAndCodeAndUsedAtIsNullOrderByCreatedAtDesc(user, code)
        .orElseThrow(() -> new IllegalArgumentException("Le code de verification est incorrect."));

    if (verificationCode.getExpiresAt().isBefore(Instant.now())) {
      throw new IllegalArgumentException("Le code de verification a expire. Demandez-en un nouveau.");
    }

    verificationCode.setUsedAt(Instant.now());
    verificationCodeRepository.save(verificationCode);

    user.setAccountEnabled(true);
    userRepository.save(user);
    return user;
  }

  @Transactional
  public void resend(String email) {
    User user = userRepository.findByEmailIgnoreCase(email).orElseThrow(() -> new IllegalArgumentException("Compte introuvable pour cet email."));
    if (user.isAccountEnabled()) {
      return;
    }
    issueVerificationCode(user);
  }

  private void invalidateOpenCodes(User user) {
    List<EmailVerificationCode> previousCodes = verificationCodeRepository.findAllByUserAndUsedAtIsNull(user);
    Instant now = Instant.now();
    previousCodes.forEach(code -> code.setUsedAt(now));
    verificationCodeRepository.saveAll(previousCodes);
  }

  private String generateCode() {
    int value = 100000 + RANDOM.nextInt(900000);
    return Integer.toString(value);
  }
}
