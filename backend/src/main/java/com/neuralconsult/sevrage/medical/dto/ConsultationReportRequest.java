package com.neuralconsult.sevrage.medical.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ConsultationReportRequest {
    private Integer tobaccoConsumptionDaily;
    private Integer coExpiredPpm;
    private String timeSinceLastCigarette;
    private String observations;
    private Integer cigarettesSinceWaking;
    private Boolean stopDateFixed;
    private String reductionStrategy;
    private Boolean patientStopped;
    private Integer daysSinceStop;
    private Boolean reductionPlus50Percent;
    private Boolean usesElectronicCigarette;
    private String eLiquidVolumePerWeek;
    private Boolean usesNicotineCartridges;
    private String nicotineCartridgeDosage;
    private Boolean eCigUsageIncreased;

    // Treatment
    private Boolean prescribedNrt;
    private Boolean nrtPatch;
    private String nrtPatchDosage;
    private Boolean nrtGum;
    private String nrtGumDosage;
    private Boolean nrtLozenge;
    private String nrtLozengeDosage;
    private Boolean nrtMouthSpray;
    private Boolean nrtInhaler;
    private Boolean nrtMicrotab;
    private Boolean prescribedBupropion;
    private Boolean prescribedVarenicline;
    private Boolean behavioralTechniques;
    private Boolean psychologicalReferral;
    private Boolean dieteticCare;
    private String otherTreatment;
}
