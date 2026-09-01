package com.neuralconsult.sevrage.medical.scoring;

import com.neuralconsult.sevrage.medical.scoring.dto.FagerstromRequest;
import com.neuralconsult.sevrage.medical.scoring.dto.FagerstromResult;
import com.neuralconsult.sevrage.medical.scoring.dto.HadRequest;
import com.neuralconsult.sevrage.medical.scoring.dto.HadResult;
import org.springframework.stereotype.Service;

@Service
public class MedicalScoringService {

  public FagerstromResult scoreFagerstrom(FagerstromRequest request) {
    int total = request.timeToFirstCigarette().points()
        + (request.difficultToRefrain() ? 1 : 0)
        + request.mostDifficultCigarette().points()
        + request.cigarettesPerDay().points()
        + (request.smokeMoreInMorning() ? 1 : 0)
        + (request.smokeWhenIll() ? 1 : 0);

    FagerstromResult.DependenceLevel level;
    if (total >= 7) {
      level = FagerstromResult.DependenceLevel.HIGH;
    } else if (total >= 5) {
      level = FagerstromResult.DependenceLevel.MEDIUM;
    } else if (total >= 3) {
      level = FagerstromResult.DependenceLevel.LOW;
    } else {
      level = FagerstromResult.DependenceLevel.NONE;
    }

    return new FagerstromResult(total, level);
  }

  public HadResult scoreHad(HadRequest request) {
    // INPES 2007 HAD scale: Anxiety = 1,3,5,7,9,11,13; Depression = 2,4,6,8,10,12,14.
    int anxiety = request.q1() + request.q3() + request.q5() + request.q7() + request.q9() + request.q11() + request.q13();
    int depression = request.q2() + request.q4() + request.q6() + request.q8() + request.q10() + request.q12() + request.q14();

    HadResult.Interpretation anxietyInterpretation = interpretHad(anxiety);
    HadResult.Interpretation depressionInterpretation = interpretHad(depression);

    return new HadResult(anxiety, anxietyInterpretation, depression, depressionInterpretation);
  }

  private HadResult.Interpretation interpretHad(int score) {
    if (score >= 11) {
      return HadResult.Interpretation.CERTAIN_SYMPTOMATOLOGY;
    }
    if (score >= 8) {
      return HadResult.Interpretation.BORDERLINE;
    }
    return HadResult.Interpretation.NORMAL;
  }
}
