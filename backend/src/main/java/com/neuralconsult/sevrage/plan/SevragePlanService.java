package com.neuralconsult.sevrage.plan;

import com.neuralconsult.sevrage.onboarding.OnboardingAssessment;
import com.neuralconsult.sevrage.onboarding.OnboardingRepository;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.plan.strategy.PlanContext;
import com.neuralconsult.sevrage.plan.strategy.PlanDraft;
import com.neuralconsult.sevrage.plan.strategy.PlanStrategy;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SevragePlanService {

  private final PatientProfileService patientProfileService;
  private final OnboardingRepository onboardingRepository;
  private final SevragePlanRepository planRepository;
  private final List<PlanStrategy> strategies;

  public SevragePlanService(PatientProfileService patientProfileService,
                            OnboardingRepository onboardingRepository,
                            SevragePlanRepository planRepository,
                            List<PlanStrategy> strategies) {
    this.patientProfileService = patientProfileService;
    this.onboardingRepository = onboardingRepository;
    this.planRepository = planRepository;
    this.strategies = strategies;
  }

  @Transactional
  public SevragePlan generatePlan(User user) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    OnboardingAssessment assessment = onboardingRepository.findByPatientProfile(profile).orElse(null);

    PlanContext context = new PlanContext(profile, assessment);
    PlanStrategy strategy = strategies.stream()
        .sorted(Comparator.comparingInt(PlanStrategy::getOrder))
        .filter(item -> item.supports(context))
        .findFirst()
        .orElseThrow();

    PlanDraft draft = strategy.build(context);
    SevragePlan plan = planRepository.findByPatientProfile(profile).orElseGet(() -> {
      SevragePlan created = new SevragePlan();
      created.setPatientProfile(profile);
      return created;
    });

    plan.setIntensity(draft.intensity());
    plan.setSummary(draft.summary());
    plan.setNrtRecommendation(draft.nrtRecommendation());
    plan.setBehavioralRecommendations(draft.behavioralRecommendations());
    plan.setFollowUpPlan(draft.followUpPlan());
    plan.setRelapseProtocol(draft.relapseProtocol());
    plan.setStartDate(LocalDate.now());
    plan.setTargetQuitDate(draft.targetQuitDate());
    plan.setSteps(new ArrayList<>(draft.steps()));

    return planRepository.save(plan);
  }

  @Transactional
  public SevragePlan getCurrent(User user) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    return planRepository.findByPatientProfile(profile).orElse(null);
  }
}
