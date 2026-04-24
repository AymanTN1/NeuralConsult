package com.neuralconsult.sevrage.notification;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "notification_item")
public class NotificationItem extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(name = "type", nullable = false, length = 48)
  private Type type = Type.GENERAL;

  @Column(name = "title", nullable = false, length = 240)
  private String title;

  @Column(name = "content", nullable = false, length = 4000)
  private String content;

  @Column(name = "action_path", length = 500)
  private String actionPath;

  @Column(name = "action_label", length = 120)
  private String actionLabel;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 24)
  private Status status = Status.UNREAD;

  @Column(name = "read_at")
  private Instant readAt;

  @Column(name = "dedupe_key", length = 255)
  private String dedupeKey;

  public enum Type {
    GENERAL,
    APPOINTMENT,
    REMINDER,
    AI_ALERT,
    SUPPORT,
    COMMUNITY
  }

  public enum Status {
    UNREAD,
    READ,
    ARCHIVED
  }
}
