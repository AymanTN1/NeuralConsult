package com.neuralconsult.sevrage.appointment;

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
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "doctor_appointment")
public class Appointment extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false)
  private PatientProfile patientProfile;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "doctor_profile_id", nullable = false)
  private DoctorProfile doctorProfile;

  @Column(name = "starts_at", nullable = false)
  private LocalDateTime startsAt;

  @Column(name = "duration_minutes", nullable = false)
  private Integer durationMinutes = 20;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 24)
  private Status status = Status.REQUESTED;

  @Column(name = "reason", length = 2000)
  private String reason;

  @Column(name = "doctor_note", length = 2000)
  private String doctorNote;

  @Column(name = "patient_note", length = 2000)
  private String patientNote;

  @Column(name = "triggered_by_ai_alert", nullable = false)
  private boolean triggeredByAiAlert;

  @Column(name = "conversation_opened_at")
  private Instant conversationOpenedAt;

  public enum Status {
    REQUESTED,
    CONFIRMED,
    REFUSED,
    CANCELLED,
    COMPLETED
  }
}
