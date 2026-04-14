package com.neuralconsult.sevrage.community;

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
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "community_connection")
public class CommunityConnection extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "requester_user_id", nullable = false)
  private User requester;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "receiver_user_id", nullable = false)
  private User receiver;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 24)
  private Status status = Status.PENDING;

  public enum Status {
    PENDING,
    ACCEPTED,
    DECLINED
  }
}
