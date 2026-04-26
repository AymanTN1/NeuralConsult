package com.neuralconsult.sevrage.appointment;

import com.neuralconsult.sevrage.doctor.DoctorProfile;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, UUID> {
  List<DoctorAvailability> findAllByDoctorProfile(DoctorProfile doctorProfile);

  List<DoctorAvailability> findAllByDoctorProfileAndActiveTrue(DoctorProfile doctorProfile);

  Optional<DoctorAvailability> findByIdAndDoctorProfile(UUID id, DoctorProfile doctorProfile);
}
