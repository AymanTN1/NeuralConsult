package com.neuralconsult.sevrage.support;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
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
@Table(name = "support_message")
public class SupportMessage extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "conversation_id", nullable = false)
  private SupportConversation conversation;

  @Enumerated(EnumType.STRING)
  @Column(name = "sender_type", nullable = false, length = 24)
  private SenderType senderType;

  @Column(name = "content", nullable = false, length = 4000)
  private String content;

  @Enumerated(EnumType.STRING)
  @Column(name = "risk_level", length = 24)
  private SupportRiskLevel riskLevel;

  @Column(name = "requires_doctor_attention", nullable = false)
  private boolean requiresDoctorAttention;

  public enum SenderType {
    PATIENT,
    AI,
    SYSTEM
  }
}
