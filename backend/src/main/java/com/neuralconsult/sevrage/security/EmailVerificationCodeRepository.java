package com.neuralconsult.sevrage.security;

import com.neuralconsult.sevrage.user.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, UUID> {
  Optional<EmailVerificationCode> findFirstByUserAndCodeAndUsedAtIsNullOrderByCreatedAtDesc(User user, String code);

  List<EmailVerificationCode> findAllByUserAndUsedAtIsNull(User user);
}
