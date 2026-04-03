package com.neuralconsult.sevrage.clinical.intelligence;

import com.neuralconsult.sevrage.clinical.intelligence.dto.QuestionAssistantAiResponse;
import com.neuralconsult.sevrage.clinical.intelligence.dto.QuestionAssistantRequest;
import com.neuralconsult.sevrage.clinical.intelligence.dto.QuestionAssistantResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai-assistant")
public class QuestionAssistantController {

  private final QuestionAssistantService questionAssistantService;
  private final UserRepository userRepository;

  public QuestionAssistantController(QuestionAssistantService questionAssistantService,
                                     UserRepository userRepository) {
    this.questionAssistantService = questionAssistantService;
    this.userRepository = userRepository;
  }

  @PostMapping("/assist")
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  public QuestionAssistantResponse assist(@AuthenticationPrincipal UserDetails principal,
                                          @RequestBody QuestionAssistantRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    QuestionAssistantAiResponse ai = questionAssistantService.assist(user, request);
    return new QuestionAssistantResponse(
        ai.explanation(),
        ai.clarifyingQuestions(),
        ai.suggestedChoiceValue(),
        ai.suggestedChoiceLabel(),
        ai.suggestionReason(),
        ai.needsPatientConfirmation(),
        ai.safetyNote(),
        ai.engine(),
        ai.engineWarning(),
        ai.references()
    );
  }
}
