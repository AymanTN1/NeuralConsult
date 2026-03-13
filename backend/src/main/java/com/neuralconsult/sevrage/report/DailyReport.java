package com.neuralconsult.sevrage.report;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.patient.PatientProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(
    name = "daily_report",
    uniqueConstraints = @UniqueConstraint(columnNames = {"patient_profile_id", "report_date"})
)
public class DailyReport extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false)
  private PatientProfile patientProfile;

  @Column(name = "report_date", nullable = false)
  private LocalDate reportDate;

  @Column(name = "cigarettes_smoked")
  private Integer cigarettesSmoked;

  @Column(name = "cravings_intensity")
  private Integer cravingsIntensity;

  @Column(name = "mood_score")
  private Integer moodScore;

  @Column(name = "stress_score")
  private Integer stressScore;

  @Column(name = "used_nrt")
  private Boolean usedNrt;

  @Column(name = "relapse_event")
  private Boolean relapseEvent;

  @Column(name = "notes", length = 1000)
  private String notes;
}
