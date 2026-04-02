package com.neuralconsult.sevrage.clinical.intelligence;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.patient.PatientProfile;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
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
@Table(name = "ai_phase_summary")
public class AiPhaseSummary extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false)
  private PatientProfile patientProfile;

  @Column(name = "phase_id", nullable = false)
  private Integer phaseId;

  @Column(name = "phase_title", nullable = false, length = 160)
  private String phaseTitle;

  @Column(name = "summary", nullable = false, length = 4000)
  private String summary;

  @ElementCollection
  @CollectionTable(name = "ai_phase_summary_attention_points", joinColumns = @JoinColumn(name = "summary_id"))
  @Column(name = "attention_point", length = 600)
  private List<String> attentionPoints = new ArrayList<>();

  @ElementCollection
  @CollectionTable(name = "ai_phase_summary_missing_info", joinColumns = @JoinColumn(name = "summary_id"))
  @Column(name = "missing_item", length = 300)
  private List<String> missingInformation = new ArrayList<>();

  @Column(name = "model_name", length = 80)
  private String modelName;
}
