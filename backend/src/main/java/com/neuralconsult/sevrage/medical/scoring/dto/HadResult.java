package com.neuralconsult.sevrage.medical.scoring.dto;

public record HadResult(
    int anxietyScore,
    Interpretation anxietyInterpretation,
    int depressionScore,
    Interpretation depressionInterpretation
) {
  public enum Interpretation {
    NORMAL,
    BORDERLINE,
    CERTAIN_SYMPTOMATOLOGY
  }
}
