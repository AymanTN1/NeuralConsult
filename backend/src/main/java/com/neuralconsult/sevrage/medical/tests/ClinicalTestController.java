package com.neuralconsult.sevrage.medical.tests;

import com.neuralconsult.sevrage.medical.scoring.dto.FagerstromRequest;
import com.neuralconsult.sevrage.medical.scoring.dto.HadRequest;
import com.neuralconsult.sevrage.medical.tests.dto.FagerstromTestResponse;
import com.neuralconsult.sevrage.medical.tests.dto.HadTestResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tests")
public class ClinicalTestController {

  private final ClinicalTestService clinicalTestService;
  private final UserRepository userRepository;

  public ClinicalTestController(ClinicalTestService clinicalTestService, UserRepository userRepository) {
    this.clinicalTestService = clinicalTestService;
    this.userRepository = userRepository;
  }

  @PostMapping("/fagerstrom")
  public FagerstromTestResponse createFagerstrom(@AuthenticationPrincipal UserDetails principal,
                                                 @Valid @RequestBody FagerstromRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    FagerstromTest test = clinicalTestService.createFagerstrom(user, request);
    return toResponse(test);
  }

  @PutMapping("/fagerstrom/{id}")
  public FagerstromTestResponse updateFagerstrom(@AuthenticationPrincipal UserDetails principal,
                                                 @PathVariable UUID id,
                                                 @Valid @RequestBody FagerstromRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    FagerstromTest test = clinicalTestService.updateFagerstrom(user, id, request);
    return toResponse(test);
  }

  @DeleteMapping("/fagerstrom/{id}")
  public void deleteFagerstrom(@AuthenticationPrincipal UserDetails principal,
                               @PathVariable UUID id) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    clinicalTestService.deleteFagerstrom(user, id);
  }

  @GetMapping("/fagerstrom")
  public List<FagerstromTestResponse> listFagerstrom(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return clinicalTestService.listFagerstrom(user)
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @PostMapping("/had")
  public HadTestResponse createHad(@AuthenticationPrincipal UserDetails principal,
                                   @Valid @RequestBody HadRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    HadTest test = clinicalTestService.createHad(user, request);
    return toResponse(test);
  }

  @PutMapping("/had/{id}")
  public HadTestResponse updateHad(@AuthenticationPrincipal UserDetails principal,
                                   @PathVariable UUID id,
                                   @Valid @RequestBody HadRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    HadTest test = clinicalTestService.updateHad(user, id, request);
    return toResponse(test);
  }

  @DeleteMapping("/had/{id}")
  public void deleteHad(@AuthenticationPrincipal UserDetails principal,
                        @PathVariable UUID id) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    clinicalTestService.deleteHad(user, id);
  }

  @GetMapping("/had")
  public List<HadTestResponse> listHad(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return clinicalTestService.listHad(user)
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  private FagerstromTestResponse toResponse(FagerstromTest test) {
    return new FagerstromTestResponse(
        test.getId(),
        test.getCreatedAt(),
        test.getTimeToFirstCigarette(),
        test.isDifficultToRefrain(),
        test.getMostDifficultCigarette(),
        test.getCigarettesPerDay(),
        test.isSmokeMoreInMorning(),
        test.isSmokeWhenIll(),
        test.getTotalScore(),
        test.getDependenceLevel().name()
    );
  }

  private HadTestResponse toResponse(HadTest test) {
    return new HadTestResponse(
        test.getId(),
        test.getCreatedAt(),
        test.getQ1(),
        test.getQ2(),
        test.getQ3(),
        test.getQ4(),
        test.getQ5(),
        test.getQ6(),
        test.getQ7(),
        test.getQ8(),
        test.getQ9(),
        test.getQ10(),
        test.getQ11(),
        test.getQ12(),
        test.getQ13(),
        test.getQ14(),
        test.getAnxietyScore(),
        test.getAnxietyInterpretation().name(),
        test.getDepressionScore(),
        test.getDepressionInterpretation().name()
    );
  }
}
