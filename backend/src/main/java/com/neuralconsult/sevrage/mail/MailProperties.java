package com.neuralconsult.sevrage.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(
    boolean enabled,
    String fromAddress,
    String fromName,
    int verificationCodeTtlMinutes
) {

  public MailProperties {
    if (verificationCodeTtlMinutes <= 0) {
      verificationCodeTtlMinutes = 15;
    }
  }
}
