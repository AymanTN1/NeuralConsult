package com.neuralconsult.sevrage.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(
    boolean enabled,
    String fromAddress,
    String fromName,
    int verificationCodeTtlMinutes,
    int passwordResetCodeTtlMinutes
) {

  public MailProperties {
    if (verificationCodeTtlMinutes <= 0) {
      verificationCodeTtlMinutes = 15;
    }
    if (passwordResetCodeTtlMinutes <= 0) {
      passwordResetCodeTtlMinutes = verificationCodeTtlMinutes;
    }
  }
}
