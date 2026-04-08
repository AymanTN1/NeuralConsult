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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "support_conversation")
public class SupportConversation extends AuditableEntity {

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false, unique = true)
  private PatientProfile patientProfile;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "doctor_profile_id")
  private DoctorProfile doctorProfile;

  @Enumerated(EnumType.STRING)
  @Column(name = "latest_risk_level", length = 24)
  private SupportRiskLevel latestRiskLevel = SupportRiskLevel.LOW;

  @Column(name = "latest_summary", length = 2000)
  private String latestSummary;
}
