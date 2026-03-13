package com.neuralconsult.sevrage.plan.strategy;

import com.neuralconsult.sevrage.plan.SevragePlan;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ModerateDependenceStrategy implements PlanStrategy {

  private final RelapseProtocolStrategy relapseProtocolStrategy;

  public ModerateDependenceStrategy(RelapseProtocolStrategy relapseProtocolStrategy) {
    this.relapseProtocolStrategy = relapseProtocolStrategy;
  }

  @Override
  public int getOrder() {
    return 2;
  }

  @Override
  public boolean supports(PlanContext context) {
    int score = context.fagerstromScore();
    return score >= 4 && score <= 6;
  }

  @Override
  public PlanDraft build(PlanContext context) {
    LocalDate targetQuitDate = LocalDate.now().plusDays(10);
    String summary = "Dependance moderee: plan structure avec NRT adaptee et coaching.";
    String nrt = "Recommandation: patch ou gomme selon le profil et les envies.";
    String behavior = "Planifier les moments a risque et utiliser des substitutions d'activite.";
    String followUp = "Suivi toutes les 2 semaines pendant 6 semaines.";
    if (context.hasBorderlineMoodSymptoms()) {
      followUp += " Evaluer l'humeur a chaque suivi.";
    }

    List<String> steps = new ArrayList<>();
    steps.add("Definir les situations declencheuses principales.");
    steps.add("Mettre en place une routine de remplacement (boisson, marche, respiration).");
    steps.add("Evaluer l'efficacite de la NRT apres 1 semaine.");
    if (context.cagePositive()) {
      steps.add("Surveiller l'alcool pour limiter les envies.");
    }

    String relapseProtocol = relapseProtocolStrategy.buildRelapseProtocol(context);

    return new PlanDraft(
        SevragePlan.PlanIntensity.MODERATE,
        summary,
        nrt,
        behavior,
        followUp,
        relapseProtocol,
        steps,
        targetQuitDate
    );
  }
}
