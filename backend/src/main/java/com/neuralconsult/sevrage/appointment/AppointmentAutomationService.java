package com.neuralconsult.sevrage.appointment;

import com.neuralconsult.sevrage.mail.MailDeliveryService;
import com.neuralconsult.sevrage.mail.MailTemplateService;
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
  private final AppointmentService appointmentService;
  private final NotificationService notificationService;
  private final MailTemplateService mailTemplateService;
  private final MailDeliveryService mailDeliveryService;
  private final PatientProfileRepository patientProfileRepository;
  private final DailyReportRepository dailyReportRepository;
  private final FagerstromTestRepository fagerstromTestRepository;
  private final HadTestRepository hadTestRepository;

  public AppointmentAutomationService(AppointmentRepository appointmentRepository,
                                      AppointmentService appointmentService,
                                      NotificationService notificationService,
                                      MailTemplateService mailTemplateService,
                                      MailDeliveryService mailDeliveryService,
                                      PatientProfileRepository patientProfileRepository,
                                      DailyReportRepository dailyReportRepository,
                                      FagerstromTestRepository fagerstromTestRepository,
                                      HadTestRepository hadTestRepository) {
    this.appointmentRepository = appointmentRepository;
    this.appointmentService = appointmentService;
    this.notificationService = notificationService;
    this.mailTemplateService = mailTemplateService;
    this.mailDeliveryService = mailDeliveryService;
    this.patientProfileRepository = patientProfileRepository;
    this.dailyReportRepository = dailyReportRepository;
    this.fagerstromTestRepository = fagerstromTestRepository;
    this.hadTestRepository = hadTestRepository;
  }

  @Scheduled(fixedDelay = 60000)
  @Transactional
  public void runAppointmentAutomation() {
    LocalDateTime now = LocalDateTime.now();
    sendVideoRoomLinks(now);
    announceVideoRoomOpen(now);
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

  private void sendVideoRoomLinks(LocalDateTime now) {
    List<Appointment> appointments = appointmentRepository.findAllByStatusAndMeetingLinkSentAtIsNullAndStartsAtBetweenOrderByStartsAtAsc(
        Appointment.Status.CONFIRMED,
        now.minusMinutes(1),
        now.plusMinutes(10)
    );

    for (Appointment appointment : appointments) {
      User patientUser = appointment.getPatientProfile().getUser();
      User doctorUser = appointment.getDoctorProfile().getUser();
      appointmentService.ensureMeetingDetails(appointment);
      appointment.setMeetingLinkSentAt(Instant.now());
      appointmentRepository.save(appointment);

      notificationService.notify(
          patientUser,
          NotificationItem.Type.APPOINTMENT,
          "Lien visio disponible",
          "Votre lien Jitsi Meet est pret pour la consultation du " + formatDateTime(appointment.getStartsAt()) + " avec " + doctorDisplayName(doctorUser.getFullName()) + ".",
          "/appointments",
          "Ouvrir les rendez-vous",
          "appointment-video-link-patient:" + appointment.getId()
      );
      notificationService.notify(
          doctorUser,
          NotificationItem.Type.APPOINTMENT,
          "Lien visio disponible",
          "Le lien Jitsi Meet de la consultation avec " + patientUser.getFullName() + " est pret pour " + formatDateTime(appointment.getStartsAt()) + ".",
          "/appointments",
          "Ouvrir le planning",
          "appointment-video-link-doctor:" + appointment.getId()
      );

      mailDeliveryService.send(
          patientUser,
          mailTemplateService.buildVideoConsultationEmail(
              patientUser,
              "Lien visio de votre consultation",
              "Votre teleconsultation est confirmee. Vous pouvez rejoindre la salle visio des maintenant ou quelques minutes avant le debut.",
              appointment.getStartsAt(),
              doctorDisplayName(doctorUser.getFullName()),
              appointment.getMeetingJoinUrl()
          )
      );
      mailDeliveryService.send(
          doctorUser,
          mailTemplateService.buildVideoConsultationEmail(
              doctorUser,
              "Lien visio de votre consultation",
              "La salle visio du rendez-vous clinique est prete. Vous pouvez l'ouvrir a partir de maintenant.",
              appointment.getStartsAt(),
              patientUser.getFullName(),
              appointment.getMeetingJoinUrl()
          )
      );
    }
  }

  private void announceVideoRoomOpen(LocalDateTime now) {
    List<Appointment> appointments = appointmentRepository.findAllByStatusAndMeetingOpenedAtIsNullAndStartsAtBetweenOrderByStartsAtAsc(
        Appointment.Status.CONFIRMED,
        now.minusMinutes(1),
        now.plusMinutes(1)
    );

    for (Appointment appointment : appointments) {
      User patientUser = appointment.getPatientProfile().getUser();
      User doctorUser = appointment.getDoctorProfile().getUser();
      appointmentService.ensureMeetingDetails(appointment);
      appointment.setMeetingOpenedAt(Instant.now());
      appointmentRepository.save(appointment);

      notificationService.notify(
          patientUser,
          NotificationItem.Type.APPOINTMENT,
          "La visio commence maintenant",
          "La salle Jitsi Meet est ouverte pour votre consultation avec " + doctorDisplayName(doctorUser.getFullName()) + ".",
          "/appointments",
          "Voir le rendez-vous",
          "appointment-video-open-patient:" + appointment.getId()
      );
      notificationService.notify(
          doctorUser,
          NotificationItem.Type.APPOINTMENT,
          "La visio avec " + patientUser.getFullName() + " commence maintenant",
          "La salle Jitsi Meet est ouverte pour la consultation prevue a " + formatDateTime(appointment.getStartsAt()) + ".",
          "/appointments",
          "Voir le planning",
          "appointment-video-open-doctor:" + appointment.getId()
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
