package com.neuralconsult.sevrage.medical.scoring.dto;

public record FagerstromResult(
    int totalScore,
    DependenceLevel dependenceLevel
) {
  public enum DependenceLevel {
    NONE,
    LOW,
    MEDIUM,
    HIGH
  }
}
