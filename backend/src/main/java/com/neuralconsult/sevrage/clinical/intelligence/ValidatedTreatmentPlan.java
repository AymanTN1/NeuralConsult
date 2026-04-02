package com.neuralconsult.sevrage.clinical.intelligence;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.doctor.DoctorProfile;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "validated_treatment_plan")
public class ValidatedTreatmentPlan extends AuditableEntity {

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false, unique = true)
  private PatientProfile patientProfile;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "doctor_profile_id")
  private DoctorProfile doctorProfile;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "source_candidate_id")
  private AiPlanCandidate sourceCandidate;

  @Enumerated(EnumType.STRING)
  @Column(name = "track", nullable = false, length = 24)
  private AiPlanCandidate.Track track;

  @Column(name = "title", nullable = false, length = 240)
  private String title;

  @Column(name = "summary", nullable = false, length = 4000)
  private String summary;

  @Column(name = "nrt_recommendation", length = 1200)
  private String nrtRecommendation;

  @Column(name = "behavioral_focus", length = 1200)
  private String behavioralFocus;

  @Column(name = "follow_up_plan", length = 1200)
  private String followUpPlan;

  @Column(name = "doctor_note", length = 2000)
  private String doctorNote;

  @ElementCollection
  @CollectionTable(name = "validated_treatment_plan_steps", joinColumns = @JoinColumn(name = "plan_id"))
  @Column(name = "step", length = 600)
  private List<String> steps = new ArrayList<>();

  @Column(name = "validated_at", nullable = false)
  private Instant validatedAt = Instant.now();
}
