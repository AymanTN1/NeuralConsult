DO $$
DECLARE
  v_patient_id uuid;
  v_user_email text := 'tantaniayman0@gmail.com';
  v_report_date date;
  v_created_at timestamptz;
  v_cigs integer[] := ARRAY[22, 20, 18, 15, 12, 9, 7, 5];
  v_cravings integer[] := ARRAY[9, 8, 8, 7, 6, 5, 4, 3];
  v_mood integer[] := ARRAY[3, 4, 4, 5, 6, 7, 7, 8];
  v_stress integer[] := ARRAY[9, 8, 8, 7, 6, 5, 4, 3];
  v_had_a integer[] := ARRAY[13, 12, 11, 10, 9, 8, 7, 6];
  v_had_d integer[] := ARRAY[11, 10, 9, 8, 8, 7, 6, 5];
  v_fager integer[] := ARRAY[8, 7, 7, 6, 5, 4, 4, 3];
  i integer;
  a_remaining integer;
  d_remaining integer;
  q1 int; q3 int; q5 int; q7 int; q9 int; q11 int; q13 int;
  q2 int; q4 int; q6 int; q8 int; q10 int; q12 int; q14 int;
  ttfc text;
  difficult boolean;
  hardest text;
  cigs_bucket text;
  morning boolean;
  ill boolean;
  dep_level text;
