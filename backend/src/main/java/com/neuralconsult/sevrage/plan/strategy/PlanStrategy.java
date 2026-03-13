package com.neuralconsult.sevrage.plan.strategy;

public interface PlanStrategy {
  int getOrder();

  boolean supports(PlanContext context);

  PlanDraft build(PlanContext context);
}
