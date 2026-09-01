package com.neuralconsult.sevrage.medical.scoring.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record HadRequest(
    @Min(0) @Max(3) int q1,
    @Min(0) @Max(3) int q2,
    @Min(0) @Max(3) int q3,
    @Min(0) @Max(3) int q4,
    @Min(0) @Max(3) int q5,
    @Min(0) @Max(3) int q6,
    @Min(0) @Max(3) int q7,
    @Min(0) @Max(3) int q8,
    @Min(0) @Max(3) int q9,
    @Min(0) @Max(3) int q10,
    @Min(0) @Max(3) int q11,
    @Min(0) @Max(3) int q12,
    @Min(0) @Max(3) int q13,
    @Min(0) @Max(3) int q14
) {
}
