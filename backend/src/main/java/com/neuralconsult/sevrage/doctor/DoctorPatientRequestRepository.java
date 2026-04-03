package com.neuralconsult.sevrage.doctor;

import com.neuralconsult.sevrage.patient.PatientProfile;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorPatientRequestRepository extends JpaRepository<DoctorPatientRequest, UUID> {
  List<DoctorPatientRequest> findAllByPatientProfileOrderByCreatedAtDesc(PatientProfile patientProfile);
  List<DoctorPatientRequest> findAllByDoctorProfileOrderByCreatedAtDesc(DoctorProfile doctorProfile);
  List<DoctorPatientRequest> findAllByDoctorProfileAndPatientProfileAndStatus(
      DoctorProfile doctorProfile,
      PatientProfile patientProfile,
      DoctorPatientRequest.RequestStatus status
  );
  Optional<DoctorPatientRequest> findFirstByPatientProfileAndStatusOrderByCreatedAtDesc(
      PatientProfile patientProfile,
      DoctorPatientRequest.RequestStatus status
  );
  Optional<DoctorPatientRequest> findFirstByPatientProfileAndDoctorProfileAndStatusOrderByCreatedAtDesc(
      PatientProfile patientProfile,
      DoctorProfile doctorProfile,
      DoctorPatientRequest.RequestStatus status
  );
}
