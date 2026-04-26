package com.neuralconsult.sevrage.notification;

import com.neuralconsult.sevrage.mail.MailDeliveryService;
import com.neuralconsult.sevrage.mail.MailTemplateService;
import com.neuralconsult.sevrage.notification.dto.NotificationResponse;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

  private final NotificationRepository notificationRepository;
  private final MailTemplateService mailTemplateService;
  private final MailDeliveryService mailDeliveryService;

  public NotificationService(NotificationRepository notificationRepository,
                             MailTemplateService mailTemplateService,
                             MailDeliveryService mailDeliveryService) {
    this.notificationRepository = notificationRepository;
    this.mailTemplateService = mailTemplateService;
    this.mailDeliveryService = mailDeliveryService;
  }

  @Transactional
  public NotificationItem notify(User user,
                                 NotificationItem.Type type,
                                 String title,
                                 String content,
                                 String actionPath,
                                 String actionLabel,
                                 String dedupeKey) {
    if (dedupeKey != null && !dedupeKey.isBlank()) {
      NotificationItem existing = notificationRepository.findByUserAndDedupeKey(user, dedupeKey).orElse(null);
      if (existing != null) {
        return existing;
      }
    }

    NotificationItem notification = new NotificationItem();
    notification.setUser(user);
    notification.setType(type);
    notification.setTitle(title);
    notification.setContent(content);
    notification.setActionPath(actionPath);
    notification.setActionLabel(actionLabel);
    notification.setDedupeKey(dedupeKey);
    NotificationItem saved = notificationRepository.save(notification);
    sendEmailMirror(saved);
    return saved;
  }

  @Transactional
  public List<NotificationResponse> list(User user) {
    return notificationRepository.findAllByUserOrderByCreatedAtDesc(user).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public NotificationResponse markRead(User user, UUID notificationId) {
    NotificationItem notification = notificationRepository.findByIdAndUser(notificationId, user).orElseThrow();
    notification.setStatus(NotificationItem.Status.READ);
    if (notification.getReadAt() == null) {
      notification.setReadAt(Instant.now());
    }
    return toResponse(notificationRepository.save(notification));
  }

  @Transactional
  public long unreadCount(User user) {
    return notificationRepository.countByUserAndStatus(user, NotificationItem.Status.UNREAD);
  }

  private NotificationResponse toResponse(NotificationItem notification) {
    return new NotificationResponse(
        notification.getId(),
        notification.getType().name(),
        notification.getTitle(),
        notification.getContent(),
        notification.getActionPath(),
        notification.getActionLabel(),
        notification.getStatus().name(),
        notification.getCreatedAt(),
        notification.getReadAt()
    );
  }

  private void sendEmailMirror(NotificationItem notification) {
    if (notification == null || notification.getUser() == null) {
      return;
    }

    if (notification.getType() == NotificationItem.Type.REMINDER) {
      mailDeliveryService.send(
          notification.getUser(),
          mailTemplateService.buildReminderDigestEmail(
              notification.getUser(),
              notification.getTitle(),
              notification.getContent(),
              notification.getCreatedAt() != null
                  ? LocalDateTime.ofInstant(notification.getCreatedAt(), ZoneId.systemDefault())
                  : null
          )
      );
      return;
    }

    if (notification.getType() == NotificationItem.Type.AI_ALERT) {
      mailDeliveryService.send(
          notification.getUser(),
          mailTemplateService.buildUrgentAiAlertEmail(
              notification.getUser(),
              notification.getTitle(),
              notification.getContent(),
              notification.getActionPath(),
              notification.getActionLabel()
          )
      );
      return;
    }

    mailDeliveryService.send(
        notification.getUser(),
        mailTemplateService.buildNotificationEmail(
            notification.getUser(),
            notification.getTitle(),
            notification.getContent(),
            notification.getActionPath(),
            notification.getActionLabel()
        )
    );
  }
}
