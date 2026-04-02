package com.neuralconsult.sevrage.clinical.intelligence;

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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "ai_plan_candidate")
public class AiPlanCandidate extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false)
  private PatientProfile patientProfile;

  @Enumerated(EnumType.STRING)
  @Column(name = "track", nullable = false, length = 24)
  private Track track;

  @Column(name = "title", nullable = false, length = 240)
  private String title;

  @Column(name = "rationale", nullable = false, length = 4000)
  private String rationale;

  @Column(name = "nrt_recommendation", length = 1200)
  private String nrtRecommendation;

  @Column(name = "behavioral_focus", length = 1200)
  private String behavioralFocus;

  @Column(name = "follow_up_plan", length = 1200)
  private String followUpPlan;

  @ElementCollection
  @CollectionTable(name = "ai_plan_candidate_warnings", joinColumns = @JoinColumn(name = "candidate_id"))
  @Column(name = "warning", length = 600)
  private List<String> doctorWarnings = new ArrayList<>();

  @ElementCollection
  @CollectionTable(name = "ai_plan_candidate_steps", joinColumns = @JoinColumn(name = "candidate_id"))
  @Column(name = "step", length = 600)
  private List<String> steps = new ArrayList<>();

  @Column(name = "model_name", length = 80)
  private String modelName;

  public enum Track {
    INTENSIVE,
    BALANCED,
    LONG_TERM
  }
}
