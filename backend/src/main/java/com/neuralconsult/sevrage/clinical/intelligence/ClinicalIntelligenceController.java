package com.neuralconsult.sevrage.clinical.intelligence;

import com.neuralconsult.sevrage.clinical.intelligence.dto.ClinicalIntelligenceResponse;
import com.neuralconsult.sevrage.doctor.DoctorProfile;
import com.neuralconsult.sevrage.doctor.DoctorProfileRepository;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clinical-intelligence")
public class ClinicalIntelligenceController {

  private final ClinicalIntelligenceService clinicalIntelligenceService;
  private final UserRepository userRepository;
  private final DoctorProfileRepository doctorProfileRepository;
  private final AiPlanCandidateRepository aiPlanCandidateRepository;

  public ClinicalIntelligenceController(
      ClinicalIntelligenceService clinicalIntelligenceService,
      UserRepository userRepository,
      DoctorProfileRepository doctorProfileRepository,
      AiPlanCandidateRepository aiPlanCandidateRepository
  ) {
    this.clinicalIntelligenceService = clinicalIntelligenceService;
    this.userRepository = userRepository;
    this.doctorProfileRepository = doctorProfileRepository;
    this.aiPlanCandidateRepository = aiPlanCandidateRepository;
  }

  @PostMapping("/generate")
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  public ClinicalIntelligenceResponse generate(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return toResponse(clinicalIntelligenceService.generateAndSave(user));
  }

  @GetMapping
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  public ClinicalIntelligenceResponse current(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return clinicalIntelligenceService.getCurrent(user).map(this::toResponse).orElse(null);
  }

  @PostMapping("/plans/{candidateId}/validate")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public ClinicalIntelligenceResponse.ValidatedPlanResponse validatePlan(
      @AuthenticationPrincipal UserDetails principal,
      @PathVariable UUID candidateId,
      @RequestBody(required = false) DoctorNoteRequest request
  ) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(user).orElseThrow();
    AiPlanCandidate candidate = aiPlanCandidateRepository.findById(candidateId).orElseThrow();
    PatientProfile patientProfile = candidate.getPatientProfile();
    ValidatedTreatmentPlan validated = clinicalIntelligenceService.validateCandidate(
        user,
        doctorProfile,
        patientProfile,
        candidate,
        request != null ? request.doctorNote() : null
    );
    return new ClinicalIntelligenceResponse.ValidatedPlanResponse(
        validated.getId(),
        validated.getTrack().name(),
        validated.getTitle(),
        validated.getSummary(),
        validated.getNrtRecommendation(),
        validated.getBehavioralFocus(),
        validated.getFollowUpPlan(),
        validated.getDoctorNote(),
        validated.getSteps(),
        validated.getValidatedAt()
    );
  }

  private ClinicalIntelligenceResponse toResponse(ClinicalIntelligenceService.ClinicalIntelligenceSnapshot snapshot) {
    return new ClinicalIntelligenceResponse(
        snapshot.phaseSummaries().stream()
            .map(item -> new ClinicalIntelligenceResponse.PhaseSummaryResponse(
                item.getId(),
                item.getPhaseId(),
                item.getPhaseTitle(),
                item.getSummary(),
                item.getDoctorNote(),
                item.getAttentionPoints(),
                item.getMissingInformation(),
                item.getModelName(),
                item.getUpdatedAt()
            ))
            .toList(),
        snapshot.globalSummary() != null
            ? new ClinicalIntelligenceResponse.GlobalSummaryResponse(
            snapshot.globalSummary().getId(),
            snapshot.globalSummary().getSummary(),
            snapshot.globalSummary().getDoctorFocusPoints(),
            snapshot.globalSummary().getPatientReadiness(),
            snapshot.globalSummary().getMissingInformation(),
            snapshot.globalSummary().getModelName(),
            snapshot.globalSummary().getUpdatedAt()
        ) : null,
        snapshot.planCandidates().stream()
            .map(item -> new ClinicalIntelligenceResponse.PlanCandidateResponse(
                item.getId(),
                item.getTrack().name(),
                item.getTitle(),
                item.getRationale(),
                item.getNrtRecommendation(),
                item.getBehavioralFocus(),
                item.getFollowUpPlan(),
                item.getDoctorWarnings(),
                item.getSteps(),
                item.getModelName(),
                item.getUpdatedAt()
            ))
            .toList(),
        snapshot.validatedPlan() != null
            ? new ClinicalIntelligenceResponse.ValidatedPlanResponse(
            snapshot.validatedPlan().getId(),
            snapshot.validatedPlan().getTrack().name(),
            snapshot.validatedPlan().getTitle(),
            snapshot.validatedPlan().getSummary(),
            snapshot.validatedPlan().getNrtRecommendation(),
            snapshot.validatedPlan().getBehavioralFocus(),
            snapshot.validatedPlan().getFollowUpPlan(),
            snapshot.validatedPlan().getDoctorNote(),
            snapshot.validatedPlan().getSteps(),
            snapshot.validatedPlan().getValidatedAt()
        ) : null
    );
  }

  public record DoctorNoteRequest(String doctorNote) {
  }
}
