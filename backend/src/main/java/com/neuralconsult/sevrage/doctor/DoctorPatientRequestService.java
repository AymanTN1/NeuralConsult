package com.neuralconsult.sevrage.doctor;

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

  public DoctorPatientRequestService(
      DoctorPatientRequestRepository requestRepository,
      DoctorPatientAssignmentRepository assignmentRepository,
      DoctorProfileRepository doctorProfileRepository,
      PatientProfileService patientProfileService
  ) {
    this.requestRepository = requestRepository;
    this.assignmentRepository = assignmentRepository;
    this.doctorProfileRepository = doctorProfileRepository;
    this.patientProfileService = patientProfileService;
  }

  @Transactional
  public DoctorPatientRequest create(User patientUser, DoctorProfile doctorProfile, String message, DoctorPatientRequest.MatchingMode mode, Integer score) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    DoctorPatientRequest request = new DoctorPatientRequest();
    request.setPatientProfile(patientProfile);
    request.setDoctorProfile(doctorProfile);
    request.setPatientMessage(message);
    request.setMatchingMode(mode);
    request.setMatchingScore(score);
    request.setStatus(DoctorPatientRequest.RequestStatus.PENDING);
    return requestRepository.save(request);
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
    }
    return saved;
  }

  @Transactional
  public List<DoctorPatientAssignment> listAssignments(User doctorUser) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    return assignmentRepository.findAllByDoctorProfileAndActiveTrue(doctorProfile);
  }
}
