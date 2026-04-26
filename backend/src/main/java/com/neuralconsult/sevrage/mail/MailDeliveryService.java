package com.neuralconsult.sevrage.mail;

import com.neuralconsult.sevrage.user.User;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class MailDeliveryService {

  private static final Logger LOGGER = LoggerFactory.getLogger(MailDeliveryService.class);

  private final MailProperties mailProperties;
  private final ObjectProvider<JavaMailSender> mailSenderProvider;

  public MailDeliveryService(MailProperties mailProperties,
                             ObjectProvider<JavaMailSender> mailSenderProvider) {
    this.mailProperties = mailProperties;
    this.mailSenderProvider = mailSenderProvider;
  }

  public void send(User user, MailTemplateService.MailEnvelope envelope) {
    if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
      return;
    }
    if (!mailProperties.enabled()) {
      LOGGER.info("Email disabled - skipping structured email '{}' to {}", envelope.subject(), user.getEmail());
      return;
    }

    JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
    if (mailSender == null) {
      LOGGER.warn("Mail sender unavailable - email '{}' to {} was not sent.", envelope.subject(), user.getEmail());
      return;
    }

    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setTo(user.getEmail());
      helper.setSubject(envelope.subject());
      helper.setText(envelope.textBody(), envelope.htmlBody());
      if (mailProperties.fromAddress() != null && !mailProperties.fromAddress().isBlank()) {
        if (mailProperties.fromName() != null && !mailProperties.fromName().isBlank()) {
          helper.setFrom(mailProperties.fromAddress(), mailProperties.fromName());
        } else {
          helper.setFrom(mailProperties.fromAddress());
        }
      }
      mailSender.send(message);
      LOGGER.info("Structured email '{}' sent to {}", envelope.subject(), user.getEmail());
    } catch (Exception exception) {
      LOGGER.warn("Unable to send email '{}' to {}: {}", envelope.subject(), user.getEmail(), exception.getMessage());
    }
  }
}
