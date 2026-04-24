package com.neuralconsult.sevrage.common.web;

import com.neuralconsult.sevrage.security.EmailVerificationRequiredException;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException exception) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
        "timestamp", Instant.now().toString(),
        "error", "BAD_REQUEST",
        "message", exception.getMessage()
    ));
  }

  @ExceptionHandler(EmailVerificationRequiredException.class)
  public ResponseEntity<Map<String, Object>> handleEmailVerificationRequired(EmailVerificationRequiredException exception) {
    return ResponseEntity.status(HttpStatus.PRECONDITION_REQUIRED).body(Map.of(
        "timestamp", Instant.now().toString(),
        "error", "EMAIL_VERIFICATION_REQUIRED",
        "message", exception.getMessage(),
        "email", exception.getEmail()
    ));
  }
}
