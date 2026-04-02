package com.neuralconsult.sevrage.doctor;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
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
@Table(name = "doctor_patient_request")
public class DoctorPatientRequest extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false)
  private PatientProfile patientProfile;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "doctor_profile_id", nullable = false)
  private DoctorProfile doctorProfile;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 24)
  private RequestStatus status = RequestStatus.PENDING;

  @Enumerated(EnumType.STRING)
  @Column(name = "matching_mode", length = 24)
  private MatchingMode matchingMode;

  @Column(name = "matching_score")
  private Integer matchingScore;

  @Column(name = "patient_message", length = 1200)
  private String patientMessage;

  @Column(name = "doctor_response_note", length = 1200)
  private String doctorResponseNote;

  @Column(name = "answered_at")
  private Instant answeredAt;

  public enum RequestStatus {
    PENDING,
    ACCEPTED,
    REFUSED,
    CANCELLED
  }

  public enum MatchingMode {
    SAME_CITY,
    SAME_COUNTRY,
    TELECONSULTATION
  }
}
