package com.neuralconsult.sevrage.support;

import com.neuralconsult.sevrage.doctor.DoctorPatientAssignmentRepository;
import com.neuralconsult.sevrage.doctor.DoctorPatientRequest;
import com.neuralconsult.sevrage.doctor.DoctorPatientRequestRepository;
import com.neuralconsult.sevrage.doctor.DoctorProfile;
import com.neuralconsult.sevrage.doctor.DoctorProfileRepository;
import com.neuralconsult.sevrage.notification.NotificationItem;
import com.neuralconsult.sevrage.notification.NotificationService;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.report.DailyReportRepository;
import com.neuralconsult.sevrage.support.dto.AiSupportChatRequest;
import com.neuralconsult.sevrage.support.dto.AiSupportChatResponse;
import com.neuralconsult.sevrage.support.dto.DoctorAlertResponse;
import com.neuralconsult.sevrage.support.dto.SupportConversationResponse;
import com.neuralconsult.sevrage.support.dto.SupportMessageResponse;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class SupportService {

  private final SupportConversationRepository conversationRepository;
  private final SupportMessageRepository messageRepository;
  private final DoctorAlertRepository doctorAlertRepository;
  private final PatientProfileService patientProfileService;
  private final DoctorProfileRepository doctorProfileRepository;
  private final DoctorPatientAssignmentRepository assignmentRepository;
  private final DoctorPatientRequestRepository requestRepository;
  private final DailyReportRepository dailyReportRepository;
  private final AiSupportChatClient aiSupportChatClient;
  private final NotificationService notificationService;

  public SupportService(SupportConversationRepository conversationRepository,
                        SupportMessageRepository messageRepository,
                        DoctorAlertRepository doctorAlertRepository,
                        PatientProfileService patientProfileService,
                        DoctorProfileRepository doctorProfileRepository,
                        DoctorPatientAssignmentRepository assignmentRepository,
                        DoctorPatientRequestRepository requestRepository,
                        DailyReportRepository dailyReportRepository,
                        AiSupportChatClient aiSupportChatClient,
                        NotificationService notificationService) {
    this.conversationRepository = conversationRepository;
    this.messageRepository = messageRepository;
    this.doctorAlertRepository = doctorAlertRepository;
    this.patientProfileService = patientProfileService;
    this.doctorProfileRepository = doctorProfileRepository;
    this.assignmentRepository = assignmentRepository;
    this.requestRepository = requestRepository;
    this.dailyReportRepository = dailyReportRepository;
    this.aiSupportChatClient = aiSupportChatClient;
    this.notificationService = notificationService;
  }

  @Transactional
  public SupportConversationResponse getForPatient(User patientUser) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    return toResponse(getOrCreateConversation(patientProfile));
  }

  @Transactional
  public SupportConversationResponse sendAsPatient(User patientUser, String message) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    SupportConversation conversation = getOrCreateConversation(patientProfile);

    SupportMessage userMessage = new SupportMessage();
    userMessage.setConversation(conversation);
    userMessage.setSenderType(SupportMessage.SenderType.PATIENT);
    userMessage.setContent(message);
    userMessage.setRiskLevel(SupportRiskLevel.LOW);
    messageRepository.save(userMessage);

    AiSupportChatResponse ai = aiSupportChatClient.respond(new AiSupportChatRequest(
        UUID.randomUUID().toString(),
        buildFacts(patientProfile, conversation),
        buildConversationHistory(conversation),
        message
    ));

    SupportMessage aiMessage = new SupportMessage();
    aiMessage.setConversation(conversation);
    aiMessage.setSenderType(SupportMessage.SenderType.AI);
    aiMessage.setContent(ai.reply());
    aiMessage.setRiskLevel(parseRiskLevel(ai.riskLevel()));
    aiMessage.setRequiresDoctorAttention(Boolean.TRUE.equals(ai.shouldAlertDoctor()));
    messageRepository.save(aiMessage);

    conversation.setLatestRiskLevel(parseRiskLevel(ai.riskLevel()));
    conversation.setLatestSummary(ai.summary());
    conversationRepository.save(conversation);

    if (Boolean.TRUE.equals(ai.shouldAlertDoctor()) && conversation.getDoctorProfile() != null) {
      DoctorAlert alert = new DoctorAlert();
      alert.setDoctorProfile(conversation.getDoctorProfile());
      alert.setPatientProfile(patientProfile);
      alert.setConversation(conversation);
      alert.setTriggeringMessage(aiMessage);
      alert.setLevel(parseRiskLevel(ai.riskLevel()));
      alert.setTitle("Alerte soutien IA 24/7");
      alert.setSummary(ai.alertReason() != null && !ai.alertReason().isBlank() ? ai.alertReason() : ai.reply());
      DoctorAlert savedAlert = doctorAlertRepository.save(alert);
      notificationService.notify(
          conversation.getDoctorProfile().getUser(),
          NotificationItem.Type.AI_ALERT,
          "Nouvelle alerte IA 24/7",
          "Une alerte de soutien a ete detectee pour " + patientProfile.getUser().getFullName() + ".",
          "/support?patient=" + patientProfile.getId(),
          "Ouvrir la conversation",
          "support-alert:" + savedAlert.getId()
      );
    }

    return toResponse(conversation);
  }

  @Transactional
  public List<DoctorAlertResponse> listDoctorAlerts(User doctorUser) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    return doctorAlertRepository.findAllByDoctorProfileOrderByCreatedAtDesc(doctorProfile).stream()
        .map(this::toAlertResponse)
        .toList();
  }

  @Transactional
  public SupportConversationResponse getForDoctor(User doctorUser, UUID patientProfileId) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    PatientProfile patientProfile = assignmentRepository.findAllByDoctorProfileAndActiveTrue(doctorProfile).stream()
        .map(item -> item.getPatientProfile())
        .filter(item -> item.getId().equals(patientProfileId))
        .findFirst()
        .orElseGet(() -> requestRepository.findAllByDoctorProfileOrderByCreatedAtDesc(doctorProfile).stream()
            .map(DoctorPatientRequest::getPatientProfile)
            .filter(item -> item.getId().equals(patientProfileId))
            .findFirst()
            .orElseThrow());
    SupportConversation conversation = getOrCreateConversation(patientProfile);
    if (conversation.getDoctorProfile() == null) {
      conversation.setDoctorProfile(doctorProfile);
      conversationRepository.save(conversation);
    }
    return toResponse(conversation);
  }

  @Transactional
  public DoctorAlertResponse acknowledgeAlert(User doctorUser, UUID alertId) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    DoctorAlert alert = doctorAlertRepository.findById(alertId).orElseThrow();
    if (!alert.getDoctorProfile().getId().equals(doctorProfile.getId())) {
      throw new IllegalArgumentException("Cette alerte n'appartient pas au medecin authentifie.");
    }
    alert.setStatus(DoctorAlert.Status.ACKNOWLEDGED);
    alert.setAcknowledgedAt(Instant.now());
    return toAlertResponse(doctorAlertRepository.save(alert));
  }

  private SupportConversation getOrCreateConversation(PatientProfile patientProfile) {
    return conversationRepository.findByPatientProfile(patientProfile).orElseGet(() -> {
      SupportConversation conversation = new SupportConversation();
      conversation.setPatientProfile(patientProfile);
      assignmentRepository.findByPatientProfile(patientProfile)
          .ifPresent(assignment -> conversation.setDoctorProfile(assignment.getDoctorProfile()));
      if (conversation.getDoctorProfile() == null) {
        requestRepository.findFirstByPatientProfileAndStatusOrderByCreatedAtDesc(
                patientProfile,
                DoctorPatientRequest.RequestStatus.ACCEPTED
            )
            .ifPresent(request -> conversation.setDoctorProfile(request.getDoctorProfile()));
      }
      return conversationRepository.save(conversation);
    });
  }

  private Map<String, Object> buildFacts(PatientProfile patientProfile, SupportConversation conversation) {
    Map<String, Object> facts = new LinkedHashMap<>();
    facts.put("patient_name", patientProfile.getUser().getFullName());
    facts.put("city", patientProfile.getCity());
    facts.put("fagerstrom_score", patientProfile.getFagerstromScore());
    facts.put("had_anxiety_score", patientProfile.getHadAnxietyScore());
    facts.put("had_depression_score", patientProfile.getHadDepressionScore());
    facts.put("dependence_level", patientProfile.getDependenceLevel() != null ? patientProfile.getDependenceLevel().name() : null);
    facts.put("doctor_name", conversation.getDoctorProfile() != null ? conversation.getDoctorProfile().getUser().getFullName() : null);
    facts.put("recent_daily_reports", dailyReportRepository.findAllByPatientProfileAndReportDateBetween(
        patientProfile,
        LocalDate.now().minusDays(7),
        LocalDate.now()
    ).stream().map(report -> {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("date", report.getReportDate());
      row.put("cigarettes", report.getCigarettesSmoked());
      row.put("cravings", report.getCravingsIntensity());
      row.put("mood", report.getMoodScore());
      row.put("stress", report.getStressScore());
      row.put("relapse", report.getRelapseEvent());
      return row;
    }).toList());
    return facts;
  }

  private List<Map<String, String>> buildConversationHistory(SupportConversation conversation) {
    List<Map<String, String>> history = new ArrayList<>();
    for (SupportMessage message : messageRepository.findAllByConversationOrderByCreatedAtAsc(conversation)) {
      Map<String, String> row = new LinkedHashMap<>();
      row.put("role", message.getSenderType() == SupportMessage.SenderType.PATIENT ? "user" : "assistant");
      row.put("content", message.getContent());
      history.add(row);
    }
    return history;
  }

  private SupportRiskLevel parseRiskLevel(String raw) {
    try {
      return raw != null ? SupportRiskLevel.valueOf(raw.toUpperCase()) : SupportRiskLevel.LOW;
    } catch (IllegalArgumentException exception) {
      return SupportRiskLevel.LOW;
    }
  }

  private SupportConversationResponse toResponse(SupportConversation conversation) {
    return new SupportConversationResponse(
        conversation.getId(),
        conversation.getPatientProfile().getId(),
        conversation.getDoctorProfile() != null ? conversation.getDoctorProfile().getId() : null,
        conversation.getDoctorProfile() != null ? conversation.getDoctorProfile().getUser().getFullName() : null,
        conversation.getLatestRiskLevel() != null ? conversation.getLatestRiskLevel().name() : SupportRiskLevel.LOW.name(),
        conversation.getLatestSummary(),
        messageRepository.findAllByConversationOrderByCreatedAtAsc(conversation).stream().map(this::toMessageResponse).toList(),
        doctorAlertRepository.findAllByPatientProfileOrderByCreatedAtDesc(conversation.getPatientProfile()).stream().map(this::toAlertResponse).toList()
    );
  }

  private SupportMessageResponse toMessageResponse(SupportMessage message) {
    return new SupportMessageResponse(
        message.getId(),
        message.getSenderType().name(),
        message.getContent(),
        message.getRiskLevel() != null ? message.getRiskLevel().name() : null,
        message.isRequiresDoctorAttention(),
        message.getCreatedAt()
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
