package com.neuralconsult.sevrage.clinical.intelligence;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.patient.PatientProfile;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "ai_global_summary")
public class AiGlobalSummary extends AuditableEntity {

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false, unique = true)
  private PatientProfile patientProfile;

  @Column(name = "summary", nullable = false, length = 8000)
  private String summary;

  @ElementCollection
  @CollectionTable(name = "ai_global_summary_focus_points", joinColumns = @JoinColumn(name = "global_summary_id"))
  @Column(name = "focus_point", length = 600)
  private List<String> doctorFocusPoints = new ArrayList<>();

  @Column(name = "patient_readiness", length = 1000)
  private String patientReadiness;

  @ElementCollection
  @CollectionTable(name = "ai_global_summary_missing_info", joinColumns = @JoinColumn(name = "global_summary_id"))
  @Column(name = "missing_item", length = 300)
  private List<String> missingInformation = new ArrayList<>();

  @Column(name = "model_name", length = 80)
  private String modelName;
}
