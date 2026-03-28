package com.neuralconsult.sevrage.clinical.notes;

import java.util.List;

public class ClinicalNotesGenerationException extends RuntimeException {

  private final List<String> issues;

  public ClinicalNotesGenerationException(String message, List<String> issues) {
    super(message);
    this.issues = issues;
  }

  public List<String> getIssues() {
    return issues;
  }
}

