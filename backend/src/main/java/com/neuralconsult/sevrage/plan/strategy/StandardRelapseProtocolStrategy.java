package com.neuralconsult.sevrage.plan.strategy;

import org.springframework.stereotype.Component;

@Component
public class StandardRelapseProtocolStrategy implements RelapseProtocolStrategy {

  @Override
  public String buildRelapseProtocol(PlanContext context) {
    StringBuilder builder = new StringBuilder();
    builder.append("Si une envie intense ou une reprise survient, appliquer le protocole 5 minutes: ")
        .append("respiration lente, hydratation, marche rapide, puis contacter un proche ou un soignant. ");
    builder.append("Revenir au plan sans culpabilité et noter le déclencheur.");

    if (context.hasSevereMoodSymptoms()) {
      builder.append(" Ajouter un contact psychologique dans les 24h.");
    }
    if (context.cagePositive() || context.cannabisFrequentUse()) {
      builder.append(" Surveiller les co-consommations et demander un accompagnement spécialisé.");
    }
    return builder.toString();
  }
}
