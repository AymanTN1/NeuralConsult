package com.neuralconsult.sevrage.common.auditing;

import java.util.Optional;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component("auditorAware")
public class SecurityAuditorAware implements AuditorAware<String> {

  @Override
  public Optional<String> getCurrentAuditor() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      return Optional.of("system");
    }

    Object principal = authentication.getPrincipal();
    if (principal instanceof UserDetails userDetails) {
      return Optional.ofNullable(userDetails.getUsername());
    }
    if (principal instanceof String username) {
      return Optional.of(username);
    }

    return Optional.of("system");
  }
}
