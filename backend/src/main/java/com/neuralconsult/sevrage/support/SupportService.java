package com.neuralconsult.sevrage.support;

import com.neuralconsult.sevrage.doctor.DoctorPatientAssignmentRepository;
import com.neuralconsult.sevrage.doctor.DoctorPatientRequest;
import com.neuralconsult.sevrage.doctor.DoctorPatientRequestRepository;
import com.neuralconsult.sevrage.doctor.DoctorProfile;
import com.neuralconsult.sevrage.doctor.DoctorProfileRepository;
import com.neuralconsult.sevrage.mail.MailDeliveryService;
import com.neuralconsult.sevrage.mail.MailTemplateService;
import com.neuralconsult.sevrage.notification.NotificationItem;
import com.neuralconsult.sevrage.notification.NotificationService;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.report.DailyReportRepository;
import com.neuralconsult.sevrage.support.dto.AiSupportChatRequest;
import com.neuralconsult.sevrage.support.dto.AiSupportChatResponse;
import com.neuralconsult.sevrage.support.dto.AiSupportVoiceChatResponse;
import com.neuralconsult.sevrage.support.dto.DoctorAlertResponse;
import com.neuralconsult.sevrage.support.dto.SupportConversationResponse;
import com.neuralconsult.sevrage.support.dto.SupportMessageResponse;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SupportService {

  private static final long MAX_VOICE_AUDIO_BYTES = 10L * 1024L * 1024L;
  private static final long MAX_VOICE_AUDIO_DURATION_MS = 90_000L;

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
  private final MailTemplateService mailTemplateService;
  private final MailDeliveryService mailDeliveryService;

  public SupportService(SupportConversationRepository conversationRepository,
                        SupportMessageRepository messageRepository,
                        DoctorAlertRepository doctorAlertRepository,
                        PatientProfileService patientProfileService,
                        DoctorProfileRepository doctorProfileRepository,
                        DoctorPatientAssignmentRepository assignmentRepository,
                        DoctorPatientRequestRepository requestRepository,
                        DailyReportRepository dailyReportRepository,
                        AiSupportChatClient aiSupportChatClient,
                        NotificationService notificationService,
                        MailTemplateService mailTemplateService,
                        MailDeliveryService mailDeliveryService) {
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
    this.mailTemplateService = mailTemplateService;
    this.mailDeliveryService = mailDeliveryService;
  }

  @Transactional
  public SupportConversationResponse getForPatient(User patientUser) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    return toResponse(getOrCreateConversation(patientProfile));
  }

  @Transactional
  public SupportConversationResponse sendAsPatient(User patientUser, String message) {
    return sendAsPatient(patientUser, message, false, "fr");
  }

  @Transactional
  public SupportConversationResponse sendAsPatient(User patientUser, String message, boolean emergencyMode) {
    return sendAsPatient(patientUser, message, emergencyMode, "fr");
  }

  @Transactional
  public SupportConversationResponse sendAsPatient(User patientUser, String message, boolean emergencyMode, String preferredLanguage) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    SupportConversation conversation = getOrCreateConversation(patientProfile);
    String language = normalizePreferredLanguage(preferredLanguage);

    SupportMessage userMessage = new SupportMessage();
    userMessage.setConversation(conversation);
    userMessage.setSenderType(SupportMessage.SenderType.PATIENT);
    userMessage.setContent(emergencyMode ? "[SOS Envie] " + message : message);
    userMessage.setRiskLevel(emergencyMode ? SupportRiskLevel.HIGH : SupportRiskLevel.LOW);
    messageRepository.save(userMessage);

    AiSupportChatResponse ai = aiSupportChatClient.respond(new AiSupportChatRequest(
        UUID.randomUUID().toString(),
        buildFacts(patientProfile, conversation),
        buildConversationHistory(conversation),
        message,
        emergencyMode,
        language
    ));

    persistAiResponse(
        patientProfile,
        conversation,
        emergencyMode,
        ai.reply(),
        ai.riskLevel(),
        ai.shouldAlertDoctor(),
        ai.alertReason(),
        ai.summary()
    );

    return toResponse(conversation);
  }

  @Transactional
  public SupportConversationResponse sendVoiceAsPatient(User patientUser,
                                                       MultipartFile audio,
                                                       boolean emergencyMode,
                                                       String preferredLanguage,
                                                       Long audioDurationMs) {
    validateVoiceAudio(audio, audioDurationMs);

    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    SupportConversation conversation = getOrCreateConversation(patientProfile);
    String language = normalizePreferredLanguage(preferredLanguage);

    byte[] audioBytes;
    try {
      audioBytes = audio.getBytes();
    } catch (IOException exception) {
      throw new IllegalArgumentException("Impossible de lire le message vocal.", exception);
    }

    AiSupportVoiceChatResponse ai = aiSupportChatClient.respondVoice(
        new AiSupportChatRequest(
            UUID.randomUUID().toString(),
            buildFacts(patientProfile, conversation),
            buildConversationHistory(conversation),
            "",
            emergencyMode,
            language
        ),
        audioBytes,
        audio.getOriginalFilename(),
        audio.getContentType(),
        audioDurationMs
    );

    if (ai == null || ai.transcription() == null || ai.transcription().isBlank()) {
      throw new IllegalStateException("L'analyse vocale n'a pas produit de transcription exploitable.");
    }

    SupportMessage userMessage = new SupportMessage();
    userMessage.setConversation(conversation);
    userMessage.setSenderType(SupportMessage.SenderType.PATIENT);
    userMessage.setInputMode(SupportMessage.InputMode.VOICE);
    userMessage.setContent(emergencyMode ? "[SOS Envie] " + ai.transcription().trim() : ai.transcription().trim());
    userMessage.setRiskLevel(emergencyMode ? SupportRiskLevel.HIGH : SupportRiskLevel.LOW);
    userMessage.setVoiceStressScore(clampStressScore(ai.voiceStressScore()));
    userMessage.setVoiceStressLevel(parseRiskLevel(ai.voiceStressLevel()));
    userMessage.setVoiceStressSummary(ai.voiceStressSummary());
    userMessage.setAudioDurationMs(audioDurationMs);
    messageRepository.save(userMessage);

    persistAiResponse(
        patientProfile,
        conversation,
        emergencyMode,
        ai.reply(),
        ai.riskLevel(),
        ai.shouldAlertDoctor(),
        ai.alertReason(),
        ai.summary()
    );

    return toResponse(conversation);
  }

  private void persistAiResponse(PatientProfile patientProfile,
                                 SupportConversation conversation,
                                 boolean emergencyMode,
                                 String reply,
                                 String riskLevel,
                                 Boolean shouldAlertDoctor,
                                 String alertReason,
                                 String summary) {
    String safeReply = reply != null && !reply.isBlank()
        ? reply
        : "Je suis la avec vous. Pouvez-vous me dire ce qui vous pese le plus en ce moment ?";

    SupportMessage aiMessage = new SupportMessage();
    aiMessage.setConversation(conversation);
    aiMessage.setSenderType(SupportMessage.SenderType.AI);
    aiMessage.setContent(safeReply);
    aiMessage.setRiskLevel(parseRiskLevel(riskLevel));
    aiMessage.setRequiresDoctorAttention(Boolean.TRUE.equals(shouldAlertDoctor));
    messageRepository.save(aiMessage);

    conversation.setLatestRiskLevel(parseRiskLevel(riskLevel));
    conversation.setLatestSummary(summary);
    conversationRepository.save(conversation);

    if (Boolean.TRUE.equals(shouldAlertDoctor) && conversation.getDoctorProfile() != null) {
      DoctorAlert alert = new DoctorAlert();
      alert.setDoctorProfile(conversation.getDoctorProfile());
      alert.setPatientProfile(patientProfile);
      alert.setConversation(conversation);
      alert.setTriggeringMessage(aiMessage);
      alert.setLevel(parseRiskLevel(riskLevel));
      alert.setTitle(emergencyMode ? "SOS Envie - alerte urgence craving" : "Alerte soutien IA 24/7");
      alert.setSummary(alertReason != null && !alertReason.isBlank() ? alertReason : safeReply);
      DoctorAlert savedAlert = doctorAlertRepository.save(alert);
      savedAlert.setLastNotificationSentAt(Instant.now());
      savedAlert = doctorAlertRepository.save(savedAlert);
      notificationService.notify(
          conversation.getDoctorProfile().getUser(),
          NotificationItem.Type.AI_ALERT,
          emergencyMode ? "SOS Envie critique" : "Nouvelle alerte IA 24/7",
          (emergencyMode
              ? "SOS Envie declenche par " + patientProfile.getUser().getFullName() + ". L'IA a juge l'envie critique et demande une verification rapide. Canaux actives: notification application, push navigateur si autorise, email urgent."
              : "Une alerte prioritaire de soutien a ete detectee pour " + patientProfile.getUser().getFullName() + ". Consulte la conversation des que possible pour confirmer l'urgence clinique."),
          "/support?patient=" + patientProfile.getId(),
          "Ouvrir la conversation",
          "support-alert:" + savedAlert.getId()
      );
    }
  }

  private void validateVoiceAudio(MultipartFile audio, Long audioDurationMs) {
    if (audio == null || audio.isEmpty()) {
      throw new IllegalArgumentException("Le message vocal est vide.");
    }
    if (audio.getSize() > MAX_VOICE_AUDIO_BYTES) {
      throw new IllegalArgumentException("Le message vocal depasse la taille autorisee de 10 Mo.");
    }
    if (audioDurationMs != null && audioDurationMs > MAX_VOICE_AUDIO_DURATION_MS) {
      throw new IllegalArgumentException("Le message vocal doit durer 90 secondes maximum.");
    }

    String contentType = audio.getContentType() != null ? audio.getContentType().toLowerCase() : "";
    boolean accepted = contentType.startsWith("audio/")
        || contentType.startsWith("video/webm")
        || contentType.equals("application/octet-stream");
    if (!accepted) {
      throw new IllegalArgumentException("Format audio non accepte. Utilisez un enregistrement vocal du navigateur.");
    }
  }

  private Integer clampStressScore(Integer score) {
    if (score == null) {
      return null;
    }
    return Math.max(0, Math.min(100, score));
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

  @Scheduled(fixedDelay = 3600000)
  @Transactional
  public void resendOpenAlertEmails() {
    Instant threshold = Instant.now().minusSeconds(8 * 3600L);
    for (DoctorAlert alert : doctorAlertRepository.findAllByStatusOrderByCreatedAtAsc(DoctorAlert.Status.OPEN)) {
      if (alert.getDoctorProfile() == null || alert.getDoctorProfile().getUser() == null) {
        continue;
      }
      if (alert.getLastNotificationSentAt() != null && alert.getLastNotificationSentAt().isAfter(threshold)) {
        continue;
      }
      sendUrgentAlertEmail(alert);
      alert.setLastNotificationSentAt(Instant.now());
      doctorAlertRepository.save(alert);
    }
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

  private void sendUrgentAlertEmail(DoctorAlert alert) {
    String actionPath = "/support?patient=" + alert.getPatientProfile().getId();
    String content = "Le patient " + alert.getPatientProfile().getUser().getFullName()
        + " presente une alerte IA encore ouverte. Resume : "
        + alert.getSummary();
    mailDeliveryService.send(
        alert.getDoctorProfile().getUser(),
        mailTemplateService.buildUrgentAiAlertEmail(
            alert.getDoctorProfile().getUser(),
            "Alerte urgente IA 24/7 a verifier",
            content,
            actionPath,
            "Ouvrir la conversation"
        )
    );
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

  private String normalizePreferredLanguage(String raw) {
    if (raw == null || raw.isBlank()) {
      return "fr";
    }
    String value = raw.trim().toLowerCase();
    if (value.equals("darija") || value.equals("ar") || value.equals("ar-ma") || value.equals("ma")) {
      return "darija";
    }
    if (value.equals("en") || value.equals("english")) {
      return "en";
    }
    return "fr";
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
        message.getInputMode() != null ? message.getInputMode().name() : SupportMessage.InputMode.TEXT.name(),
        message.getRiskLevel() != null ? message.getRiskLevel().name() : null,
        message.getVoiceStressScore(),
        message.getVoiceStressLevel() != null ? message.getVoiceStressLevel().name() : null,
        message.getVoiceStressSummary(),
        message.getAudioDurationMs(),
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
