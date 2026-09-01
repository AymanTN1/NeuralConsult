package com.neuralconsult.sevrage.appointment;

import com.neuralconsult.sevrage.appointment.dto.AppointmentDecisionRequest;
import com.neuralconsult.sevrage.appointment.dto.AppointmentRequest;
import com.neuralconsult.sevrage.appointment.dto.AppointmentUpdateRequest;
import com.neuralconsult.sevrage.appointment.dto.AvailableAppointmentSlotResponse;
import com.neuralconsult.sevrage.appointment.dto.DoctorAvailabilityRequest;
import com.neuralconsult.sevrage.appointment.dto.DoctorUrgentAppointmentRequest;
import com.neuralconsult.sevrage.doctor.DoctorPatientAssignment;
import com.neuralconsult.sevrage.doctor.DoctorPatientAssignmentRepository;
import com.neuralconsult.sevrage.doctor.DoctorProfile;
import com.neuralconsult.sevrage.doctor.DoctorProfileRepository;
import com.neuralconsult.sevrage.notification.NotificationItem;
import com.neuralconsult.sevrage.notification.NotificationService;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileRepository;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class AppointmentService {

  private static final int SLOT_MINUTES = 20;
  private static final int MAX_APPOINTMENTS_PER_MONTH = 4;
  private static final int MAX_APPOINTMENTS_PER_WEEK = 1;
  private static final int AVAILABILITY_WINDOW_DAYS = 180;
  private static final String MEETING_PROVIDER = "JITSI";
  private static final String JITSI_BASE_URL = "https://meet.jit.si/";
  private static final DateTimeFormatter MEETING_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmm");

  private final AppointmentRepository appointmentRepository;
  private final DoctorProfileRepository doctorProfileRepository;
  private final DoctorPatientAssignmentRepository assignmentRepository;
  private final DoctorAvailabilityRepository availabilityRepository;
  private final PatientProfileRepository patientProfileRepository;
  private final PatientProfileService patientProfileService;
  private final NotificationService notificationService;

  public AppointmentService(AppointmentRepository appointmentRepository,
                            DoctorProfileRepository doctorProfileRepository,
                            DoctorPatientAssignmentRepository assignmentRepository,
                            DoctorAvailabilityRepository availabilityRepository,
                            PatientProfileRepository patientProfileRepository,
                            PatientProfileService patientProfileService,
                            NotificationService notificationService) {
    this.appointmentRepository = appointmentRepository;
    this.doctorProfileRepository = doctorProfileRepository;
    this.assignmentRepository = assignmentRepository;
    this.availabilityRepository = availabilityRepository;
    this.patientProfileRepository = patientProfileRepository;
    this.patientProfileService = patientProfileService;
    this.notificationService = notificationService;
  }

  @Transactional
  public Appointment request(User patientUser, AppointmentRequest request) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    DoctorPatientAssignment assignment = assignmentRepository.findByPatientProfileAndActiveTrue(patientProfile)
        .orElseThrow(() -> new IllegalArgumentException("Vous devez d'abord etre accepte par un medecin pour demander un rendez-vous."));
    DoctorProfile doctorProfile = doctorProfileRepository.findById(request.doctorProfileId()).orElseThrow();
    if (!doctorProfile.isActive()) {
      throw new IllegalArgumentException("Le compte medecin n'est pas encore valide.");
    }
    if (!assignment.getDoctorProfile().getId().equals(doctorProfile.getId())) {
      throw new IllegalArgumentException("Le rendez-vous doit etre demande uniquement a votre medecin associe.");
    }

    validateSlot(request.startsAt());
    ensureSlotMatchesAvailability(doctorProfile, request.startsAt());
    enforcePatientBookingLimits(patientProfile, request.startsAt());

    boolean occupied = appointmentRepository.existsByDoctorProfileAndStartsAtAndStatusIn(
        doctorProfile,
        request.startsAt(),
        EnumSet.of(Appointment.Status.REQUESTED, Appointment.Status.CONFIRMED)
    );
    if (occupied) {
      throw new IllegalArgumentException("Ce creneau est deja reserve.");
    }

    Appointment appointment = new Appointment();
    appointment.setPatientProfile(patientProfile);
    appointment.setDoctorProfile(doctorProfile);
    appointment.setStartsAt(request.startsAt());
    appointment.setReason(request.reason());
    appointment.setPatientNote(request.reason());
    appointment.setTriggeredByAiAlert(Boolean.TRUE.equals(request.triggeredByAiAlert()));
    ensureMeetingDetails(appointment);
    Appointment saved = appointmentRepository.save(appointment);
    notificationService.notify(
        doctorProfile.getUser(),
        NotificationItem.Type.APPOINTMENT,
        "Nouvelle demande de rendez-vous",
        patientProfile.getUser().getFullName() + " a demande un rendez-vous pour le " + formatDateTime(saved.getStartsAt()) + ".",
        "/appointments",
        "Voir le planning",
        "appointment-request-doctor:" + saved.getId()
    );
    notificationService.notify(
        patientProfile.getUser(),
        NotificationItem.Type.APPOINTMENT,
        "Demande envoyee",
        "Votre demande de rendez-vous avec " + doctorDisplayName(doctorProfile.getUser().getFullName()) + " est en attente de confirmation.",
        "/appointments",
        "Voir mes rendez-vous",
        "appointment-request-patient:" + saved.getId()
    );
    return saved;
  }

  @Transactional
  public Appointment createUrgentAsDoctor(User doctorUser, DoctorUrgentAppointmentRequest request) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    PatientProfile patientProfile = patientProfileRepository.findById(request.patientProfileId())
        .orElseThrow(() -> new IllegalArgumentException("Patient introuvable."));
    assignmentRepository.findByDoctorProfileAndPatientProfileAndActiveTrue(doctorProfile, patientProfile)
        .orElseThrow(() -> new IllegalArgumentException("Ce patient n'est pas actuellement associe a ce medecin."));

    validateSlot(request.startsAt());
    boolean occupied = appointmentRepository.existsByDoctorProfileAndStartsAtAndStatusIn(
        doctorProfile,
        request.startsAt(),
        EnumSet.of(Appointment.Status.REQUESTED, Appointment.Status.CONFIRMED)
    );
    if (occupied) {
      throw new IllegalArgumentException("Ce creneau est deja reserve. Choisis une autre heure pour la consultation urgente.");
    }

    Appointment appointment = new Appointment();
    appointment.setPatientProfile(patientProfile);
    appointment.setDoctorProfile(doctorProfile);
    appointment.setStartsAt(request.startsAt());
    appointment.setReason(request.reason());
    appointment.setDoctorNote("Consultation urgente creee par le medecin.");
    appointment.setTriggeredByAiAlert(request.triggeredByAiAlert() == null || request.triggeredByAiAlert());
    appointment.setStatus(Appointment.Status.CONFIRMED);
    ensureMeetingDetails(appointment);
    Appointment saved = appointmentRepository.save(appointment);
    notificationService.notify(
        patientProfile.getUser(),
        NotificationItem.Type.APPOINTMENT,
        "Consultation urgente programmee",
        doctorDisplayName(doctorProfile.getUser().getFullName()) + " a cree une consultation urgente pour le " + formatDateTime(saved.getStartsAt()) + ". Le lien visio sera envoye automatiquement juste avant la seance.",
        "/appointments",
        "Ouvrir le rendez-vous",
        "appointment-urgent-patient:" + saved.getId()
    );
    notificationService.notify(
        doctorProfile.getUser(),
        NotificationItem.Type.APPOINTMENT,
        "Consultation urgente creee",
        "La consultation urgente de " + patientProfile.getUser().getFullName() + " est confirmee pour le " + formatDateTime(saved.getStartsAt()) + ".",
        "/appointments",
        "Voir le planning",
        "appointment-urgent-doctor:" + saved.getId()
    );
    return saved;
  }

  @Transactional
  public Appointment updateAsPatient(User patientUser, UUID appointmentId, AppointmentUpdateRequest request) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    Appointment appointment = appointmentRepository.findByIdAndPatientProfile(appointmentId, patientProfile).orElseThrow();
    if (appointment.getStatus() == Appointment.Status.CANCELLED
        || appointment.getStatus() == Appointment.Status.REFUSED
        || appointment.getStatus() == Appointment.Status.COMPLETED) {
      throw new IllegalArgumentException("Ce rendez-vous ne peut plus etre modifie.");
    }

    boolean changed = applyAppointmentUpdate(
        appointment,
        request,
        false
    );

    if (!changed) {
      return appointment;
    }

    appointment.setStatus(Appointment.Status.REQUESTED);
    Appointment saved = appointmentRepository.save(appointment);
    notificationService.notify(
        appointment.getDoctorProfile().getUser(),
        NotificationItem.Type.APPOINTMENT,
        "Demande de rendez-vous modifiee",
        patientProfile.getUser().getFullName() + " a modifie sa demande de rendez-vous pour le " + formatDateTime(saved.getStartsAt()) + ".",
        "/appointments",
        "Voir le planning",
        "appointment-updated-doctor:" + saved.getId() + ":" + saved.getUpdatedAt()
    );
    notificationService.notify(
        patientProfile.getUser(),
        NotificationItem.Type.APPOINTMENT,
        "Demande mise a jour",
        "Votre rendez-vous a ete remis en attente de confirmation apres modification.",
        "/appointments",
        "Voir mes rendez-vous",
        "appointment-updated-patient:" + saved.getId() + ":" + saved.getUpdatedAt()
    );
    return saved;
  }

  @Transactional
  public Appointment updateAsDoctor(User doctorUser, UUID appointmentId, AppointmentUpdateRequest request) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    Appointment appointment = appointmentRepository.findByIdAndDoctorProfile(appointmentId, doctorProfile).orElseThrow();
    if (appointment.getStatus() == Appointment.Status.CANCELLED
        || appointment.getStatus() == Appointment.Status.REFUSED
        || appointment.getStatus() == Appointment.Status.COMPLETED) {
      throw new IllegalArgumentException("Ce rendez-vous ne peut plus etre modifie.");
    }

    boolean changed = applyAppointmentUpdate(
        appointment,
        request,
        appointment.isTriggeredByAiAlert()
    );

    if (!changed) {
      return appointment;
    }

    Appointment saved = appointmentRepository.save(appointment);
    notificationService.notify(
        appointment.getPatientProfile().getUser(),
        NotificationItem.Type.APPOINTMENT,
        "Rendez-vous modifie par le medecin",
        doctorDisplayName(doctorProfile.getUser().getFullName()) + " a mis a jour votre rendez-vous prevu le " + formatDateTime(saved.getStartsAt()) + ".",
        "/appointments",
        "Voir mes rendez-vous",
        "appointment-updated-by-doctor:" + saved.getId() + ":" + saved.getUpdatedAt()
    );
    return saved;
  }

  @Transactional
  public List<Appointment> listForPatient(User patientUser) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    return appointmentRepository.findAllByPatientProfileOrderByStartsAtDesc(patientProfile);
  }

  @Transactional
  public List<Appointment> listForDoctor(User doctorUser) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    return appointmentRepository.findAllByDoctorProfileOrderByStartsAtDesc(doctorProfile);
  }

  @Transactional
  public Appointment updateStatusAsDoctor(User doctorUser,
                                          UUID appointmentId,
                                          Appointment.Status status,
                                          AppointmentDecisionRequest request) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    Appointment appointment = appointmentRepository.findByIdAndDoctorProfile(appointmentId, doctorProfile).orElseThrow();
    appointment.setStatus(status);
    if (request != null) {
      appointment.setDoctorNote(request.doctorNote());
    }
    if (status == Appointment.Status.CONFIRMED) {
      ensureMeetingDetails(appointment);
    }
    Appointment saved = appointmentRepository.save(appointment);
    notificationService.notify(
        appointment.getPatientProfile().getUser(),
        NotificationItem.Type.APPOINTMENT,
        switch (status) {
          case CONFIRMED -> "Rendez-vous confirme";
          case REFUSED -> "Rendez-vous refuse";
          case COMPLETED -> "Consultation terminee";
          case CANCELLED -> "Rendez-vous annule";
          default -> "Rendez-vous mis a jour";
        },
        buildPatientStatusMessage(saved),
        "/appointments",
        "Voir mes rendez-vous",
        "appointment-status-patient:" + saved.getId() + ":" + status.name()
    );
    return saved;
  }

  @Transactional
  public Appointment cancelAsPatient(User patientUser, UUID appointmentId) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    Appointment appointment = appointmentRepository.findByIdAndPatientProfile(appointmentId, patientProfile).orElseThrow();
    appointment.setStatus(Appointment.Status.CANCELLED);
    Appointment saved = appointmentRepository.save(appointment);
    notificationService.notify(
        appointment.getDoctorProfile().getUser(),
        NotificationItem.Type.APPOINTMENT,
        "Rendez-vous annule par le patient",
        patientProfile.getUser().getFullName() + " a annule le rendez-vous prevu le " + formatDateTime(saved.getStartsAt()) + ".",
        "/appointments",
        "Voir le planning",
        "appointment-cancel-doctor:" + saved.getId()
    );
    return saved;
  }

  @Transactional
  public Appointment cancelAsDoctor(User doctorUser, UUID appointmentId) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    Appointment appointment = appointmentRepository.findByIdAndDoctorProfile(appointmentId, doctorProfile).orElseThrow();
    appointment.setStatus(Appointment.Status.CANCELLED);
    Appointment saved = appointmentRepository.save(appointment);
    notificationService.notify(
        appointment.getPatientProfile().getUser(),
        NotificationItem.Type.APPOINTMENT,
        "Rendez-vous annule par le medecin",
        doctorDisplayName(doctorProfile.getUser().getFullName()) + " a annule le rendez-vous prevu le " + formatDateTime(saved.getStartsAt()) + ".",
        "/appointments",
        "Voir mes rendez-vous",
        "appointment-cancel-patient:" + saved.getId()
    );
    return saved;
  }

  @Transactional
  public List<DoctorAvailability> listAvailabilitiesForDoctor(User doctorUser) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    return availabilityRepository.findAllByDoctorProfile(doctorProfile).stream()
        .sorted(Comparator
            .comparing(DoctorAvailability::getAvailableDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(DoctorAvailability::getDayOfWeek, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(DoctorAvailability::getStartTime))
        .toList();
  }

  @Transactional
  public DoctorAvailability saveAvailability(User doctorUser, DoctorAvailabilityRequest request) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    LocalTime startTime = request.startTime();
    LocalTime endTime = request.endTime();
    LocalDate availableDate = request.availableDate();
    if (startTime == null || endTime == null) {
      throw new IllegalArgumentException("Les horaires de debut et de fin sont obligatoires.");
    }
    if (availableDate == null) {
      throw new IllegalArgumentException("La date de disponibilite est obligatoire.");
    }
    if (availableDate.isBefore(LocalDate.now())) {
      throw new IllegalArgumentException("La date de disponibilite doit etre aujourd'hui ou dans le futur.");
    }
    if (!endTime.isAfter(startTime)) {
      throw new IllegalArgumentException("L'horaire de fin doit etre apres l'horaire de debut.");
    }
    int slotDuration = request.slotDurationMinutes() != null && request.slotDurationMinutes() >= 15
        ? request.slotDurationMinutes()
        : SLOT_MINUTES;
    int bufferMinutes = request.bufferMinutes() != null && request.bufferMinutes() >= 0
        ? request.bufferMinutes()
        : 10;

    if (startTime.plusMinutes(slotDuration).isAfter(endTime)) {
      throw new IllegalArgumentException("Chaque plage doit couvrir au moins un creneau de " + slotDuration + " minutes.");
    }

    DoctorAvailability availability = request.id() != null
        ? availabilityRepository.findByIdAndDoctorProfile(request.id(), doctorProfile)
            .orElseThrow(() -> new IllegalArgumentException("Cette disponibilite est introuvable ou n'appartient pas a ce medecin."))
        : new DoctorAvailability();
    availability.setDoctorProfile(doctorProfile);
    availability.setAvailableDate(availableDate);
    availability.setDayOfWeek(availableDate.getDayOfWeek());
    availability.setStartTime(startTime);
    availability.setEndTime(endTime);
    availability.setActive(request.active() == null || request.active());
    availability.setBufferMinutes(bufferMinutes);
    availability.setSlotDurationMinutes(slotDuration);
    return availabilityRepository.save(availability);
  }

  @Transactional
  public void deleteAvailability(User doctorUser, UUID availabilityId) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    DoctorAvailability availability = availabilityRepository.findByIdAndDoctorProfile(availabilityId, doctorProfile).orElseThrow();
    availabilityRepository.delete(availability);
  }

  @Transactional
  public List<AvailableAppointmentSlotResponse> listAvailableSlotsForPatient(User patientUser) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    DoctorPatientAssignment assignment = assignmentRepository.findByPatientProfileAndActiveTrue(patientProfile)
        .orElseThrow(() -> new IllegalArgumentException("Vous devez d'abord etre accepte par un medecin pour consulter ses disponibilites."));
    return buildAvailableSlots(assignment.getDoctorProfile(), AVAILABILITY_WINDOW_DAYS);
  }

  private void validateSlot(LocalDateTime startsAt) {
    if (startsAt == null) {
      throw new IllegalArgumentException("La date du rendez-vous est obligatoire.");
    }
    if (startsAt.isBefore(LocalDateTime.now().minusMinutes(1))) {
      throw new IllegalArgumentException("Le rendez-vous doit etre planifie dans le futur.");
    }
    if (startsAt.getSecond() != 0 || startsAt.getNano() != 0) {
      throw new IllegalArgumentException("Le creneau choisi est invalide. Choisis une heure exacte proposee par la plateforme.");
    }
  }

  private boolean applyAppointmentUpdate(Appointment appointment,
                                         AppointmentUpdateRequest request,
                                         boolean bypassAvailability) {
    if (request == null) {
      throw new IllegalArgumentException("La modification du rendez-vous est vide.");
    }

    boolean changed = false;
    if (request.startsAt() != null && !request.startsAt().equals(appointment.getStartsAt())) {
      validateSlot(request.startsAt());
      if (!bypassAvailability) {
        ensureSlotMatchesAvailability(appointment.getDoctorProfile(), request.startsAt());
      }
      ensureSlotAvailableForUpdate(appointment, request.startsAt());
      enforcePatientBookingLimits(appointment.getPatientProfile(), request.startsAt(), appointment.getId());
      appointment.setStartsAt(request.startsAt());
      changed = true;
    }

    String normalizedReason = normalizeNullableText(request.reason());
    String currentReason = normalizeNullableText(appointment.getReason());
    if (request.reason() != null && !java.util.Objects.equals(normalizedReason, currentReason)) {
      appointment.setReason(normalizedReason);
      appointment.setPatientNote(normalizedReason);
      changed = true;
    }

    String normalizedDoctorNote = normalizeNullableText(request.doctorNote());
    String currentDoctorNote = normalizeNullableText(appointment.getDoctorNote());
    if (request.doctorNote() != null && !java.util.Objects.equals(normalizedDoctorNote, currentDoctorNote)) {
      appointment.setDoctorNote(normalizedDoctorNote);
      changed = true;
    }

    return changed;
  }

  private void ensureSlotMatchesAvailability(DoctorProfile doctorProfile, LocalDateTime startsAt) {
    List<DoctorAvailability> availabilities = availabilityRepository.findAllByDoctorProfileAndActiveTrue(doctorProfile);
    if (availabilities.isEmpty()) {
      throw new IllegalArgumentException("Ce medecin n'a pas encore ouvert de disponibilites.");
    }
    LocalDate targetDate = startsAt.toLocalDate();
    LocalTime targetTime = startsAt.toLocalTime();

    boolean matches = false;
    for (DoctorAvailability availability : availabilities) {
      if (!matchesAvailabilityDate(availability, targetDate)) {
        continue;
      }
      int slotDuration = availability.getSlotDurationMinutes() != null && availability.getSlotDurationMinutes() >= 15
          ? availability.getSlotDurationMinutes()
          : SLOT_MINUTES;
      int buffer = availability.getBufferMinutes() != null && availability.getBufferMinutes() >= 0
          ? availability.getBufferMinutes()
          : 10;
      int step = slotDuration + buffer;

      LocalTime cur = availability.getStartTime();
      while (!cur.plusMinutes(slotDuration).isAfter(availability.getEndTime())) {
        if (cur.equals(targetTime)) {
          matches = true;
          break;
        }
        cur = cur.plusMinutes(step);
      }
      if (matches) break;
    }

    if (!matches) {
      throw new IllegalArgumentException("Ce creneau ne fait pas partie des disponibilites ouvertes par le medecin.");
    }
  }

  private void enforcePatientBookingLimits(PatientProfile patientProfile, LocalDateTime startsAt) {
    enforcePatientBookingLimits(patientProfile, startsAt, null);
  }

  private void enforcePatientBookingLimits(PatientProfile patientProfile, LocalDateTime startsAt, UUID ignoredAppointmentId) {
    List<Appointment> scheduledAppointments = appointmentRepository.findAllByPatientProfileOrderByStartsAtDesc(patientProfile).stream()
        .filter(appointment -> ignoredAppointmentId == null || !ignoredAppointmentId.equals(appointment.getId()))
        .filter(appointment -> appointment.getStatus() != Appointment.Status.CANCELLED)
        .filter(appointment -> appointment.getStatus() != Appointment.Status.REFUSED)
        .toList();

    long monthlyCount = scheduledAppointments.stream()
        .filter(appointment -> appointment.getStartsAt().getYear() == startsAt.getYear())
        .filter(appointment -> appointment.getStartsAt().getMonth() == startsAt.getMonth())
        .count();
    if (monthlyCount >= MAX_APPOINTMENTS_PER_MONTH) {
      throw new IllegalArgumentException("Maximum 4 seances par mois. Le quota de ce mois est deja atteint.");
    }

    LocalDate weekStart = startsAt.toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    LocalDate weekEnd = weekStart.plusDays(6);
    long weeklyCount = scheduledAppointments.stream()
        .map(Appointment::getStartsAt)
        .map(LocalDateTime::toLocalDate)
        .filter(date -> !date.isBefore(weekStart) && !date.isAfter(weekEnd))
        .count();
    if (weeklyCount >= MAX_APPOINTMENTS_PER_WEEK) {
      throw new IllegalArgumentException("Maximum une seance par semaine. Cette semaine contient deja un rendez-vous.");
    }
  }

  private void ensureSlotAvailableForUpdate(Appointment appointment, LocalDateTime startsAt) {
    boolean occupied = appointmentRepository.findAllByDoctorProfileAndStartsAtBetweenAndStatusInOrderByStartsAtAsc(
            appointment.getDoctorProfile(),
            startsAt,
            startsAt,
            EnumSet.of(Appointment.Status.REQUESTED, Appointment.Status.CONFIRMED)
        ).stream()
        .anyMatch(existing -> !existing.getId().equals(appointment.getId()));
    if (occupied) {
      throw new IllegalArgumentException("Ce creneau est deja reserve.");
    }
  }

  private String normalizeNullableText(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private List<AvailableAppointmentSlotResponse> buildAvailableSlots(DoctorProfile doctorProfile, int daysAhead) {
    List<DoctorAvailability> availabilities = availabilityRepository.findAllByDoctorProfileAndActiveTrue(doctorProfile);
    if (availabilities.isEmpty()) {
      return List.of();
    }

    LocalDateTime now = LocalDateTime.now();
    LocalDateTime windowEnd = now.plusDays(daysAhead).withHour(23).withMinute(59).withSecond(0).withNano(0);
    Set<LocalDateTime> occupiedStarts = appointmentRepository
        .findAllByDoctorProfileAndStartsAtBetweenAndStatusInOrderByStartsAtAsc(
            doctorProfile,
            now.minusMinutes(1),
            windowEnd,
            EnumSet.of(Appointment.Status.REQUESTED, Appointment.Status.CONFIRMED)
        )
        .stream()
        .map(Appointment::getStartsAt)
        .collect(Collectors.toSet());

    List<AvailableAppointmentSlotResponse> slots = new ArrayList<>();
    LocalDate startDate = now.toLocalDate();
    LocalDate endDate = startDate.plusDays(daysAhead);

    for (DoctorAvailability availability : availabilities) {
      int slotDuration = availability.getSlotDurationMinutes() != null && availability.getSlotDurationMinutes() >= 15
          ? availability.getSlotDurationMinutes()
          : SLOT_MINUTES;
      int buffer = availability.getBufferMinutes() != null && availability.getBufferMinutes() >= 0
          ? availability.getBufferMinutes()
          : 10;
      int step = slotDuration + buffer;

      List<LocalDate> targetDates = availability.getAvailableDate() != null
          ? List.of(availability.getAvailableDate())
          : enumerateMatchingDates(startDate, endDate, availability.getDayOfWeek());
      for (LocalDate date : targetDates) {
        if (date.isBefore(startDate) || date.isAfter(endDate)) {
          continue;
        }
        LocalDateTime slot = LocalDateTime.of(date, availability.getStartTime());
        LocalDateTime windowClose = LocalDateTime.of(date, availability.getEndTime());
        while (!slot.plusMinutes(slotDuration).isAfter(windowClose)) {
          if (!slot.isBefore(now) && !occupiedStarts.contains(slot)) {
            slots.add(new AvailableAppointmentSlotResponse(
                doctorProfile.getId(),
                doctorProfile.getUser().getFullName(),
                slot,
                slot.plusMinutes(slotDuration)
            ));
          }
          slot = slot.plusMinutes(step);
        }
      }
    }

    return slots.stream()
        .sorted(java.util.Comparator.comparing(AvailableAppointmentSlotResponse::startsAt))
        .toList();
  }

  private boolean matchesAvailabilityDate(DoctorAvailability availability, LocalDate targetDate) {
    if (availability.getAvailableDate() != null) {
      return Objects.equals(availability.getAvailableDate(), targetDate);
    }
    return availability.getDayOfWeek() == targetDate.getDayOfWeek();
  }

  private List<LocalDate> enumerateMatchingDates(LocalDate startDate, LocalDate endDate, DayOfWeek dayOfWeek) {
    if (dayOfWeek == null) {
      return List.of();
    }
    List<LocalDate> dates = new ArrayList<>();
    LocalDate cursor = startDate.with(TemporalAdjusters.nextOrSame(dayOfWeek));
    while (!cursor.isAfter(endDate)) {
      dates.add(cursor);
      cursor = cursor.plusWeeks(1);
    }
    return dates;
  }

  void ensureMeetingDetails(Appointment appointment) {
    if (appointment == null) {
      return;
    }
    appointment.setMeetingProvider(MEETING_PROVIDER);
    if (appointment.getMeetingRoomName() == null || appointment.getMeetingRoomName().isBlank()) {
      appointment.setMeetingRoomName(buildMeetingRoomName(appointment));
    }
    appointment.setMeetingJoinUrl(JITSI_BASE_URL + appointment.getMeetingRoomName());
  }

  private String buildMeetingRoomName(Appointment appointment) {
    String doctorChunk = appointment.getDoctorProfile() != null && appointment.getDoctorProfile().getId() != null
        ? appointment.getDoctorProfile().getId().toString().substring(0, 8)
        : "doctor";
    String patientChunk = appointment.getPatientProfile() != null && appointment.getPatientProfile().getId() != null
        ? appointment.getPatientProfile().getId().toString().substring(0, 8)
        : "patient";
    String appointmentChunk = appointment.getId() != null
        ? appointment.getId().toString().substring(0, 8)
        : UUID.randomUUID().toString().substring(0, 8);
    String dateChunk = appointment.getStartsAt() != null
        ? appointment.getStartsAt().format(MEETING_DATE_FORMAT)
        : "slot";
    return ("NeuralConsult-" + dateChunk + "-" + doctorChunk + "-" + patientChunk + "-" + appointmentChunk)
        .replaceAll("[^A-Za-z0-9-]", "");
  }

  private String buildPatientStatusMessage(Appointment appointment) {
    return switch (appointment.getStatus()) {
      case CONFIRMED -> "Votre rendez-vous du " + formatDateTime(appointment.getStartsAt()) + " a ete confirme par le medecin. Le lien visio vous sera envoye par email environ 10 minutes avant la seance.";
      case REFUSED -> "Votre demande de rendez-vous du " + formatDateTime(appointment.getStartsAt()) + " a ete refusee.";
      case COMPLETED -> "La consultation du " + formatDateTime(appointment.getStartsAt()) + " est marquee comme terminee.";
      case CANCELLED -> "Le rendez-vous du " + formatDateTime(appointment.getStartsAt()) + " a ete annule.";
      default -> "Le rendez-vous du " + formatDateTime(appointment.getStartsAt()) + " a ete mis a jour.";
    };
  }

  private String formatDateTime(LocalDateTime value) {
    if (value == null) {
      return "date non renseignee";
    }
    return value.toLocalDate() + " a " + value.toLocalTime().withSecond(0).withNano(0);
  }

  private String doctorDisplayName(String fullName) {
    if (fullName == null || fullName.isBlank()) {
      return "le medecin";
    }
    String trimmed = fullName.trim();
    return trimmed.toLowerCase().startsWith("dr ") ? trimmed : "Dr " + trimmed;
  }
}
