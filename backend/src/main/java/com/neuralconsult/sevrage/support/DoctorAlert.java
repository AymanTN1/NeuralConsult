package com.neuralconsult.sevrage.support;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.doctor.DoctorProfile;
import com.neuralconsult.sevrage.patient.PatientProfile;
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
@Table(name = "doctor_alert")
public class DoctorAlert extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "doctor_profile_id", nullable = false)
  private DoctorProfile doctorProfile;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false)
  private PatientProfile patientProfile;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "conversation_id")
  private SupportConversation conversation;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "triggering_message_id")
  private SupportMessage triggeringMessage;

  @Enumerated(EnumType.STRING)
  @Column(name = "level", nullable = false, length = 24)
  private SupportRiskLevel level;

  @Column(name = "title", nullable = false, length = 240)
  private String title;

  @Column(name = "summary", nullable = false, length = 2000)
  private String summary;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 24)
  private Status status = Status.OPEN;

  @Column(name = "acknowledged_at")
  private Instant acknowledgedAt;

  public enum Status {
    OPEN,
    ACKNOWLEDGED,
    RESOLVED
  }
}
