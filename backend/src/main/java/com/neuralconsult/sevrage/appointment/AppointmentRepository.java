package com.neuralconsult.sevrage.appointment;

import com.neuralconsult.sevrage.doctor.DoctorProfile;
import com.neuralconsult.sevrage.patient.PatientProfile;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
  @EntityGraph(attributePaths = {"patientProfile", "patientProfile.user", "doctorProfile", "doctorProfile.user"})
  List<Appointment> findAllByPatientProfileOrderByStartsAtDesc(PatientProfile patientProfile);

  @EntityGraph(attributePaths = {"patientProfile", "patientProfile.user", "doctorProfile", "doctorProfile.user"})
  List<Appointment> findAllByDoctorProfileOrderByStartsAtDesc(DoctorProfile doctorProfile);

  @EntityGraph(attributePaths = {"patientProfile", "patientProfile.user", "doctorProfile", "doctorProfile.user"})
  Optional<Appointment> findByIdAndDoctorProfile(UUID id, DoctorProfile doctorProfile);

  @EntityGraph(attributePaths = {"patientProfile", "patientProfile.user", "doctorProfile", "doctorProfile.user"})
  Optional<Appointment> findByIdAndPatientProfile(UUID id, PatientProfile patientProfile);

  boolean existsByDoctorProfileAndStartsAtAndStatusIn(
      DoctorProfile doctorProfile,
      LocalDateTime startsAt,
      Collection<Appointment.Status> statuses
  );

  List<Appointment> findAllByDoctorProfileAndStartsAtBetweenAndStatusInOrderByStartsAtAsc(
      DoctorProfile doctorProfile,
      LocalDateTime startsAt,
      LocalDateTime endsAt,
      Collection<Appointment.Status> statuses
  );

  @EntityGraph(attributePaths = {"patientProfile", "patientProfile.user", "doctorProfile", "doctorProfile.user"})
  List<Appointment> findAllByStatusInAndStartsAtBetweenOrderByStartsAtAsc(
      Collection<Appointment.Status> statuses,
      LocalDateTime startsAt,
      LocalDateTime endsAt
  );

  @EntityGraph(attributePaths = {"patientProfile", "patientProfile.user", "doctorProfile", "doctorProfile.user"})
  List<Appointment> findAllByStatusAndConversationOpenedAtIsNullAndStartsAtBetweenOrderByStartsAtAsc(
      Appointment.Status status,
      LocalDateTime startsAt,
      LocalDateTime endsAt
  );

  @EntityGraph(attributePaths = {"patientProfile", "patientProfile.user", "doctorProfile", "doctorProfile.user"})
  List<Appointment> findAllByStatusAndMeetingLinkSentAtIsNullAndStartsAtBetweenOrderByStartsAtAsc(
      Appointment.Status status,
      LocalDateTime startsAt,
      LocalDateTime endsAt
  );

  @EntityGraph(attributePaths = {"patientProfile", "patientProfile.user", "doctorProfile", "doctorProfile.user"})
  List<Appointment> findAllByStatusAndMeetingOpenedAtIsNullAndStartsAtBetweenOrderByStartsAtAsc(
      Appointment.Status status,
      LocalDateTime startsAt,
      LocalDateTime endsAt
  );
}
