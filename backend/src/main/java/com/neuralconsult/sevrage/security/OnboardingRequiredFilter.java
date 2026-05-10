package com.neuralconsult.sevrage.security;

import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class OnboardingRequiredFilter extends OncePerRequestFilter {

  private final UserRepository userRepository;
  private final PatientProfileService patientProfileService;

  public OnboardingRequiredFilter(UserRepository userRepository, PatientProfileService patientProfileService) {
    this.userRepository = userRepository;
    this.patientProfileService = patientProfileService;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && authentication.isAuthenticated()
        && !(authentication instanceof AnonymousAuthenticationToken)) {
      String email = authentication.getName();
      User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
      if (user != null && isPatient(user)) {
        PatientProfile profile = patientProfileService.getOrCreate(user);
        if (!profile.isOnboardingComplete()) {
          writePrecondition(response, "ONBOARDING_REQUIRED");
          return;
        }
        if (!profile.isTestsComplete()) {
          writePrecondition(response, "TESTS_REQUIRED");
          return;
        }
        if (!profile.isJournalComplete()) {
          writePrecondition(response, "JOURNAL_REQUIRED");
          return;
        }
      }
    }

    filterChain.doFilter(request, response);
  }

  private boolean isPatient(User user) {
    // Doctors and admins must never be forced through patient onboarding
    if (user.getRoles().contains("ROLE_DOCTOR") || user.getRoles().contains("ROLE_ADMIN")) {
      return false;
    }
    return user.getRoles().isEmpty()
        || user.getRoles().contains("ROLE_PATIENT")
        || user.getRoles().contains("ROLE_USER");
  }

  private void writePrecondition(HttpServletResponse response, String code) throws IOException {
    response.setStatus(428);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.getWriter().write("{\"error\":\"" + code + "\"}");
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
      return true;
    }
    return path.startsWith("/api/auth")
        || path.startsWith("/api/onboarding")
        || path.startsWith("/api/ai-assistant")
        || path.startsWith("/api/tests")
        || path.startsWith("/api/daily-reports")
        || path.startsWith("/api/me")
        || path.startsWith("/actuator");
  }
}
