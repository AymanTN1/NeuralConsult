package com.neuralconsult.sevrage.admin;

import com.neuralconsult.sevrage.appointment.Appointment;
import com.neuralconsult.sevrage.appointment.AppointmentRepository;
import com.neuralconsult.sevrage.clinical.intelligence.*;
import com.neuralconsult.sevrage.doctor.DoctorPatientAssignment;
import com.neuralconsult.sevrage.doctor.DoctorPatientAssignmentRepository;
import com.neuralconsult.sevrage.doctor.DoctorProfile;
import com.neuralconsult.sevrage.doctor.DoctorProfileRepository;
import com.neuralconsult.sevrage.medical.ConsultationReport;
import com.neuralconsult.sevrage.medical.ConsultationReportRepository;
import com.neuralconsult.sevrage.medical.scoring.dto.FagerstromRequest;
import com.neuralconsult.sevrage.medical.scoring.dto.FagerstromResult;
import com.neuralconsult.sevrage.medical.scoring.dto.HadResult;
import com.neuralconsult.sevrage.medical.tests.FagerstromTest;
import com.neuralconsult.sevrage.medical.tests.FagerstromTestRepository;
import com.neuralconsult.sevrage.medical.tests.HadTest;
import com.neuralconsult.sevrage.medical.tests.HadTestRepository;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileRepository;
import com.neuralconsult.sevrage.plan.SevragePlan;
import com.neuralconsult.sevrage.plan.SevragePlanRepository;
import com.neuralconsult.sevrage.report.DailyReport;
import com.neuralconsult.sevrage.report.DailyReportRepository;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Random;
import java.util.UUID;

