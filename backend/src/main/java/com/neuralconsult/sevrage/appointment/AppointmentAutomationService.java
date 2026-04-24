package com.neuralconsult.sevrage.appointment;

import com.neuralconsult.sevrage.community.CommunityConnection;
import com.neuralconsult.sevrage.community.CommunityConnectionRepository;
import com.neuralconsult.sevrage.community.CommunityDirectMessage;
import com.neuralconsult.sevrage.community.CommunityDirectMessageRepository;
import com.neuralconsult.sevrage.medical.tests.FagerstromTestRepository;
import com.neuralconsult.sevrage.medical.tests.HadTestRepository;
import com.neuralconsult.sevrage.notification.NotificationItem;
import com.neuralconsult.sevrage.notification.NotificationService;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileRepository;
import com.neuralconsult.sevrage.report.DailyReportRepository;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class AppointmentAutomationService {

  private final AppointmentRepository appointmentRepository;
  private final CommunityConnectionRepository connectionRepository;
  private final CommunityDirectMessageRepository directMessageRepository;
  private final NotificationService notificationService;
  private final PatientProfileRepository patientProfileRepository;
  private final DailyReportRepository dailyReportRepository;
  private final FagerstromTestRepository fagerstromTestRepository;
  private final HadTestRepository hadTestRepository;

  public AppointmentAutomationService(AppointmentRepository appointmentRepository,
                                      CommunityConnectionRepository connectionRepository,
                                      CommunityDirectMessageRepository directMessageRepository,
                                      NotificationService notificationService,
                                      PatientProfileRepository patientProfileRepository,
                                      DailyReportRepository dailyReportRepository,
                                      FagerstromTestRepository fagerstromTestRepository,
                                      HadTestRepository hadTestRepository) {
    this.appointmentRepository = appointmentRepository;
    this.connectionRepository = connectionRepository;
    this.directMessageRepository = directMessageRepository;
    this.notificationService = notificationService;
    this.patientProfileRepository = patientProfileRepository;
    this.dailyReportRepository = dailyReportRepository;
    this.fagerstromTestRepository = fagerstromTestRepository;
    this.hadTestRepository = hadTestRepository;
  }

  @Scheduled(fixedDelay = 60000)
  @Transactional
  public void runAppointmentAutomation() {
    LocalDateTime now = LocalDateTime.now();
    openConsultationChats(now);
    sendAppointmentReminders(now);
  }

  @Scheduled(cron = "0 0 */6 * * *")
  @Transactional
  public void runPatientReminders() {
    LocalDate today = LocalDate.now();
    for (PatientProfile profile : patientProfileRepository.findAll()) {
      if (profile.getUser() == null || !profile.getUser().isAccountEnabled()) {
        continue;
      }
      maybeNotifyTestsReminder(profile, today);
      maybeNotifyJournalReminder(profile, today);
    }
  }

  private void openConsultationChats(LocalDateTime now) {
    List<Appointment> appointments = appointmentRepository.findAllByStatusAndConversationOpenedAtIsNullAndStartsAtBetweenOrderByStartsAtAsc(
        Appointment.Status.CONFIRMED,
        now.minusMinutes(5),
        now.plusMinutes(1)
    );

    for (Appointment appointment : appointments) {
      User patientUser = appointment.getPatientProfile().getUser();
      User doctorUser = appointment.getDoctorProfile().getUser();
      ensureDoctorPatientConnection(patientUser, doctorUser);
      seedConsultationMessages(appointment, doctorUser, patientUser);
      appointment.setConversationOpenedAt(Instant.now());
      appointmentRepository.save(appointment);

      notificationService.notify(
          patientUser,
          NotificationItem.Type.APPOINTMENT,
          "La consultation commence maintenant",
          "La conversation avec " + doctorDisplayName(doctorUser.getFullName()) + " est ouverte pour votre rendez-vous en cours.",
          "/communities?chat=" + doctorUser.getId(),
          "Ouvrir la discussion",
          "appointment-chat-patient:" + appointment.getId()
      );
      notificationService.notify(
          doctorUser,
          NotificationItem.Type.APPOINTMENT,
          "La consultation avec " + patientUser.getFullName() + " est ouverte",
          "La discussion de teleconsultation est demarree automatiquement.",
          "/communities?chat=" + patientUser.getId(),
          "Ouvrir la discussion",
          "appointment-chat-doctor:" + appointment.getId()
      );
    }
  }

  private void sendAppointmentReminders(LocalDateTime now) {
    notifyReminders(
        appointmentRepository.findAllByStatusInAndStartsAtBetweenOrderByStartsAtAsc(
            EnumSet.of(Appointment.Status.CONFIRMED),
            now.plusHours(23).plusMinutes(55),
            now.plusHours(24).plusMinutes(5)
        ),
        "appointment-reminder-24h",
        "Rappel consultation a 24h",
        "Votre consultation est prevue demain a "
    );

    notifyReminders(
        appointmentRepository.findAllByStatusInAndStartsAtBetweenOrderByStartsAtAsc(
            EnumSet.of(Appointment.Status.CONFIRMED),
            now.plusMinutes(9),
            now.plusMinutes(11)
        ),
        "appointment-reminder-10m",
        "Rappel consultation imminente",
        "Votre consultation commence dans moins de 10 minutes, a "
    );
  }

  private void notifyReminders(List<Appointment> appointments,
                               String keyPrefix,
                               String title,
                               String contentPrefix) {
    for (Appointment appointment : appointments) {
      String patientAction = "/appointments";
      String doctorAction = "/appointments";
      notificationService.notify(
          appointment.getPatientProfile().getUser(),
          NotificationItem.Type.REMINDER,
          title,
          contentPrefix + formatDateTime(appointment.getStartsAt()) + " avec " + doctorDisplayName(appointment.getDoctorProfile().getUser().getFullName()) + ".",
          patientAction,
          "Voir le rendez-vous",
          keyPrefix + ":patient:" + appointment.getId()
      );
      notificationService.notify(
          appointment.getDoctorProfile().getUser(),
          NotificationItem.Type.REMINDER,
          title,
          contentPrefix + formatDateTime(appointment.getStartsAt()) + " avec " + appointment.getPatientProfile().getUser().getFullName() + ".",
          doctorAction,
          "Voir le planning",
          keyPrefix + ":doctor:" + appointment.getId()
      );
    }
  }

  private void maybeNotifyTestsReminder(PatientProfile profile, LocalDate today) {
    if (!profile.isOnboardingComplete()) {
      return;
    }
    if (profile.isTestsComplete()) {
      return;
    }
    boolean hasFager = fagerstromTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(profile).isPresent();
    boolean hasHad = hadTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(profile).isPresent();
    String content = hasFager || hasHad
        ? "Il reste encore une partie des tests cliniques a completer pour finaliser votre dossier."
        : "Pensez a passer les tests Fagerstrom et HAD pour finaliser votre evaluation clinique.";
    notificationService.notify(
        profile.getUser(),
        NotificationItem.Type.REMINDER,
        "Rappel tests cliniques",
        content,
        "/tests",
        "Ouvrir les tests",
        "tests-reminder:" + profile.getId() + ":" + today
    );
  }

  private void maybeNotifyJournalReminder(PatientProfile profile, LocalDate today) {
    if (!profile.isOnboardingComplete() || !profile.isTestsComplete()) {
      return;
    }
    List<?> recentReports = dailyReportRepository.findAllByPatientProfileAndReportDateBetween(
        profile,
        today.minusDays(2),
        today.minusDays(1)
    );
    if (!recentReports.isEmpty()) {
      return;
    }
    notificationService.notify(
        profile.getUser(),
        NotificationItem.Type.REMINDER,
        "Rappel journal quotidien",
        "Vous n'avez pas rempli votre journal depuis deux jours. Prenez quelques minutes pour noter cravings, stress et cigarettes.",
        "/journal",
        "Ouvrir le journal",
        "journal-reminder:" + profile.getId() + ":" + today
    );
  }

  private void ensureDoctorPatientConnection(User patientUser, User doctorUser) {
    CommunityConnection connection = connectionRepository.findBetween(patientUser, doctorUser).orElseGet(() -> {
      CommunityConnection created = new CommunityConnection();
      created.setRequester(patientUser);
      created.setReceiver(doctorUser);
      return created;
    });
    connection.setRequester(patientUser);
    connection.setReceiver(doctorUser);
    connection.setStatus(CommunityConnection.Status.ACCEPTED);
    connectionRepository.save(connection);
  }

  private void seedConsultationMessages(Appointment appointment, User doctorUser, User patientUser) {
    CommunityDirectMessage greeting = new CommunityDirectMessage();
    greeting.setSender(doctorUser);
    greeting.setRecipient(patientUser);
    greeting.setContent("Bonjour " + patientUser.getFullName() + ", notre seance de teleconsultation commence maintenant. Je suis " + doctorDisplayName(doctorUser.getFullName()) + ".");

    CommunityDirectMessage contextualQuestion = new CommunityDirectMessage();
    contextualQuestion.setSender(doctorUser);
    contextualQuestion.setRecipient(patientUser);
    contextualQuestion.setContent("Avant de commencer, comment vous sentez-vous aujourd'hui ? Y a-t-il une nouveaute sur votre sante, votre stress, vos envies de fumer ou une difficulte recente que vous souhaitez me signaler ?");

    directMessageRepository.save(greeting);
    directMessageRepository.save(contextualQuestion);
  }

  private String formatDateTime(LocalDateTime dateTime) {
    return dateTime.toLocalDate() + " a " + dateTime.toLocalTime().truncatedTo(ChronoUnit.MINUTES);
  }

  private String doctorDisplayName(String fullName) {
    if (fullName == null || fullName.isBlank()) {
      return "le medecin";
    }
    String trimmed = fullName.trim();
    return trimmed.toLowerCase().startsWith("dr ") ? trimmed : "Dr " + trimmed;
  }
}
