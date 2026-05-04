package com.neuralconsult.sevrage.medical;

import com.neuralconsult.sevrage.appointment.Appointment;
import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "consultation_report")
public class ConsultationReport extends AuditableEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @Column(name = "consultation_date")
    private LocalDate consultationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false)
    private ReportType reportType; // INITIAL_ASSESSMENT, FOLLOW_UP

    @Column(name = "follow_up_number")
    private Integer followUpNumber; // 1, 2, 3...

    // Common fields
    @Column(name = "tobacco_consumption_daily")
    private Integer tobaccoConsumptionDaily;

    @Column(name = "co_expired_ppm")
    private Integer coExpiredPpm;

    @Column(name = "time_since_last_cigarette")
    private String timeSinceLastCigarette;

    @Column(name = "observations", length = 2000)
    private String observations;

    // Initial Assessment specific
    @Column(name = "cigarettes_since_waking")
    private Integer cigarettesSinceWaking;

    @Column(name = "stop_date_fixed")
    private Boolean stopDateFixed;

    @Column(name = "reduction_strategy")
    private String reductionStrategy; // NONE, WITH_TREATMENT

    // Follow-up specific
    @Column(name = "patient_stopped")
    private Boolean patientStopped;

    @Column(name = "days_since_stop")
    private Integer daysSinceStop;

    @Column(name = "reduction_plus_50_percent")
    private Boolean reductionPlus50Percent;

    @Column(name = "uses_electronic_cigarette")
    private Boolean usesElectronicCigarette;

    @Column(name = "e_liquid_volume_per_week")
    private String eLiquidVolumePerWeek;

    @Column(name = "uses_nicotine_cartridges")
    private Boolean usesNicotineCartridges;

    @Column(name = "nicotine_cartridge_dosage")
    private String nicotineCartridgeDosage;

    @Column(name = "e_cig_usage_increased")
    private Boolean eCigUsageIncreased;

    // Prescribed Treatment (Shared)
    @Column(name = "prescribed_nrt")
    private Boolean prescribedNrt;

    @Column(name = "nrt_patch")
    private Boolean nrtPatch;
    @Column(name = "nrt_patch_dosage")
    private String nrtPatchDosage; // "16h", "24h", etc.

    @Column(name = "nrt_gum")
    private Boolean nrtGum;
    @Column(name = "nrt_gum_dosage")
    private String nrtGumDosage; // "2mg", "4mg"

    @Column(name = "nrt_lozenge")
    private Boolean nrtLozenge;
    @Column(name = "nrt_lozenge_dosage")
    private String nrtLozengeDosage; // "1mg", "1.5mg", etc.

    @Column(name = "nrt_mouth_spray")
    private Boolean nrtMouthSpray;
    @Column(name = "nrt_inhaler")
    private Boolean nrtInhaler;
    @Column(name = "nrt_microtab")
    private Boolean nrtMicrotab;

    @Column(name = "prescribed_bupropion")
    private Boolean prescribedBupropion;
    @Column(name = "prescribed_varenicline")
    private Boolean prescribedVarenicline;

    @Column(name = "behavioral_techniques")
    private Boolean behavioralTechniques;
    @Column(name = "psychological_referral")
    private Boolean psychologicalReferral;
    @Column(name = "dietetic_care")
    private Boolean dieteticCare;

    @Column(name = "other_treatment", length = 500)
    private String otherTreatment;

    public enum ReportType {
        INITIAL_ASSESSMENT,
        FOLLOW_UP
    }
}
