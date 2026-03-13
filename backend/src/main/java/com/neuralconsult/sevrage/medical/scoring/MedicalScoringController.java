package com.neuralconsult.sevrage.medical.scoring;

import com.neuralconsult.sevrage.medical.scoring.dto.FagerstromRequest;
import com.neuralconsult.sevrage.medical.scoring.dto.FagerstromResult;
import com.neuralconsult.sevrage.medical.scoring.dto.HadRequest;
import com.neuralconsult.sevrage.medical.scoring.dto.HadResult;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/medical/scoring")
public class MedicalScoringController {

  private final MedicalScoringService medicalScoringService;

  public MedicalScoringController(MedicalScoringService medicalScoringService) {
    this.medicalScoringService = medicalScoringService;
  }

  @PostMapping("/fagerstrom")
  public FagerstromResult scoreFagerstrom(@Valid @RequestBody FagerstromRequest request) {
    return medicalScoringService.scoreFagerstrom(request);
  }

  @PostMapping("/had")
  public HadResult scoreHad(@Valid @RequestBody HadRequest request) {
    return medicalScoringService.scoreHad(request);
  }
}
