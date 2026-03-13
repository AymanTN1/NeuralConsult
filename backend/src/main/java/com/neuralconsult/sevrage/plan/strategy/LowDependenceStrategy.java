package com.neuralconsult.sevrage.plan.strategy;

import com.neuralconsult.sevrage.plan.SevragePlan;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class LowDependenceStrategy implements PlanStrategy {

  private final RelapseProtocolStrategy relapseProtocolStrategy;

  public LowDependenceStrategy(RelapseProtocolStrategy relapseProtocolStrategy) {
    this.relapseProtocolStrategy = relapseProtocolStrategy;
  }

  @Override
  public int getOrder() {
    return 3;
  }

  @Override
  public boolean supports(PlanContext context) {
    return true;
  }

  @Override
  public PlanDraft build(PlanContext context) {
    LocalDate targetQuitDate = LocalDate.now().plusDays(7);
    String summary = "Dependance faible: plan leger avec soutien comportemental.";
    String nrt = "NRT optionnelle si les envies sont fortes.";
    String behavior = "Mettre l'accent sur la motivation, les routines saines et l'activite physique.";
    String followUp = "Suivi mensuel et auto-suivi hebdomadaire.";

    List<String> steps = new ArrayList<>();
    steps.add("Fixer une date d'arret dans 7 jours.");
    steps.add("Informer un proche pour obtenir du soutien.");
    steps.add("Noter chaque envie et la strategie utilisee.");

    String relapseProtocol = relapseProtocolStrategy.buildRelapseProtocol(context);

    return new PlanDraft(
        SevragePlan.PlanIntensity.BASIC,
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
