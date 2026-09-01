package com.neuralconsult.sevrage.medical.scoring.dto;

import jakarta.validation.constraints.NotNull;

public record FagerstromRequest(
    @NotNull TimeToFirstCigarette timeToFirstCigarette,
    boolean difficultToRefrain,
    @NotNull MostDifficultCigarette mostDifficultCigarette,
    @NotNull CigarettesPerDay cigarettesPerDay,
    boolean smokeMoreInMorning,
    boolean smokeWhenIll
) {
  public enum TimeToFirstCigarette {
    WITHIN_5_MIN(3),
    MIN_6_TO_30(2),
    MIN_31_TO_60(1),
    AFTER_60(0);

    private final int points;

    TimeToFirstCigarette(int points) {
      this.points = points;
    }

    public int points() {
      return points;
    }
  }

  public enum MostDifficultCigarette {
    FIRST_IN_MORNING(1),
    ANY_OTHER(0);

    private final int points;

    MostDifficultCigarette(int points) {
      this.points = points;
    }

    public int points() {
      return points;
    }
  }

  public enum CigarettesPerDay {
    TEN_OR_LESS(0),
    ELEVEN_TO_TWENTY(1),
    TWENTY_ONE_TO_THIRTY(2),
    THIRTY_ONE_OR_MORE(3);

    private final int points;

    CigarettesPerDay(int points) {
      this.points = points;
    }

    public int points() {
      return points;
    }
  }
}
