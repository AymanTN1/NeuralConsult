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
  @Column(name = "input_mode", length = 16)
  private InputMode inputMode = InputMode.TEXT;

  @Enumerated(EnumType.STRING)
  @Column(name = "risk_level", length = 24)
  private SupportRiskLevel riskLevel;

  @Column(name = "requires_doctor_attention", nullable = false)
  private boolean requiresDoctorAttention;

  @Column(name = "voice_stress_score")
  private Integer voiceStressScore;

  @Enumerated(EnumType.STRING)
  @Column(name = "voice_stress_level", length = 24)
  private SupportRiskLevel voiceStressLevel;

  @Column(name = "voice_stress_summary", length = 1000)
  private String voiceStressSummary;

  @Column(name = "audio_duration_ms")
  private Long audioDurationMs;

  public enum InputMode {
    TEXT,
    VOICE
  }

  public enum SenderType {
    PATIENT,
    AI,
    SYSTEM
  }
}
