package com.neuralconsult.sevrage.plan.strategy;

import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.plan.SevragePlan;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class HighDependenceStrategy implements PlanStrategy {

  private final RelapseProtocolStrategy relapseProtocolStrategy;

  public HighDependenceStrategy(RelapseProtocolStrategy relapseProtocolStrategy) {
    this.relapseProtocolStrategy = relapseProtocolStrategy;
  }

  @Override
  public int getOrder() {
    return 1;
  }

  @Override
  public boolean supports(PlanContext context) {
    PatientProfile.DependenceLevel level = context.profile().getDependenceLevel();
    return context.fagerstromScore() >= 7
        || level == PatientProfile.DependenceLevel.HIGH
        || level == PatientProfile.DependenceLevel.VERY_HIGH;
  }

  @Override
  public PlanDraft build(PlanContext context) {
    LocalDate targetQuitDate = LocalDate.now().plusDays(14);
    String summary = "Dependance elevee: plan intensif avec soutien clinique et NRT combinee.";
    String nrt = "Recommandation: patch nicotine + forme rapide (gomme ou spray) selon les envies.";
    String behavior = "Structurer les routines, identifier les declencheurs, et utiliser des techniques d'apaisement.";
    String followUp = "Suivi hebdomadaire les 4 premieres semaines, puis toutes les 2 semaines.";
    if (context.hasSevereMoodSymptoms()) {
      followUp += " Ajouter un suivi psychologique rapproche.";
      behavior += " Inclure des exercices de gestion de l'anxiete.";
    }

    List<String> steps = new ArrayList<>();
    steps.add("Fixer une date d'arret dans 2 semaines.");
    steps.add("Mettre en place la NRT 24h avant la date cible.");
    steps.add("Planifier un contact de soutien chaque semaine.");
    if (context.cagePositive()) {
      steps.add("Evaluer la consommation d'alcool et proposer un avis specialise.");
    }
    if (context.cannabisFrequentUse()) {
      steps.add("Travailler sur la reduction du cannabis pour limiter les rechutes.");
    }

    String relapseProtocol = relapseProtocolStrategy.buildRelapseProtocol(context);

    return new PlanDraft(
        SevragePlan.PlanIntensity.INTENSIVE,
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
