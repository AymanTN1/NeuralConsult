package com.neuralconsult.sevrage.patient;

import com.neuralconsult.sevrage.user.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientProfileRepository extends JpaRepository<PatientProfile, UUID> {
  Optional<PatientProfile> findByUser(User user);
}
