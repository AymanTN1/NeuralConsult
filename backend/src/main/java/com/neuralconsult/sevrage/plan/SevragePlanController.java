package com.neuralconsult.sevrage.plan;

import com.neuralconsult.sevrage.plan.dto.SevragePlanResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import java.util.ArrayList;
import java.util.Collections;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sevrage-plan")
public class SevragePlanController {

  private final SevragePlanService sevragePlanService;
  private final UserRepository userRepository;

  public SevragePlanController(SevragePlanService sevragePlanService, UserRepository userRepository) {
    this.sevragePlanService = sevragePlanService;
    this.userRepository = userRepository;
  }

  @PostMapping("/generate")
  public SevragePlanResponse generate(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername())
        .orElseThrow();
    SevragePlan plan = sevragePlanService.generatePlan(user);
    return toResponse(plan);
  }

  @GetMapping("/current")
  public SevragePlanResponse current(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername())
        .orElseThrow();
    SevragePlan plan = sevragePlanService.getCurrent(user);
    return plan != null ? toResponse(plan) : null;
  }

  private SevragePlanResponse toResponse(SevragePlan plan) {
    return new SevragePlanResponse(
        plan.getIntensity() != null ? plan.getIntensity().name() : null,
        plan.getSummary(),
        plan.getNrtRecommendation(),
        plan.getBehavioralRecommendations(),
        plan.getFollowUpPlan(),
        plan.getRelapseProtocol(),
        plan.getStartDate(),
        plan.getTargetQuitDate(),
        plan.getSteps() != null ? new ArrayList<>(plan.getSteps()) : Collections.emptyList()
    );
  }
}
