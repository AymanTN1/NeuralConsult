package com.neuralconsult.sevrage.doctor;

import com.neuralconsult.sevrage.community.CommunityConnection;
import com.neuralconsult.sevrage.community.CommunityConnectionRepository;
import com.neuralconsult.sevrage.notification.NotificationItem;
import com.neuralconsult.sevrage.notification.NotificationService;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DoctorPatientRequestService {

  private final DoctorPatientRequestRepository requestRepository;
  private final DoctorPatientAssignmentRepository assignmentRepository;
  private final DoctorProfileRepository doctorProfileRepository;
  private final PatientProfileService patientProfileService;
  private final CommunityConnectionRepository connectionRepository;
  private final NotificationService notificationService;

  public DoctorPatientRequestService(
      DoctorPatientRequestRepository requestRepository,
      DoctorPatientAssignmentRepository assignmentRepository,
      DoctorProfileRepository doctorProfileRepository,
      PatientProfileService patientProfileService,
      CommunityConnectionRepository connectionRepository,
      NotificationService notificationService
  ) {
    this.requestRepository = requestRepository;
    this.assignmentRepository = assignmentRepository;
    this.doctorProfileRepository = doctorProfileRepository;
    this.patientProfileService = patientProfileService;
    this.connectionRepository = connectionRepository;
    this.notificationService = notificationService;
  }

  @Transactional
  public DoctorPatientRequest create(User patientUser, DoctorProfile doctorProfile, String message, DoctorPatientRequest.MatchingMode mode, Integer score) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    DoctorPatientRequest existingPending = requestRepository
        .findFirstByPatientProfileAndDoctorProfileAndStatusOrderByCreatedAtDesc(
            patientProfile,
            doctorProfile,
            DoctorPatientRequest.RequestStatus.PENDING
        )
        .orElse(null);
    if (existingPending != null) {
      if (message != null && !message.isBlank()) {
        existingPending.setPatientMessage(message);
      }
      existingPending.setMatchingMode(mode);
      existingPending.setMatchingScore(score);
      return requestRepository.save(existingPending);
    }

    DoctorPatientRequest request = new DoctorPatientRequest();
    request.setPatientProfile(patientProfile);
    request.setDoctorProfile(doctorProfile);
    request.setPatientMessage(message);
    request.setMatchingMode(mode);
    request.setMatchingScore(score);
    request.setStatus(DoctorPatientRequest.RequestStatus.PENDING);
    DoctorPatientRequest saved = requestRepository.save(request);
    notificationService.notify(
        doctorProfile.getUser(),
        NotificationItem.Type.GENERAL,
        "Nouvelle demande patient",
        patientProfile.getUser().getFullName() + " souhaite rejoindre votre file active. Ouvrez le dossier pour lire le message et decider.",
        "/dashboard",
        "Ouvrir la gestion patients",
        "doctor-request:new:" + saved.getId()
    );
    notificationService.notify(
        patientUser,
        NotificationItem.Type.GENERAL,
        "Demande envoyee au medecin",
        "Votre demande a ete transmise a " + doctorDisplayName(doctorProfile.getUser().getFullName()) + ". Vous serez informe des qu'une decision sera prise.",
        "/doctors",
        "Voir le suivi",
        "doctor-request:patient:" + saved.getId()
    );
    return saved;
  }

  @Transactional
  public List<DoctorPatientRequest> listForPatient(User patientUser) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    return requestRepository.findAllByPatientProfileOrderByCreatedAtDesc(patientProfile);
  }

  @Transactional
  public List<DoctorPatientRequest> listForDoctor(User doctorUser) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    return requestRepository.findAllByDoctorProfileOrderByCreatedAtDesc(doctorProfile);
  }

  @Transactional
  public DoctorPatientRequest decide(User doctorUser, java.util.UUID requestId, DoctorPatientRequest.RequestStatus status, String note) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    DoctorPatientRequest request = requestRepository.findById(requestId).orElseThrow();
    if (!request.getDoctorProfile().getId().equals(doctorProfile.getId())) {
      throw new IllegalArgumentException("This request does not belong to the authenticated doctor.");
    }
    request.setStatus(status);
    request.setDoctorResponseNote(note);
    request.setAnsweredAt(Instant.now());
    DoctorPatientRequest saved = requestRepository.save(request);

    if (status == DoctorPatientRequest.RequestStatus.ACCEPTED) {
      DoctorPatientAssignment assignment = assignmentRepository.findByPatientProfile(request.getPatientProfile()).orElseGet(DoctorPatientAssignment::new);
      assignment.setPatientProfile(request.getPatientProfile());
      assignment.setDoctorProfile(doctorProfile);
      assignment.setSourceRequest(saved);
      assignment.setActive(true);
      assignment.setAssignedAt(Instant.now());
      assignmentRepository.save(assignment);
      ensureDoctorPatientConnection(request.getPatientProfile().getUser(), doctorProfile.getUser());

      requestRepository.findAllByDoctorProfileAndPatientProfileAndStatus(
              doctorProfile,
              request.getPatientProfile(),
              DoctorPatientRequest.RequestStatus.PENDING
          ).stream()
          .filter(candidate -> !candidate.getId().equals(saved.getId()))
          .forEach(candidate -> {
            candidate.setStatus(DoctorPatientRequest.RequestStatus.CANCELLED);
            candidate.setDoctorResponseNote("Une autre demande pour ce patient a deja ete traitee.");
            candidate.setAnsweredAt(Instant.now());
            requestRepository.save(candidate);
          });
    }

    notificationService.notify(
        request.getPatientProfile().getUser(),
        NotificationItem.Type.GENERAL,
        status == DoctorPatientRequest.RequestStatus.ACCEPTED ? "Demande acceptee" : "Demande refusee",
        status == DoctorPatientRequest.RequestStatus.ACCEPTED
            ? doctorDisplayName(doctorProfile.getUser().getFullName()) + " a accepte votre demande. Vous pouvez maintenant planifier vos rendez-vous avec ce medecin."
            : doctorDisplayName(doctorProfile.getUser().getFullName()) + " n'a pas retenu votre demande pour le moment. Vous pouvez solliciter un autre medecin.",
        status == DoctorPatientRequest.RequestStatus.ACCEPTED ? "/appointments" : "/doctors",
        status == DoctorPatientRequest.RequestStatus.ACCEPTED ? "Ouvrir les rendez-vous" : "Retourner a l'annuaire",
        "doctor-request:decision:" + saved.getId() + ":" + status.name()
    );
    return saved;
  }

  @Transactional
  public List<DoctorPatientAssignment> listAssignments(User doctorUser) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    return assignmentRepository.findAllByDoctorProfileAndActiveTrue(doctorProfile);
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

  private String doctorDisplayName(String fullName) {
    if (fullName == null || fullName.isBlank()) {
      return "le medecin";
    }
    String trimmed = fullName.trim();
    return trimmed.toLowerCase().startsWith("dr ") ? trimmed : "Dr " + trimmed;
  }
}
