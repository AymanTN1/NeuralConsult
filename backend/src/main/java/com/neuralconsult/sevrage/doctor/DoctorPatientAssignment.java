package com.neuralconsult.sevrage.doctor;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.patient.PatientProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "doctor_patient_assignment")
public class DoctorPatientAssignment extends AuditableEntity {

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false, unique = true)
  private PatientProfile patientProfile;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "doctor_profile_id", nullable = false)
  private DoctorProfile doctorProfile;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "source_request_id", unique = true)
  private DoctorPatientRequest sourceRequest;

  @Column(name = "active", nullable = false)
  private boolean active = true;

  @Column(name = "assigned_at", nullable = false)
  private Instant assignedAt = Instant.now();
}
