package com.neuralconsult.sevrage.plan;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.patient.PatientProfile;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "sevrage_plan")
public class SevragePlan extends AuditableEntity {

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false, unique = true)
  private PatientProfile patientProfile;

  @Enumerated(EnumType.STRING)
  @Column(name = "intensity", length = 16)
  private PlanIntensity intensity;

  @Column(name = "summary", length = 2000)
  private String summary;

  @Column(name = "nrt_recommendation", length = 1200)
  private String nrtRecommendation;

  @Column(name = "behavioral_recommendations", length = 1200)
  private String behavioralRecommendations;

  @Column(name = "follow_up_plan", length = 1200)
  private String followUpPlan;

  @Column(name = "relapse_protocol", length = 1200)
  private String relapseProtocol;

  @Column(name = "start_date")
  private LocalDate startDate;

  @Column(name = "target_quit_date")
  private LocalDate targetQuitDate;

  @ElementCollection
  @CollectionTable(name = "sevrage_plan_steps", joinColumns = @JoinColumn(name = "plan_id"))
  @Column(name = "step", length = 500)
  private List<String> steps = new ArrayList<>();

  public enum PlanIntensity {
    BASIC,
    MODERATE,
    INTENSIVE
  }
}
