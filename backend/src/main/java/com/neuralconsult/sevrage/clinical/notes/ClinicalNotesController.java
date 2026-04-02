package com.neuralconsult.sevrage.clinical.notes;

import com.neuralconsult.sevrage.clinical.notes.dto.ClinicalNoteResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/clinical-notes")
public class ClinicalNotesController {

  private final ClinicalNotesService clinicalNotesService;
  private final UserRepository userRepository;

  public ClinicalNotesController(ClinicalNotesService clinicalNotesService, UserRepository userRepository) {
    this.clinicalNotesService = clinicalNotesService;
    this.userRepository = userRepository;
  }

  @GetMapping
  @PreAuthorize("hasAuthority('ROLE_PATIENT')")
  public ClinicalNoteResponse get(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    Optional<ClinicalNote> note = clinicalNotesService.get(user);
    return note.map(this::toResponse).orElse(null);
  }

  @PostMapping("/generate")
  @PreAuthorize("hasAuthority('ROLE_PATIENT')")
  public ClinicalNoteResponse generate(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    try {
      ClinicalNote note = clinicalNotesService.generateAndSave(user);
      return toResponse(note);
    } catch (ClinicalNotesGenerationException ex) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, String.join(" | ", ex.getIssues()), ex);
    }
  }

  private ClinicalNoteResponse toResponse(ClinicalNote note) {
    return new ClinicalNoteResponse(
        note.getMedicalSummary(),
        note.getComplementaryNote(),
        note.getValidationStatus() != null ? note.getValidationStatus().name() : null,
        note.getModelName(),
        note.getUpdatedAt()
    );
  }
}