@Component
@Order(2)
public class DemoAccountSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoAccountSeeder.class);

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorPatientAssignmentRepository assignmentRepository;
    private final FagerstromTestRepository fagerstromTestRepository;
    private final HadTestRepository hadTestRepository;
    private final DailyReportRepository dailyReportRepository;
    private final SevragePlanRepository sevragePlanRepository;
    private final ConsultationReportRepository consultationReportRepository;
    private final AppointmentRepository appointmentRepository;
    private final AiGlobalSummaryRepository aiGlobalSummaryRepository;
    private final AiPhaseSummaryRepository aiPhaseSummaryRepository;
    private final AiPlanCandidateRepository aiPlanCandidateRepository;
    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random();

    public DemoAccountSeeder(UserRepository userRepository, DoctorProfileRepository doctorProfileRepository,
                             PatientProfileRepository patientProfileRepository, DoctorPatientAssignmentRepository assignmentRepository,
                             FagerstromTestRepository fagerstromTestRepository, HadTestRepository hadTestRepository,
                             DailyReportRepository dailyReportRepository, SevragePlanRepository sevragePlanRepository,
                             ConsultationReportRepository consultationReportRepository, AppointmentRepository appointmentRepository,
                             AiGlobalSummaryRepository aiGlobalSummaryRepository, AiPhaseSummaryRepository aiPhaseSummaryRepository,
                             AiPlanCandidateRepository aiPlanCandidateRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.assignmentRepository = assignmentRepository;
        this.fagerstromTestRepository = fagerstromTestRepository;
        this.hadTestRepository = hadTestRepository;
        this.dailyReportRepository = dailyReportRepository;
        this.sevragePlanRepository = sevragePlanRepository;
        this.consultationReportRepository = consultationReportRepository;
        this.appointmentRepository = appointmentRepository;
        this.aiGlobalSummaryRepository = aiGlobalSummaryRepository;
        this.aiPhaseSummaryRepository = aiPhaseSummaryRepository;
        this.aiPlanCandidateRepository = aiPlanCandidateRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        resetDemoPasswords();

        try {
            if (userRepository.findByEmailIgnoreCase("tantaniayman0@gmail.com").isPresent()) {
                log.info("✅ Demo data already exists, skipping full seeding (passwords reset).");
                return;
            }

            log.info("🌱 Starting massive demo data seeding...");

        // 1. DOCTORS
        DoctorProfile doc1 = createDoctor("ayman.tantani@uit.ac.ma", "Ayman", "Tantani", "Tabacologue & Addictologue", "Kénitra", 12);
        DoctorProfile doc2 = createDoctor("aymantantani20@gmail.com", "Ayman", "Tantani", "Pneumologue Spécialiste", "Rabat", 8);
        
        createDoctor("dr.lahlou@neural.ma", "Amine", "Lahlou", "Cardiologue", "Casablanca", 15);
        createDoctor("dr.berrada@neural.ma", "Yassine", "Berrada", "Psychiatre", "Marrakech", 20);
        createDoctor("dr.benjelloun@neural.ma", "Salma", "Benjelloun", "Médecin Généraliste", "Tanger", 5);
        createDoctor("dr.alaoui@neural.ma", "Hicham", "Alaoui", "Addictologue", "Fès", 10);
        createDoctor("dr.meziane@neural.ma", "Zineb", "Meziane", "Nutritionniste", "Agadir", 7);

        // 2. PATIENTS FOR DOCTOR 1
        // Scenario 1: Success Story
        PatientProfile p1 = createPatient("tantaniayman0@gmail.com", "Youssef", "El Fassi", LocalDate.of(1985, 4, 12), 15, PatientProfile.DependenceLevel.LOW);
        assignPatientToDoctor(p1, doc1);
        seedFullPatientScenario(p1, doc1, "SUCCESS");

        // Scenario 2: Relapse & Struggle
        PatientProfile p2 = createPatient("aymantantani18@gmail.com", "Karim", "Benali", LocalDate.of(1992, 8, 22), 30, PatientProfile.DependenceLevel.VERY_HIGH);
        assignPatientToDoctor(p2, doc1);
        seedFullPatientScenario(p2, doc1, "RELAPSE");

        // Scenario 3: High Anxiety
        PatientProfile p3 = createPatient("projetfinetude4@gmail.com", "Sara", "Mansour", LocalDate.of(1990, 1, 5), 20, PatientProfile.DependenceLevel.MODERATE);
        assignPatientToDoctor(p3, doc1);
        seedFullPatientScenario(p3, doc1, "ANXIETY");

        // Scenario 4: Long-term Success
        PatientProfile p4 = createPatient("saidpa1969@gmail.com", "Said", "Alaoui", LocalDate.of(1969, 11, 30), 40, PatientProfile.DependenceLevel.HIGH);
        assignPatientToDoctor(p4, doc1);
        seedFullPatientScenario(p4, doc1, "STABLE_SUCCESS");

        // Scenario 5: In Progress (Bupropion)
        PatientProfile p5 = createPatient("testaccsimo@gmail.com", "Mohamed", "Chraibi", LocalDate.of(1980, 5, 16), 25, PatientProfile.DependenceLevel.HIGH);
        assignPatientToDoctor(p5, doc1);
        seedFullPatientScenario(p5, doc1, "IN_PROGRESS");

        // 3. PATIENTS FOR DOCTOR 2
        PatientProfile p6 = createPatient("pfinetude00@gmail.com", "Nadia", "Tazi", LocalDate.of(1975, 2, 10), 10, PatientProfile.DependenceLevel.LOW);
        assignPatientToDoctor(p6, doc2);
        seedFullPatientScenario(p6, doc2, "SUCCESS");

        PatientProfile p7 = createPatient("dsitabacpfe@gmail.com", "Hassan", "Naciri", LocalDate.of(1988, 9, 8), 25, PatientProfile.DependenceLevel.HIGH);
        assignPatientToDoctor(p7, doc2);
        seedFullPatientScenario(p7, doc2, "RELAPSE");

        PatientProfile p8 = createPatient("aymantantani11@gmail.com", "Fatima Zahra", "Amrani", LocalDate.of(1995, 12, 1), 15, PatientProfile.DependenceLevel.MODERATE);
        assignPatientToDoctor(p8, doc2);
        seedFullPatientScenario(p8, doc2, "SUCCESS");

        log.info("🎉 Massive demo data seeding complete!");
        } catch (Exception e) {
            log.error("❌ Error during demo data seeding: {}", e.getMessage(), e);
        }
    }

    private void seedFullPatientScenario(PatientProfile patient, DoctorProfile doctor, String scenario) {
        LocalDate startDate = LocalDate.now().minusDays(35);
        
        // 1. Tests History
        seedTests(patient, scenario, startDate);
        
        // 2. Daily Reports (Journal)
        seedDailyReports(patient, scenario, startDate);
        
        // 3. Consultations (Bilan Initial + Follow-ups)
        seedConsultations(patient, doctor, scenario, startDate);
        
        // 4. AI Profile (Summaries & Plans)
        seedAiProfile(patient, scenario);
    }

    private void seedTests(PatientProfile patient, String scenario, LocalDate startDate) {
        int count = 5;
        for (int i = 0; i < count; i++) {
            LocalDateTime date = startDate.plusDays(i * 7).atTime(10, 0);
            
            FagerstromTest fTest = new FagerstromTest();
            fTest.setPatientProfile(patient);
            fTest.setCreatedAt(date.toInstant(java.time.ZoneOffset.UTC));
            fTest.setTimeToFirstCigarette(FagerstromRequest.TimeToFirstCigarette.WITHIN_5_MIN);
            fTest.setMostDifficultCigarette(FagerstromRequest.MostDifficultCigarette.FIRST_IN_MORNING);
            fTest.setCigarettesPerDay(FagerstromRequest.CigarettesPerDay.TWENTY_ONE_TO_THIRTY);
            fTest.setDifficultToRefrain(true);
            fTest.setSmokeMoreInMorning(true);
            fTest.setSmokeWhenIll(true);
            
            HadTest hadTest = new HadTest();
            hadTest.setPatientProfile(patient);
            hadTest.setCreatedAt(date.toInstant(java.time.ZoneOffset.UTC));
            hadTest.setQ1(1); hadTest.setQ2(1); hadTest.setQ3(1); hadTest.setQ4(1);
            hadTest.setQ5(1); hadTest.setQ6(1); hadTest.setQ7(1); hadTest.setQ8(1);
            hadTest.setQ9(1); hadTest.setQ10(1); hadTest.setQ11(1); hadTest.setQ12(1);
            hadTest.setQ13(1); hadTest.setQ14(1);

            switch (scenario) {
                case "SUCCESS":
                    fTest.setTotalScore(Math.max(0, 7 - i * 2));
                    hadTest.setAnxietyScore(Math.max(0, 10 - i * 2));
                    hadTest.setDepressionScore(Math.max(0, 6 - i));
                    break;
                case "RELAPSE":
                    fTest.setTotalScore(i < 3 ? 9 - i : 8);
                    hadTest.setAnxietyScore(i < 3 ? 14 - i : 16);
                    hadTest.setDepressionScore(i < 3 ? 10 : 12);
                    break;
                case "ANXIETY":
                    fTest.setTotalScore(6);
                    hadTest.setAnxietyScore(18 - i);
                    hadTest.setDepressionScore(10);
                    break;
                default:
                    fTest.setTotalScore(Math.max(2, 8 - i));
                    hadTest.setAnxietyScore(Math.max(4, 12 - i));
                    hadTest.setDepressionScore(Math.max(2, 8 - i));
            }
            
            fTest.setDependenceLevel(fTest.getTotalScore() > 6 ? FagerstromResult.DependenceLevel.HIGH : FagerstromResult.DependenceLevel.MEDIUM);
            hadTest.setAnxietyInterpretation(hadTest.getAnxietyScore() > 10 ? HadResult.Interpretation.CERTAIN_SYMPTOMATOLOGY : HadResult.Interpretation.NORMAL);
            hadTest.setDepressionInterpretation(hadTest.getDepressionScore() > 10 ? HadResult.Interpretation.CERTAIN_SYMPTOMATOLOGY : HadResult.Interpretation.NORMAL);
            
            fagerstromTestRepository.save(fTest);
            hadTestRepository.save(hadTest);
            
            if (i == count - 1) {
                patient.setFagerstromScore(fTest.getTotalScore());
                patient.setHadAnxietyScore(hadTest.getAnxietyScore());
                patient.setHadDepressionScore(hadTest.getDepressionScore());
                patientProfileRepository.save(patient);
            }
        }
    }

    private void seedDailyReports(PatientProfile patient, String scenario, LocalDate startDate) {
        int initialCigs = patient.getCigarettesPerDay() != null ? patient.getCigarettesPerDay() : 20;
        for (int i = 0; i < 35; i++) {
            DailyReport report = new DailyReport();
            report.setPatientProfile(patient);
            report.setReportDate(startDate.plusDays(i));
            report.setUsedNrt(true);
            report.setMoodScore(7);

            switch (scenario) {
                case "SUCCESS":
                    report.setCigarettesSmoked(Math.max(0, initialCigs - i));
                    report.setCravingsIntensity(Math.max(0, 8 - i / 4));
                    report.setStressScore(Math.max(0, 6 - i / 5));
                    break;
                case "RELAPSE":
                    if (i > 28) {
                        report.setCigarettesSmoked(initialCigs / 2);
                        report.setRelapseEvent(true);
                        report.setCravingsIntensity(10);
                        report.setStressScore(9);
                    } else {
                        report.setCigarettesSmoked(Math.max(5, initialCigs - i));
                        report.setCravingsIntensity(Math.max(3, 9 - i / 3));
                        report.setStressScore(Math.max(4, 7 - i / 4));
                    }
                    break;
                case "ANXIETY":
                    report.setCigarettesSmoked(Math.max(2, initialCigs - i / 2));
                    report.setCravingsIntensity(7);
                    report.setStressScore(Math.min(10, 8 + (i % 3)));
                    break;
                default:
                    report.setCigarettesSmoked(Math.max(0, initialCigs - i));
                    report.setCravingsIntensity(5);
                    report.setStressScore(4);
            }
            dailyReportRepository.save(report);
        }
    }

    private void seedConsultations(PatientProfile patient, DoctorProfile doctor, String scenario, LocalDate startDate) {
        // Initial Assessment
        createConsultation(patient, doctor, startDate, ConsultationReport.ReportType.INITIAL_ASSESSMENT, 0, scenario);
        
        // Follow-ups
        createConsultation(patient, doctor, startDate.plusDays(10), ConsultationReport.ReportType.FOLLOW_UP, 1, scenario);
        createConsultation(patient, doctor, startDate.plusDays(20), ConsultationReport.ReportType.FOLLOW_UP, 2, scenario);
        createConsultation(patient, doctor, startDate.plusDays(30), ConsultationReport.ReportType.FOLLOW_UP, 3, scenario);
    }

    private void createConsultation(PatientProfile patient, DoctorProfile doctor, LocalDate date, ConsultationReport.ReportType type, int num, String scenario) {
        Appointment apt = new Appointment();
        apt.setPatientProfile(patient);
        apt.setDoctorProfile(doctor);
        apt.setStartsAt(date.atTime(14, 0));
        apt.setDurationMinutes(30);
        apt.setStatus(Appointment.Status.COMPLETED);
        apt.setReason(type == ConsultationReport.ReportType.INITIAL_ASSESSMENT ? "Bilan de tabacologie" : "Suivi de sevrage");
        apt = appointmentRepository.save(apt);

        ConsultationReport report = new ConsultationReport();
        report.setAppointment(apt);
        report.setConsultationDate(date);
        report.setReportType(type);
        report.setFollowUpNumber(type == ConsultationReport.ReportType.FOLLOW_UP ? num : null);
        report.setTobaccoConsumptionDaily(patient.getCigarettesPerDay());
        report.setCoExpiredPpm(type == ConsultationReport.ReportType.INITIAL_ASSESSMENT ? 25 : Math.max(2, 20 - num * 5));
        
        String obs = switch (scenario) {
            case "SUCCESS" -> "Le patient progresse très bien. Motivation intacte. Sommeil amélioré.";
            case "RELAPSE" -> num > 2 ? "Rechute signalée hier. Facteur déclencheur : stress pro. Reprise du protocole." : "Bon début de sevrage.";
            case "ANXIETY" -> "Anxiété persistante. Nécessite un soutien cognitif accru.";
            default -> "Suivi de routine. Patient stable.";
        };
        report.setObservations(obs);
        report.setPrescribedNrt(true);
        report.setNrtPatch(true);
        report.setNrtPatchDosage("21mg/24h");
        consultationReportRepository.save(report);
    }

    private void seedAiProfile(PatientProfile patient, String scenario) {
        // Global Summary
        AiGlobalSummary global = new AiGlobalSummary();
        global.setPatientProfile(patient);
        global.setModelName("gemini-1.5-pro (Simulated)");
        
        String summary = switch (scenario) {
            case "SUCCESS" -> "### Profil Clinique : Succès Progressif\nPatient présentant une excellente adhésion au traitement. Les scores HAD montrent une stabilisation de l'humeur parallèlement à la baisse de nicotine. **Point fort :** Forte motivation intrinsèque.";
            case "RELAPSE" -> "### Profil Clinique : Risque de Rechute Élevé\nDépendance physique très marquée. Le RASS indique une vulnérabilité aux pics de stress émotionnel. **Alerte :** Risque de découragement suite à la reprise tabagique.";
            case "ANXIETY" -> "### Profil Clinique : Dominante Anxieuse\nUsage du tabac comme mécanisme de régulation du stress. Scores HAD-A constamment > 15. Nécessite une approche combinée TSN + TCC.";
            default -> "### Profil Clinique : Standard\nParcours de sevrage classique. Adhésion moyenne aux substituts.";
        };
        global.setSummary(summary);
        global.setDoctorFocusPoints(List.of("Surveillance des cravings", "Validation des doses TSN", "Soutien motivationnel"));
        global.setPatientReadiness(scenario.equals("SUCCESS") ? "85%" : "45%");
        aiGlobalSummaryRepository.save(global);

        // Phase Summaries
        createPhaseSummary(patient, 1, "Préparation", "Phase terminée. Le patient a identifié ses déclencheurs et fixé sa date d'arrêt.");
        createPhaseSummary(patient, 2, "Action & Sevrage", scenario.equals("RELAPSE") ? "Phase critique : rechute identifiée. Ajustement du plan nécessaire." : "Objectif atteint : consommation réduite à 0.");
        createPhaseSummary(patient, 3, "Stabilisation", "Maintien de l'abstinence et gestion des tentations sociales.");

        // Plan Candidates
        createPlanCandidate(patient, "Piste Pharmacologique", "Augmentation des substituts oraux pour compenser les pics de stress.");
        createPlanCandidate(patient, "Piste Comportementale", "Focus sur les techniques de respiration et la gestion des émotions sans tabac.");
    }

    private void createPhaseSummary(PatientProfile patient, int phaseId, String title, String summary) {
        AiPhaseSummary phase = new AiPhaseSummary();
        phase.setPatientProfile(patient);
        phase.setPhaseId(phaseId);
        phase.setPhaseTitle(title);
        phase.setSummary(summary);
        phase.setAttentionPoints(List.of("Point A", "Point B"));
        aiPhaseSummaryRepository.save(phase);
    }

    private void createPlanCandidate(PatientProfile patient, String trackTitle, String rationale) {
        AiPlanCandidate plan = new AiPlanCandidate();
        plan.setPatientProfile(patient);
        plan.setTrack(AiPlanCandidate.Track.BALANCED);
        plan.setTitle(trackTitle + " - Recommandation");
        plan.setRationale(rationale);
        plan.setSteps(List.of("Etape 1", "Etape 2", "Etape 3"));
        aiPlanCandidateRepository.save(plan);
    }

    private void resetDemoPasswords() {
        List<String> demoEmails = List.of(
            "ayman.tantani@uit.ac.ma", "aymantantani20@gmail.com",
            "dr.lahlou@neural.ma", "dr.berrada@neural.ma", "dr.benjelloun@neural.ma",
            "dr.alaoui@neural.ma", "dr.meziane@neural.ma",
            "tantaniayman0@gmail.com", "aymantantani18@gmail.com", "projetfinetude4@gmail.com",
            "saidpa1969@gmail.com", "testaccsimo@gmail.com", "pfinetude00@gmail.com",
            "dsitabacpfe@gmail.com", "aymantantani11@gmail.com"
        );
        String hashed = passwordEncoder.encode("password");
        for (String email : demoEmails) {
            userRepository.findByEmailIgnoreCase(email).ifPresent(u -> {
                u.setPasswordHash(hashed);
                userRepository.save(u);
            });
        }
    }

    private DoctorProfile createDoctor(String email, String firstName, String lastName, String specialty, String city, int exp) {
        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User u = new User();
            u.setEmail(email);
            u.setPasswordHash(passwordEncoder.encode("password"));
            u.setFullName(firstName + " " + lastName);
            u.setFirstName(firstName);
            u.setLastName(lastName);
            u.setCommunityUsername(firstName.toLowerCase() + "_" + lastName.toLowerCase() + "_" + random.nextInt(100));
            u.setAccountEnabled(true);
            u.setIdentityVerified(true);
            u.setStatus(User.UserStatus.ACTIVE);
            u.setRoles(new HashSet<>(Set.of("ROLE_DOCTOR", "ROLE_USER")));
            return userRepository.save(u);
        });


        
        DoctorProfile doc = doctorProfileRepository.findByUser(user).orElseGet(() -> {
            DoctorProfile d = new DoctorProfile();
            d.setUser(user);
            d.setSpecialty(specialty);
            d.setCity(city);
            d.setCountryCode("MA");
            d.setYearsExperience(exp);
            d.setSuccessScore(85 + random.nextInt(15));
            d.setBio("Expertise clinique en sevrage tabagique.");
            d.setAcceptsTeleconsultation(true);
            d.setActive(true);
            d.setDocumentsVerified(true);
            return doctorProfileRepository.save(d);
        });
        return doc;
    }

    private PatientProfile createPatient(String email, String firstName, String lastName, LocalDate dob, int cigs, PatientProfile.DependenceLevel dep) {
        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User u = new User();
            u.setEmail(email);
            u.setPasswordHash(passwordEncoder.encode("password"));
            u.setFullName(firstName + " " + lastName);
            u.setFirstName(firstName);
            u.setLastName(lastName);
            u.setCommunityUsername(firstName.toLowerCase() + "_" + lastName.toLowerCase() + "_" + random.nextInt(1000));
            u.setAccountEnabled(true);
            u.setIdentityVerified(true);
            u.setStatus(User.UserStatus.ACTIVE);
            u.setRoles(new HashSet<>(Set.of("ROLE_PATIENT", "ROLE_USER")));
            return userRepository.save(u);
        });

        PatientProfile p = patientProfileRepository.findByUser(user).orElseGet(() -> {
            PatientProfile profile = new PatientProfile();
            profile.setUser(user);
            profile.setDateOfBirth(dob);
            profile.setSex(PatientProfile.Sex.MALE);
            profile.setCity("Casablanca");
            profile.setCountryCode("MA");
            profile.setCigarettesPerDay(cigs);
            profile.setSmokingStartAge(18);
            profile.setDependenceLevel(dep);
            profile.setOnboardingComplete(true);
            profile.setTestsComplete(true);
            profile.setJournalComplete(true);
            return patientProfileRepository.save(profile);
        });
        return p;
    }

    private void assignPatientToDoctor(PatientProfile p, DoctorProfile d) {
        if (assignmentRepository.findByPatientProfileAndActiveTrue(p).isEmpty()) {
            DoctorPatientAssignment a = new DoctorPatientAssignment();
            a.setPatientProfile(p);
            a.setDoctorProfile(d);
            a.setActive(true);
            assignmentRepository.save(a);
        }
    }
}