BEGIN
  SELECT p.id
  INTO v_patient_id
  FROM patient_profile p
  JOIN app_user u ON u.id = p.user_id
  WHERE lower(u.email) = lower(v_user_email);

  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Patient not found for %', v_user_email;
  END IF;

  DELETE FROM daily_report
  WHERE patient_profile_id = v_patient_id
    AND created_by = 'demo-seed'
    AND report_date BETWEEN current_date - 7 AND current_date;

  DELETE FROM had_test
  WHERE patient_profile_id = v_patient_id
    AND created_by = 'demo-seed'
    AND created_at::date BETWEEN current_date - 7 AND current_date;

  DELETE FROM fagerstrom_test
  WHERE patient_profile_id = v_patient_id
    AND created_by = 'demo-seed'
    AND created_at::date BETWEEN current_date - 7 AND current_date;

  FOR i IN 1..8 LOOP
    v_report_date := current_date - (8 - i);
    v_created_at := date_trunc('day', now()) - ((8 - i) * interval '1 day') + interval '10 hours';

    INSERT INTO daily_report (
      id, patient_profile_id, report_date, cigarettes_smoked, cravings_intensity, mood_score, stress_score,
      used_nrt, relapse_event, notes, created_at, updated_at, created_by, updated_by, row_version, deleted_at, deleted_by
    ) VALUES (
      ('10000000-0000-0000-0000-00000000000' || i)::uuid,
      v_patient_id,
      v_report_date,
      v_cigs[i],
      v_cravings[i],
      v_mood[i],
      v_stress[i],
      CASE WHEN i >= 3 THEN TRUE ELSE FALSE END,
      FALSE,
      CASE
        WHEN i <= 2 THEN 'Debut de suivi avec forte tension et consommation encore elevee.'
        WHEN i <= 5 THEN 'Le patient commence a mieux gerer les cravings et la reduction devient visible.'
        ELSE 'Progression stable, baisse des cigarettes et meilleur controle du stress.'
      END,
      v_created_at,
      v_created_at,
      'demo-seed',
      'demo-seed',
      0,
      NULL,
      NULL
    );

    a_remaining := v_had_a[i];
    q1 := least(3, a_remaining); a_remaining := a_remaining - q1;
    q3 := least(3, a_remaining); a_remaining := a_remaining - q3;
    q5 := least(3, a_remaining); a_remaining := a_remaining - q5;
    q7 := least(3, a_remaining); a_remaining := a_remaining - q7;
    q9 := least(3, a_remaining); a_remaining := a_remaining - q9;
    q11 := least(3, a_remaining); a_remaining := a_remaining - q11;
    q13 := least(3, a_remaining);

    d_remaining := v_had_d[i];
    q2 := least(3, d_remaining); d_remaining := d_remaining - q2;
    q4 := least(3, d_remaining); d_remaining := d_remaining - q4;
    q6 := least(3, d_remaining); d_remaining := d_remaining - q6;
    q8 := least(3, d_remaining); d_remaining := d_remaining - q8;
    q10 := least(3, d_remaining); d_remaining := d_remaining - q10;
    q12 := least(3, d_remaining); d_remaining := d_remaining - q12;
    q14 := least(3, d_remaining);

    INSERT INTO had_test (
      id, patient_profile_id, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14,
      anxiety_score, depression_score, anxiety_interpretation, depression_interpretation,
      created_at, updated_at, created_by, updated_by, row_version, deleted_at, deleted_by
    ) VALUES (
      ('20000000-0000-0000-0000-00000000000' || i)::uuid,
      v_patient_id,
      q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14,
      v_had_a[i],
      v_had_d[i],
      CASE
        WHEN v_had_a[i] >= 11 THEN 'CERTAIN_SYMPTOMATOLOGY'
        WHEN v_had_a[i] >= 8 THEN 'BORDERLINE'
        ELSE 'NORMAL'
      END,
      CASE
        WHEN v_had_d[i] >= 11 THEN 'CERTAIN_SYMPTOMATOLOGY'
        WHEN v_had_d[i] >= 8 THEN 'BORDERLINE'
        ELSE 'NORMAL'
      END,
      v_created_at + interval '20 minutes',
      v_created_at + interval '20 minutes',
      'demo-seed',
      'demo-seed',
      0,
      NULL,
      NULL
    );

    CASE v_fager[i]
      WHEN 8 THEN
        ttfc := 'WITHIN_5_MIN'; difficult := TRUE; hardest := 'FIRST_IN_MORNING'; cigs_bucket := 'TWENTY_ONE_TO_THIRTY'; morning := TRUE; ill := FALSE; dep_level := 'HIGH';
      WHEN 7 THEN
        ttfc := 'WITHIN_5_MIN'; difficult := TRUE; hardest := 'ANY_OTHER'; cigs_bucket := 'TWENTY_ONE_TO_THIRTY'; morning := TRUE; ill := FALSE; dep_level := 'HIGH';
      WHEN 6 THEN
        ttfc := 'MIN_6_TO_30'; difficult := TRUE; hardest := 'FIRST_IN_MORNING'; cigs_bucket := 'ELEVEN_TO_TWENTY'; morning := TRUE; ill := TRUE; dep_level := 'MEDIUM';
      WHEN 5 THEN
        ttfc := 'MIN_6_TO_30'; difficult := TRUE; hardest := 'FIRST_IN_MORNING'; cigs_bucket := 'ELEVEN_TO_TWENTY'; morning := FALSE; ill := TRUE; dep_level := 'MEDIUM';
      WHEN 4 THEN
        ttfc := 'MIN_6_TO_30'; difficult := FALSE; hardest := 'FIRST_IN_MORNING'; cigs_bucket := 'ELEVEN_TO_TWENTY'; morning := FALSE; ill := TRUE; dep_level := 'LOW';
      ELSE
        ttfc := 'MIN_31_TO_60'; difficult := FALSE; hardest := 'ANY_OTHER'; cigs_bucket := 'TWENTY_ONE_TO_THIRTY'; morning := FALSE; ill := FALSE; dep_level := 'LOW';
    END CASE;

    INSERT INTO fagerstrom_test (
      id, patient_profile_id, time_to_first_cigarette, difficult_to_refrain, most_difficult_cigarette,
      cigarettes_per_day, smoke_more_in_morning, smoke_when_ill, total_score, dependence_level,
      created_at, updated_at, created_by, updated_by, row_version, deleted_at, deleted_by
    ) VALUES (
      ('30000000-0000-0000-0000-00000000000' || i)::uuid,
      v_patient_id,
      ttfc,
      difficult,
      hardest,
      cigs_bucket,
      morning,
      ill,
      v_fager[i],
      dep_level,
      v_created_at + interval '40 minutes',
      v_created_at + interval '40 minutes',
      'demo-seed',
      'demo-seed',
      0,
      NULL,
      NULL
    );
  END LOOP;

  UPDATE patient_profile
  SET cigarettes_per_day = 24,
      fagerstrom_score = 3,
      had_anxiety_score = 6,
      had_depression_score = 5,
      dependence_level = 'LOW',
      updated_at = now(),
      updated_by = 'demo-seed',
      row_version = row_version + 1
  WHERE id = v_patient_id;

  UPDATE onboarding_assessment
  SET weekly_tobacco_spend = 140,
      manufactured_cigarettes_per_day = 24,
      updated_at = now(),
      updated_by = 'demo-seed',
      row_version = row_version + 1
  WHERE patient_profile_id = v_patient_id;
END $$;
