package com.neuralconsult.sevrage.security;

public class EmailVerificationRequiredException extends RuntimeException {

  private final String email;

  public EmailVerificationRequiredException(String email) {
    super("Verification d'email requise avant de continuer.");
    this.email = email;
  }

  public String getEmail() {
    return email;
  }
}
