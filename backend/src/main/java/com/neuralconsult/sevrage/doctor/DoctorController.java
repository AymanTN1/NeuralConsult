package com.neuralconsult.sevrage.doctor;

import com.neuralconsult.sevrage.appointment.AppointmentService;
import com.neuralconsult.sevrage.appointment.dto.AppointmentResponse;
import com.neuralconsult.sevrage.clinical.intelligence.AiGlobalSummary;
import com.neuralconsult.sevrage.clinical.intelligence.AiGlobalSummaryRepository;
import com.neuralconsult.sevrage.clinical.intelligence.AiPhaseSummary;
import com.neuralconsult.sevrage.clinical.intelligence.AiPhaseSummaryRepository;
import com.neuralconsult.sevrage.clinical.intelligence.AiPlanCandidate;
import com.neuralconsult.sevrage.clinical.intelligence.AiPlanCandidateRepository;
import com.neuralconsult.sevrage.clinical.intelligence.ClinicalIntelligenceController;
import com.neuralconsult.sevrage.clinical.intelligence.ClinicalIntelligenceResponseBuilder;
import com.neuralconsult.sevrage.clinical.intelligence.ClinicalIntelligenceService;
import com.neuralconsult.sevrage.clinical.intelligence.ValidatedTreatmentPlan;
import com.neuralconsult.sevrage.clinical.intelligence.ValidatedTreatmentPlanRepository;
import com.neuralconsult.sevrage.clinical.notes.ClinicalNote;
import com.neuralconsult.sevrage.clinical.notes.ClinicalNoteRepository;
import com.neuralconsult.sevrage.clinical.notes.dto.ClinicalNoteResponse;
import com.neuralconsult.sevrage.doctor.dto.DoctorFagerstromSummaryResponse;
import com.neuralconsult.sevrage.doctor.dto.DoctorHadSummaryResponse;
import com.neuralconsult.sevrage.doctor.dto.DoctorPatientDecisionRequest;
import com.neuralconsult.sevrage.doctor.dto.DoctorPatientDossierResponse;
import com.neuralconsult.sevrage.doctor.dto.DoctorPatientRequestCreateRequest;
import com.neuralconsult.sevrage.doctor.dto.DoctorPatientRequestResponse;
import com.neuralconsult.sevrage.doctor.dto.DoctorPatientSummaryResponse;
import com.neuralconsult.sevrage.doctor.dto.PatientDoctorAssociationResponse;
import com.neuralconsult.sevrage.doctor.dto.DoctorProfileRequest;
import com.neuralconsult.sevrage.doctor.dto.DoctorProfileResponse;
import com.neuralconsult.sevrage.medical.tests.FagerstromTest;
import com.neuralconsult.sevrage.medical.tests.FagerstromTestRepository;
import com.neuralconsult.sevrage.medical.tests.HadTest;
import com.neuralconsult.sevrage.medical.tests.HadTestRepository;
import com.neuralconsult.sevrage.medical.tests.dto.FagerstromTestResponse;
import com.neuralconsult.sevrage.medical.tests.dto.HadTestResponse;
import com.neuralconsult.sevrage.onboarding.OnboardingAssessment;
import com.neuralconsult.sevrage.onboarding.OnboardingRepository;
import com.neuralconsult.sevrage.onboarding.dto.OnboardingAssessmentResponse;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.report.DailyReport;
import com.neuralconsult.sevrage.report.DailyReportRepository;
import com.neuralconsult.sevrage.report.dto.DailyReportResponse;
import com.neuralconsult.sevrage.support.DoctorAlert;
import com.neuralconsult.sevrage.support.DoctorAlertRepository;
import com.neuralconsult.sevrage.support.SupportConversation;
import com.neuralconsult.sevrage.support.SupportConversationRepository;
import com.neuralconsult.sevrage.support.SupportService;
import com.neuralconsult.sevrage.support.dto.DoctorAlertResponse;
import com.neuralconsult.sevrage.support.dto.SupportConversationResponse;
import com.neuralconsult.sevrage.user.dto.PatientProfileResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import jakarta.transaction.Transactional;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

  private final DoctorProfileService doctorProfileService;
  private final DoctorProfileRepository doctorProfileRepository;
  private final DoctorPatientRequestService requestService;
  private final DoctorPatientAssignmentRepository assignmentRepository;
  private final UserRepository userRepository;
  private final PatientProfileService patientProfileService;
  private final OnboardingRepository onboardingRepository;
  private final FagerstromTestRepository fagerstromTestRepository;
  private final HadTestRepository hadTestRepository;
  private final DailyReportRepository dailyReportRepository;
  private final ClinicalNoteRepository clinicalNoteRepository;
  private final AiPhaseSummaryRepository aiPhaseSummaryRepository;
  private final AiGlobalSummaryRepository aiGlobalSummaryRepository;
  private final AiPlanCandidateRepository aiPlanCandidateRepository;
  private final ValidatedTreatmentPlanRepository validatedTreatmentPlanRepository;
  private final AppointmentService appointmentService;
  private final SupportService supportService;
  private final SupportConversationRepository supportConversationRepository;
  private final DoctorAlertRepository doctorAlertRepository;
  private final ClinicalIntelligenceService clinicalIntelligenceService;

  public DoctorController(
      DoctorProfileService doctorProfileService,
      DoctorProfileRepository doctorProfileRepository,
      DoctorPatientRequestService requestService,
      DoctorPatientAssignmentRepository assignmentRepository,
      UserRepository userRepository,
      PatientProfileService patientProfileService,
      OnboardingRepository onboardingRepository,
      FagerstromTestRepository fagerstromTestRepository,
      HadTestRepository hadTestRepository,
      DailyReportRepository dailyReportRepository,
      ClinicalNoteRepository clinicalNoteRepository,
      AiPhaseSummaryRepository aiPhaseSummaryRepository,
      AiGlobalSummaryRepository aiGlobalSummaryRepository,
      AiPlanCandidateRepository aiPlanCandidateRepository,
      ValidatedTreatmentPlanRepository validatedTreatmentPlanRepository,
      AppointmentService appointmentService,
      SupportService supportService,
      SupportConversationRepository supportConversationRepository,
      DoctorAlertRepository doctorAlertRepository,
      ClinicalIntelligenceService clinicalIntelligenceService
  ) {
    this.doctorProfileService = doctorProfileService;
    this.doctorProfileRepository = doctorProfileRepository;
    this.requestService = requestService;
    this.assignmentRepository = assignmentRepository;
    this.userRepository = userRepository;
    this.patientProfileService = patientProfileService;
    this.onboardingRepository = onboardingRepository;
    this.fagerstromTestRepository = fagerstromTestRepository;
    this.hadTestRepository = hadTestRepository;
    this.dailyReportRepository = dailyReportRepository;
    this.clinicalNoteRepository = clinicalNoteRepository;
    this.aiPhaseSummaryRepository = aiPhaseSummaryRepository;
    this.aiGlobalSummaryRepository = aiGlobalSummaryRepository;
    this.aiPlanCandidateRepository = aiPlanCandidateRepository;
    this.validatedTreatmentPlanRepository = validatedTreatmentPlanRepository;
    this.appointmentService = appointmentService;
    this.supportService = supportService;
    this.supportConversationRepository = supportConversationRepository;
    this.doctorAlertRepository = doctorAlertRepository;
    this.clinicalIntelligenceService = clinicalIntelligenceService;
  }

  @PostMapping("/profile")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public DoctorProfileResponse createOrUpdateProfile(@AuthenticationPrincipal UserDetails principal,
                                                     @RequestBody DoctorProfileRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorProfile profile = doctorProfileService.createOrUpdate(user, request);
    return toResponse(profile, null, null);
  }

  @GetMapping("/profile/me")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public DoctorProfileResponse getMyProfile(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorProfile profile = doctorProfileService.getOrNull(user);
    return profile != null ? toResponse(profile, null, null) : null;
  }

  @GetMapping
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  public List<DoctorProfileResponse> listDoctors(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return doctorProfileService.listMatchesForPatient(user).stream()
        .map(match -> toResponse(match.doctorProfile(), match.matchingMode().name(), match.matchingScore()))
        .toList();
  }

  @GetMapping("/admin/pending")
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  public List<DoctorProfileResponse> listPendingDoctors(@AuthenticationPrincipal UserDetails principal) {
    userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return doctorProfileService.listPendingApproval().stream()
        .map(profile -> toResponse(profile, null, null))
        .toList();
  }

  @PostMapping("/admin/{doctorProfileId}/approve")
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  public DoctorProfileResponse approveDoctor(@AuthenticationPrincipal UserDetails principal,
                                             @PathVariable UUID doctorProfileId) {
    User adminUser = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return toResponse(doctorProfileService.approve(adminUser, doctorProfileId), null, null);
  }

  @PostMapping("/admin/{doctorProfileId}/reject")
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  public DoctorProfileResponse rejectDoctor(@AuthenticationPrincipal UserDetails principal,
                                            @PathVariable UUID doctorProfileId) {
    User adminUser = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return toResponse(doctorProfileService.reject(adminUser, doctorProfileId), null, null);
  }

  @PostMapping("/requests")
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  public DoctorPatientRequestResponse sendRequest(@AuthenticationPrincipal UserDetails principal,
                                                  @RequestBody DoctorPatientRequestCreateRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorProfile doctor = doctorProfileRepository.findById(request.doctorProfileId()).orElseThrow();
    DoctorProfileService.DoctorMatch match = doctorProfileService.listMatchesForPatient(user).stream()
        .filter(item -> item.doctorProfile().getId().equals(doctor.getId()))
        .findFirst()
        .orElse(new DoctorProfileService.DoctorMatch(doctor, DoctorPatientRequest.MatchingMode.TELECONSULTATION, 0));
    DoctorPatientRequest saved = requestService.create(user, doctor, request.patientMessage(), match.matchingMode(), match.matchingScore());
    return toRequestResponse(saved);
  }

  @GetMapping("/requests/patient")
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  @Transactional
  public List<DoctorPatientRequestResponse> listPatientRequests(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return requestService.listForPatient(user).stream().map(this::toRequestResponse).toList();
  }

  @GetMapping("/association/patient")
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  @Transactional
  public PatientDoctorAssociationResponse getPatientAssociation(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    PatientProfile patientProfile = patientProfileService.getOrCreate(user);
    return assignmentRepository.findByPatientProfileAndActiveTrue(patientProfile)
        .map(assignment -> {
          DoctorProfile doctor = assignment.getDoctorProfile();
          return new PatientDoctorAssociationResponse(
              doctor.getId(),
              doctor.getUser().getFullName(),
              doctor.getUser().getEmail(),
              doctor.getSpecialty(),
              doctor.getCity(),
              doctor.getCountryCode(),
              doctor.isAcceptsTeleconsultation(),
              doctor.getYearsExperience(),
              doctor.getSuccessScore(),
              assignment.getAssignedAt()
          );
        })
        .orElse(null);
  }

  @GetMapping("/requests/doctor")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  @Transactional
  public List<DoctorPatientRequestResponse> listDoctorRequests(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return requestService.listForDoctor(user).stream().map(this::toRequestResponse).toList();
  }

  @PostMapping("/requests/{id}/accept")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public DoctorPatientRequestResponse accept(@AuthenticationPrincipal UserDetails principal,
                                             @PathVariable UUID id,
                                             @RequestBody(required = false) DoctorPatientDecisionRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorPatientRequest saved = requestService.decide(
        user,
        id,
        DoctorPatientRequest.RequestStatus.ACCEPTED,
        request != null ? request.note() : null
    );
    return toRequestResponse(saved);
  }

  @PostMapping("/requests/{id}/refuse")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public DoctorPatientRequestResponse refuse(@AuthenticationPrincipal UserDetails principal,
                                             @PathVariable UUID id,
                                             @RequestBody(required = false) DoctorPatientDecisionRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorPatientRequest saved = requestService.decide(
        user,
        id,
        DoctorPatientRequest.RequestStatus.REFUSED,
        request != null ? request.note() : null
    );
    return toRequestResponse(saved);
  }

  @GetMapping("/patients")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  @Transactional
  public List<DoctorPatientSummaryResponse> listAssignedPatients(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return requestService.listAssignments(user).stream()
        .sorted((left, right) -> right.getAssignedAt().compareTo(left.getAssignedAt()))
        .map(assignment -> new DoctorPatientSummaryResponse(
            assignment.getPatientProfile().getId(),
            assignment.getPatientProfile().getUser().getFullName(),
            assignment.getPatientProfile().getUser().getEmail(),
            assignment.getPatientProfile().getDateOfBirth(),
            assignment.getPatientProfile().getCity(),
            assignment.getPatientProfile().getOccupation(),
            assignment.getPatientProfile().getFagerstromScore(),
            assignment.getPatientProfile().getHadAnxietyScore(),
            assignment.getPatientProfile().getHadDepressionScore(),
            assignment.getPatientProfile().isOnboardingComplete(),
            assignment.getPatientProfile().isTestsComplete(),
            assignment.getPatientProfile().isJournalComplete(),
            assignment.getPatientProfile().getDependenceLevel() != null
                ? assignment.getPatientProfile().getDependenceLevel().name()
                : null,
            assignment.getAssignedAt()
        ))
        .toList();
  }

  @GetMapping("/patients/{patientProfileId}/dossier")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  @Transactional
  public DoctorPatientDossierResponse getPatientDossier(@AuthenticationPrincipal UserDetails principal,
                                                        @PathVariable UUID patientProfileId) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(user).orElseThrow();
    PatientProfile patientProfile = getAccessiblePatientProfile(doctorProfile, user, patientProfileId);

    OnboardingAssessment assessment = onboardingRepository.findByPatientProfile(patientProfile).orElse(null);
    FagerstromTest latestFager = fagerstromTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(patientProfile).orElse(null);
    HadTest latestHad = hadTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(patientProfile).orElse(null);
    List<FagerstromTest> fagerstromHistory = fagerstromTestRepository.findAllByPatientProfileOrderByCreatedAtDesc(patientProfile);
    List<HadTest> hadHistory = hadTestRepository.findAllByPatientProfileOrderByCreatedAtDesc(patientProfile);
    List<DailyReport> dailyReports = dailyReportRepository.findAllByPatientProfileAndReportDateBetween(
        patientProfile,
        java.time.LocalDate.now().minusDays(30),
        java.time.LocalDate.now()
    );
    ClinicalNote note = clinicalNoteRepository.findByPatientProfile(patientProfile).orElse(null);
    List<AiPhaseSummary> phaseSummaries = aiPhaseSummaryRepository.findAllByPatientProfileOrderByPhaseIdAsc(patientProfile);
    AiGlobalSummary globalSummary = aiGlobalSummaryRepository.findByPatientProfile(patientProfile).orElse(null);
    List<AiPlanCandidate> planCandidates = aiPlanCandidateRepository.findAllByPatientProfileOrderByTrackAsc(patientProfile);
    ValidatedTreatmentPlan validatedPlan = validatedTreatmentPlanRepository.findByPatientProfile(patientProfile).orElse(null);
    if ((globalSummary == null || phaseSummaries.isEmpty())
        && patientProfile.isOnboardingComplete()
        && patientProfile.isTestsComplete()
        && patientProfile.isJournalComplete()) {
      try {
        clinicalIntelligenceService.generateAndSave(patientProfile.getUser());
        phaseSummaries = aiPhaseSummaryRepository.findAllByPatientProfileOrderByPhaseIdAsc(patientProfile);
        globalSummary = aiGlobalSummaryRepository.findByPatientProfile(patientProfile).orElse(null);
        planCandidates = aiPlanCandidateRepository.findAllByPatientProfileOrderByTrackAsc(patientProfile);
        validatedPlan = validatedTreatmentPlanRepository.findByPatientProfile(patientProfile).orElse(null);
      } catch (Exception ignored) {
        // Le dossier reste consultable meme si la regeneration IA echoue ponctuellement.
      }
    }
    List<AppointmentResponse> appointments = appointmentService.listForDoctor(user).stream()
        .filter(appointment -> appointment.getPatientProfile().getId().equals(patientProfileId))
        .map(this::toResponse)
        .toList();
    SupportConversation conversation = supportConversationRepository.findByPatientProfile(patientProfile).orElse(null);
    SupportConversationResponse supportConversation = supportService.getForDoctor(user, patientProfileId);
    List<DoctorAlertResponse> supportAlerts = doctorAlertRepository.findAllByPatientProfileOrderByCreatedAtDesc(patientProfile).stream()
        .filter(alert -> alert.getDoctorProfile().getId().equals(doctorProfile.getId()))
        .map(this::toAlertResponse)
        .toList();

    return new DoctorPatientDossierResponse(
        patientProfile.getId(),
        patientProfile.getUser().getFullName(),
        patientProfile.getUser().getEmail(),
        toPatientProfileResponse(patientProfile),
        assessment != null ? toAssessmentResponse(assessment) : null,
        latestFager != null
            ? new DoctorFagerstromSummaryResponse(
                latestFager.getId(),
                latestFager.getTotalScore(),
                latestFager.getDependenceLevel() != null ? latestFager.getDependenceLevel().name() : null,
                latestFager.getTimeToFirstCigarette() != null ? latestFager.getTimeToFirstCigarette().name() : null,
                latestFager.getCigarettesPerDay() != null ? latestFager.getCigarettesPerDay().name() : null,
                latestFager.getCreatedAt()
            )
            : null,
        latestHad != null
            ? new DoctorHadSummaryResponse(
                latestHad.getId(),
                latestHad.getAnxietyScore(),
                latestHad.getDepressionScore(),
                latestHad.getAnxietyInterpretation() != null ? latestHad.getAnxietyInterpretation().name() : null,
                latestHad.getDepressionInterpretation() != null ? latestHad.getDepressionInterpretation().name() : null,
                latestHad.getCreatedAt()
            )
            : null,
        fagerstromHistory.stream().map(this::toResponse).toList(),
        hadHistory.stream().map(this::toResponse).toList(),
        dailyReports.stream().map(this::toResponse).toList(),
        note != null
            ? new ClinicalNoteResponse(
                note.getMedicalSummary(),
                note.getComplementaryNote(),
                note.getValidationStatus() != null ? note.getValidationStatus().name() : null,
                note.getModelName(),
                note.getUpdatedAt()
            )
            : null,
        ClinicalIntelligenceResponseBuilder.build(
            phaseSummaries,
            globalSummary,
            planCandidates,
            validatedPlan
        ),
        appointments,
        supportConversation,
        supportAlerts
    );
  }

  @PostMapping("/patients/{patientProfileId}/phase-summaries/{phaseSummaryId}/doctor-note")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  @Transactional
  public ClinicalIntelligenceController.DoctorNoteRequest updateDoctorPhaseNote(
      @AuthenticationPrincipal UserDetails principal,
      @PathVariable UUID patientProfileId,
      @PathVariable UUID phaseSummaryId,
      @RequestBody ClinicalIntelligenceController.DoctorNoteRequest request
  ) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(user).orElseThrow();
    PatientProfile patientProfile = getAccessiblePatientProfile(doctorProfile, user, patientProfileId);
    AiPhaseSummary updated = clinicalIntelligenceService.updateDoctorPhaseNote(
        patientProfile,
        phaseSummaryId,
        request != null ? request.doctorNote() : null
    );
    return new ClinicalIntelligenceController.DoctorNoteRequest(updated.getDoctorNote());
  }

  private PatientProfile getAccessiblePatientProfile(DoctorProfile doctorProfile, User user, UUID patientProfileId) {
    Optional<PatientProfile> assignedPatient = assignmentRepository.findAllByDoctorProfileAndActiveTrue(doctorProfile).stream()
        .map(DoctorPatientAssignment::getPatientProfile)
        .filter(profile -> profile.getId().equals(patientProfileId))
        .findFirst();
    return assignedPatient.orElseGet(() ->
        requestService.listForDoctor(user).stream()
            .map(DoctorPatientRequest::getPatientProfile)
            .filter(profile -> profile.getId().equals(patientProfileId))
            .findFirst()
            .orElseThrow()
    );
  }

  private DoctorProfileResponse toResponse(DoctorProfile profile, String matchingMode, Integer matchingScore) {
    return new DoctorProfileResponse(
        profile.getId(),
        profile.getUser().getId(),
        profile.getUser().getFullName(),
        profile.getUser().getEmail(),
        profile.getCity(),
        profile.getCountryCode(),
        profile.getSpecialty(),
        profile.getBio(),
        profile.isAcceptsTeleconsultation(),
        profile.getYearsExperience(),
        profile.getSuccessScore(),
        profile.isActive(),
        profile.getUser().getStatus().name(),
        matchingMode,
        matchingScore
    );
  }

  private DoctorPatientRequestResponse toRequestResponse(DoctorPatientRequest request) {
    return new DoctorPatientRequestResponse(
        request.getId(),
        request.getStatus().name(),
        request.getMatchingMode() != null ? request.getMatchingMode().name() : null,
        request.getMatchingScore(),
        request.getPatientMessage(),
        request.getDoctorResponseNote(),
        request.getAnsweredAt(),
        request.getCreatedAt(),
        request.getDoctorProfile().getId(),
        request.getDoctorProfile().getUser().getFullName(),
        request.getPatientProfile().getId(),
        request.getPatientProfile().getUser().getFullName()
    );
  }

  private PatientProfileResponse toPatientProfileResponse(PatientProfile profile) {
    return new PatientProfileResponse(
        profile.getDateOfBirth(),
        profile.getSex(),
        profile.getHeightCm(),
        profile.getWeightKg(),
        profile.getCity(),
        profile.getCountryCode(),
        profile.getOccupation(),
        profile.getCigarettesPerDay(),
        profile.getSmokingStartAge(),
        profile.isOnboardingComplete(),
        profile.isTestsComplete(),
        profile.isJournalComplete(),
        profile.getDependenceLevel() != null ? profile.getDependenceLevel().name() : null,
        profile.getMedicalHistoryNotes()
    );
  }

  private OnboardingAssessmentResponse toAssessmentResponse(OnboardingAssessment assessment) {
    return new OnboardingAssessmentResponse(
        assessment.getAppointmentLeadDays(),
        assessment.getPregnant(),
        assessment.getPregnancyTrimester(),
        assessment.getUsesBirthControlPill(),
        assessment.getConsultationObjective(),
        assessment.getProfessionalStatus(),
        assessment.getOtherSmokersAtHome(),
        assessment.getEducationLevel(),
        assessment.getReferralSource(),
        assessment.getRiskHypertension(),
        assessment.getRiskDiabetes(),
        assessment.getRiskHypercholesterolemia(),
        assessment.getCardiovascularMyocardialInfarction(),
        assessment.getCardiovascularAngina(),
        assessment.getCardiovascularStroke(),
        assessment.getCardiovascularPeripheralArteryDisease(),
        assessment.getRespiratoryChronicBronchitis(),
        assessment.getRespiratoryCopd(),
        assessment.getRespiratoryAsthma(),
        assessment.getCancerLung(),
        assessment.getCancerThroat(),
        assessment.getCancerBladder(),
        assessment.getCancerOther(),
        assessment.getCancerOtherDetails(),
        assessment.getMedicationTranquilizers(),
        assessment.getMedicationSleepingPills(),
        assessment.getMedicationAntidepressants(),
        assessment.getMedicationNeuroleptics(),
        assessment.getMedicationMoodRegulators(),
        assessment.getMedicationSubstitutionTreatment(),
        assessment.getDepressionHistory(),
        assessment.getOtherHealthIssues(),
        assessment.getReducedConsumptionLastMonth(),
        assessment.getCurrentlySmoking(),
        assessment.getQuitDays(),
        assessment.getQuitMonths(),
        assessment.getCigarettesPerDayBeforeQuit(),
        assessment.getSmokesDaily(),
        assessment.getManufacturedCigarettesPerDay(),
        assessment.getRolledCigarettesPerDay(),
        assessment.getCigarillosPerDay(),
        assessment.getUsesCigar(),
        assessment.getUsesPipe(),
        assessment.getUsesChewingTobacco(),
        assessment.getUsesSnus(),
        assessment.getUsesHookah(),
        assessment.getUsesPloom(),
        assessment.getOtherTobaccoDetails(),
        assessment.getUsesECigarette(),
        assessment.getEcigWeeklyLiquid(),
        assessment.getUsesNicotineCartridges(),
        assessment.getNicotineCartridgeDosage(),
        assessment.getWeeklyTobaccoSpend(),
        assessment.getIncomeBracket(),
        assessment.getQuitAttempts(),
        assessment.getLongestQuitDays(),
        assessment.getMotivationStage(),
        assessment.getMotivationScore(),
        assessment.getConfidenceScore(),
        assessment.getSmokingReasonAutomatic(),
        assessment.getSmokingReasonConviviality(),
        assessment.getSmokingReasonPleasure(),
        assessment.getSmokingReasonStress(),
        assessment.getSmokingReasonConcentration(),
        assessment.getSmokingReasonSupportMoral(),
        assessment.getSmokingReasonWeight(),
        assessment.getSmokesAtHome(),
        assessment.getUsesOtherTobacco(),
        assessment.getTriggers(),
        assessment.getQuitReasons(),
        assessment.getQuitFears(),
        assessment.getAlcoholFrequency(),
        assessment.getAlcoholQuantity(),
        assessment.getAlcoholBinge(),
        assessment.getAlcoholScore(),
        assessment.getNotes(),
        assessment.getCageCutDown(),
        assessment.getCageAnnoyed(),
        assessment.getCageGuilty(),
        assessment.getCageEyeOpener(),
        assessment.getCageScore(),
        assessment.getCagePositive(),
        assessment.getCannabisLast12Months(),
        assessment.getCannabisFrequency(),
        assessment.getCannabisStartAge(),
        assessment.getWeightConcernScore(),
        assessment.getWeightConfidenceScore(),
        assessment.getPhysicalActivityLevel(),
        assessment.getEpicesQ49(),
        assessment.getEpicesQ50(),
        assessment.getEpicesQ51(),
        assessment.getEpicesQ52(),
        assessment.getEpicesQ53(),
        assessment.getEpicesQ54(),
        assessment.getEpicesQ55(),
        assessment.getEpicesQ56(),
        assessment.getEpicesQ57(),
        assessment.getEpicesQ58(),
        assessment.getEpicesQ59(),
        assessment.getEpicesScore(),
        assessment.getHoncQ1(),
        assessment.getHoncQ2(),
        assessment.getHoncQ3(),
        assessment.getHoncQ4(),
        assessment.getHoncQ5(),
        assessment.getHoncQ6(),
        assessment.getHoncQ7(),
        assessment.getHoncQ8(),
        assessment.getHoncQ9(),
        assessment.getHoncQ10(),
        assessment.getHoncScore(),
        assessment.getHoncHighDependence()
    );
  }

  private FagerstromTestResponse toResponse(FagerstromTest test) {
    return new FagerstromTestResponse(
        test.getId(),
        test.getCreatedAt(),
        test.getTimeToFirstCigarette(),
        test.isDifficultToRefrain(),
        test.getMostDifficultCigarette(),
        test.getCigarettesPerDay(),
        test.isSmokeMoreInMorning(),
        test.isSmokeWhenIll(),
        test.getTotalScore(),
        test.getDependenceLevel() != null ? test.getDependenceLevel().name() : null
    );
  }

  private HadTestResponse toResponse(HadTest test) {
    return new HadTestResponse(
        test.getId(),
        test.getCreatedAt(),
        test.getQ1(),
        test.getQ2(),
        test.getQ3(),
        test.getQ4(),
        test.getQ5(),
        test.getQ6(),
        test.getQ7(),
        test.getQ8(),
        test.getQ9(),
        test.getQ10(),
        test.getQ11(),
        test.getQ12(),
        test.getQ13(),
        test.getQ14(),
        test.getAnxietyScore(),
        test.getAnxietyInterpretation() != null ? test.getAnxietyInterpretation().name() : null,
        test.getDepressionScore(),
        test.getDepressionInterpretation() != null ? test.getDepressionInterpretation().name() : null
    );
  }

  private DailyReportResponse toResponse(DailyReport report) {
    return new DailyReportResponse(
        report.getId(),
        report.getReportDate(),
        report.getCigarettesSmoked(),
        report.getCravingsIntensity(),
        report.getMoodScore(),
        report.getStressScore(),
        report.getUsedNrt(),
        report.getRelapseEvent(),
        report.getNotes()
    );
  }

  private AppointmentResponse toResponse(com.neuralconsult.sevrage.appointment.Appointment appointment) {
    return new AppointmentResponse(
        appointment.getId(),
        appointment.getPatientProfile().getId(),
        appointment.getPatientProfile().getUser().getFullName(),
        appointment.getDoctorProfile().getId(),
        appointment.getDoctorProfile().getUser().getFullName(),
        appointment.getStartsAt(),
        appointment.getDurationMinutes(),
        appointment.getStatus().name(),
        appointment.getReason(),
        appointment.getDoctorNote(),
        appointment.isTriggeredByAiAlert(),
        appointment.getMeetingProvider(),
        appointment.getMeetingJoinUrl(),
        appointment.getMeetingLinkSentAt(),
        appointment.getMeetingOpenedAt(),
        appointment.getCreatedAt(),
        appointment.getUpdatedAt()
    );
  }

  private DoctorAlertResponse toAlertResponse(DoctorAlert alert) {
    return new DoctorAlertResponse(
        alert.getId(),
        alert.getPatientProfile().getId(),
        alert.getPatientProfile().getUser().getFullName(),
        alert.getLevel().name(),
        alert.getTitle(),
        alert.getSummary(),
        alert.getStatus().name(),
        alert.getCreatedAt(),
        alert.getAcknowledgedAt()
    );
  }
}
