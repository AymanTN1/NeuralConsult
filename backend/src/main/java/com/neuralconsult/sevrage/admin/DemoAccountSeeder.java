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
    private final com.neuralconsult.sevrage.onboarding.OnboardingRepository onboardingRepository;
    private final com.neuralconsult.sevrage.community.CommunityServerRepository serverRepository;
    private final com.neuralconsult.sevrage.community.CommunityChannelRepository channelRepository;
    private final com.neuralconsult.sevrage.community.CommunityMemberRepository memberRepository;
    private final com.neuralconsult.sevrage.community.CommunityPostRepository postRepository;
    private final com.neuralconsult.sevrage.community.CommunityPostCommentRepository commentRepository;
    private final com.neuralconsult.sevrage.community.CommunityPostReactionRepository reactionRepository;
    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random();

    public DemoAccountSeeder(UserRepository userRepository, DoctorProfileRepository doctorProfileRepository,
                             PatientProfileRepository patientProfileRepository, DoctorPatientAssignmentRepository assignmentRepository,
                             FagerstromTestRepository fagerstromTestRepository, HadTestRepository hadTestRepository,
                             DailyReportRepository dailyReportRepository, SevragePlanRepository sevragePlanRepository,
                             ConsultationReportRepository consultationReportRepository, AppointmentRepository appointmentRepository,
                             AiGlobalSummaryRepository aiGlobalSummaryRepository, AiPhaseSummaryRepository aiPhaseSummaryRepository,
                             AiPlanCandidateRepository aiPlanCandidateRepository,
                             com.neuralconsult.sevrage.onboarding.OnboardingRepository onboardingRepository,
                             com.neuralconsult.sevrage.community.CommunityServerRepository serverRepository,
                             com.neuralconsult.sevrage.community.CommunityChannelRepository channelRepository,
                             com.neuralconsult.sevrage.community.CommunityMemberRepository memberRepository,
                             com.neuralconsult.sevrage.community.CommunityPostRepository postRepository,
                             com.neuralconsult.sevrage.community.CommunityPostCommentRepository commentRepository,
                             com.neuralconsult.sevrage.community.CommunityPostReactionRepository reactionRepository,
                             PasswordEncoder passwordEncoder) {
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
        this.onboardingRepository = onboardingRepository;
        this.serverRepository = serverRepository;
        this.channelRepository = channelRepository;
        this.memberRepository = memberRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        resetDemoPasswords();
        seedCommunityDataIfNotExists();
        ensureEssentialDemoDataEnriched();

        try {
            if (userRepository.findByEmailIgnoreCase("tantaniayman0@gmail.com").isPresent() && dailyReportRepository.count() > 10) {
                log.info("✅ Demo clinical data already exists, skipping full seeding (passwords reset).");
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
            return d;
        });
        doc.setSpecialty(specialty);
        doc.setCity(city);
        doc.setCountryCode("MA");
        doc.setYearsExperience(exp);
        doc.setSuccessScore(85 + random.nextInt(15));
        doc.setBio("Expertise clinique en sevrage tabagique.");
        doc.setAcceptsTeleconsultation(true);
        doc.setActive(true);
        doc.setDocumentsVerified(true);
        return doctorProfileRepository.save(doc);
    }

    private PatientProfile createPatient(String email, String firstName, String lastName, LocalDate dob, int cigs, PatientProfile.DependenceLevel dep) {
        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User u = new User();
            u.setEmail(email);
            u.setPasswordHash(passwordEncoder.encode("password"));
            u.setRoles(new HashSet<>(Set.of("ROLE_PATIENT", "ROLE_USER")));
            return u;
        });
        user.setFullName(firstName + " " + lastName);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        if (user.getCommunityUsername() == null) {
            user.setCommunityUsername(firstName.toLowerCase() + "_" + lastName.toLowerCase() + "_" + random.nextInt(1000));
        }
        user.setAccountEnabled(true);
        user.setIdentityVerified(true);
        user.setStatus(User.UserStatus.ACTIVE);
        user = userRepository.save(user);

        PatientProfile p = patientProfileRepository.findByUser(user).orElseGet(() -> {
            PatientProfile profile = new PatientProfile();
            profile.setUser(user);
            return profile;
        });
        p.setDateOfBirth(dob);
        p.setSex(PatientProfile.Sex.MALE);
        p.setCity("Casablanca");
        p.setCountryCode("MA");
        p.setCigarettesPerDay(cigs);
        p.setSmokingStartAge(18);
        p.setDependenceLevel(dep);
        p.setOnboardingComplete(true);
        p.setTestsComplete(true);
        p.setJournalComplete(true);
        return patientProfileRepository.save(p);
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

    private void seedCommunityDataIfNotExists() {
        try {
            if (serverRepository.count() > 0 && postRepository.count() > 0) {
                return;
            }

            log.info("🌐 Seeding Reddit-style community spaces, posts, and interactions...");

            User doctor = userRepository.findByEmailIgnoreCase("ayman.tantani@uit.ac.ma").orElse(null);
            if (doctor == null) return;

            User patientSamy = userRepository.findByEmailIgnoreCase("tantaniayman0@gmail.com").orElse(doctor);
            User patientYasmine = userRepository.findByEmailIgnoreCase("aymantantani18@gmail.com").orElse(doctor);
            User patientKarim = userRepository.findByEmailIgnoreCase("projetfinetude4@gmail.com").orElse(doctor);
            User doctorLahlou = userRepository.findByEmailIgnoreCase("dr.lahlou@neural.ma").orElse(doctor);

            // Configure nice pseudonyms and badges
            doctor.setCommunityUsername("dr_tantani");
            doctor.setVerifiedBadge(true);
            doctor.setCommunityBio("Tabacologue & Addictologue Référent NeuralConsult.");
            userRepository.save(doctor);

            doctorLahlou.setCommunityUsername("dr_lahlou");
            doctorLahlou.setVerifiedBadge(true);
            doctorLahlou.setCommunityBio("Cardiologue & Prévention cardio-vasculaire.");
            userRepository.save(doctorLahlou);

            patientSamy.setCommunityUsername("samy_zen");
            patientSamy.setCommunityBio("En sevrage depuis 1 mois. Objectif : marathon sans fumée !");
            userRepository.save(patientSamy);

            patientYasmine.setCommunityUsername("yasmine_m");
            patientYasmine.setCommunityBio("Libérée du tabac depuis 2 semaines. Vive la respiration !");
            userRepository.save(patientYasmine);

            patientKarim.setCommunityUsername("karim_courage");
            patientKarim.setCommunityBio("Sevrage actif avec patchs et sport.");
            userRepository.save(patientKarim);

            // Sub-communities (Subreddits)
            com.neuralconsult.sevrage.community.CommunityServer rVictoires = createSubreddit("r/victoires_sevrage", "Partagez vos étapes, jours sans fumer, économies et trophées !", doctor);
            com.neuralconsult.sevrage.community.CommunityServer rEntraide = createSubreddit("r/entraide_urgences", "Besoin d'aide immédiate, pics d'envie (craving) et soutien bienveillant.", doctor);
            com.neuralconsult.sevrage.community.CommunityServer rConseils = createSubreddit("r/conseils_tabacologues", "Recommandations médicales, science du sevrage, sommeil et gestion de l'appétit.", doctor);
            com.neuralconsult.sevrage.community.CommunityServer rTns = createSubreddit("r/substituts_tns", "Retours d'expérience sur les patchs, gommes, inhaleurs et varénicline.", doctor);
            com.neuralconsult.sevrage.community.CommunityServer rSport = createSubreddit("r/sport_et_bienetre", "Gestion du stress par le sport, la cohérence cardiaque et la relaxation.", doctor);

            // Post 1: Victoire J+30
            com.neuralconsult.sevrage.community.CommunityPost post1 = new com.neuralconsult.sevrage.community.CommunityPost();
            post1.setAuthor(patientSamy);
            post1.setServer(rVictoires);
            post1.setTitle("Aujourd'hui cela fait exactement 30 jours sans aucune cigarette ! Mon souffle et mon énergie sont de retour 🫁");
            post1.setFlair("🏆 Victoire J+30");
            post1.setContent("Il y a un mois, je fumais 25 cigarettes par jour. Les 5 premiers jours ont été difficiles, mais avec l'aide des patchs 21mg et les séances de respiration cohérence cardiaque sur l'app, j'ai tenu bon. Résultat : 270€ économisés et je monte enfin les escaliers sans être essoufflé ! Courage à tous ceux qui débutent, c'est possible !");
            post1.setImageUrl("https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80");
            com.neuralconsult.sevrage.community.CommunityPost savedPost1 = postRepository.save(post1);

            addComment(savedPost1, doctor, "Félicitations Samy ! Le cap des 30 jours est un tournant majeur sur le plan de la réactivité bronchique et de la normalisation du monoxyde de carbone. Continuez sur ce rythme !");
            addComment(savedPost1, patientYasmine, "Bravo Samy, tu me motives énormément ! J'en suis à J+14 et ton message me donne la force pour aujourd'hui.");
            addReaction(savedPost1, doctor, com.neuralconsult.sevrage.community.CommunityPostReaction.ReactionType.UPVOTE);
            addReaction(savedPost1, patientYasmine, com.neuralconsult.sevrage.community.CommunityPostReaction.ReactionType.LOVE);
            addReaction(savedPost1, patientKarim, com.neuralconsult.sevrage.community.CommunityPostReaction.ReactionType.FIRE);

            // Post 2: Conseil Médical
            com.neuralconsult.sevrage.community.CommunityPost post2 = new com.neuralconsult.sevrage.community.CommunityPost();
            post2.setAuthor(doctorLahlou);
            post2.setServer(rConseils);
            post2.setTitle("Craving du matin et café : pourquoi cette envie est la plus violente et comment la neutraliser ☕");
            post2.setFlair("🩺 Conseil Médecin");
            post2.setContent("Le pic d'envie au réveil est dû à la chute nocturne du taux plasmatique de nicotine combinée à l'ancrage comportemental café-cigarette.\n\n💡 **Astuce clinique :** Prenez votre substitut oral (gomme ou pastille) 10 minutes AVANT votre café, ou changez temporairement de boisson (thé vert, citron chaud). Le cerveau déconditionne le réflexe en moins de 3 semaines !");
            post2.setImageUrl("https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80");
            com.neuralconsult.sevrage.community.CommunityPost savedPost2 = postRepository.save(post2);

            addComment(savedPost2, patientKarim, "Merci infiniment Docteur ! C'était mon plus gros point faible, je vais appliquer la pastille 10 min avant dès demain matin.");
            addReaction(savedPost2, doctor, com.neuralconsult.sevrage.community.CommunityPostReaction.ReactionType.UPVOTE);
            addReaction(savedPost2, patientSamy, com.neuralconsult.sevrage.community.CommunityPostReaction.ReactionType.INSIGHT);
            addReaction(savedPost2, patientYasmine, com.neuralconsult.sevrage.community.CommunityPostReaction.ReactionType.UPVOTE);

            // Post 3: Urgence Craving
            com.neuralconsult.sevrage.community.CommunityPost post3 = new com.neuralconsult.sevrage.community.CommunityPost();
            post3.setAuthor(patientKarim);
            post3.setServer(rEntraide);
            post3.setTitle("Grosse envie soudaine après une journée de travail stressante... J'ai besoin de force 🚨");
            post3.setFlair("🆘 Urgence Craving");
            post3.setContent("La journée a été très lourde au bureau et mon ancien réflexe était d'allumer 3 cigarettes d'affilée en rentrant. Là je suis dans ma voiture, la tentation est forte. J'ai lancé le mode SOS de l'application et je poste ici pour m'occuper l'esprit.");
            com.neuralconsult.sevrage.community.CommunityPost savedPost3 = postRepository.save(post3);

            addComment(savedPost3, doctor, "Karim, respire calmement selon le protocole 4-7-8 pendant 3 minutes. Le pic de craving ne dure jamais plus de 5 minutes. Bois une gorgée d'eau fraîche, tu as déjà accompli de grandes choses !");
            addComment(savedPost3, patientSamy, "On est avec toi Karim ! Ne lâche rien, dans 5 minutes l'envie sera passée. Mets de la musique et sors marcher un coup !");
            addReaction(savedPost3, doctor, com.neuralconsult.sevrage.community.CommunityPostReaction.ReactionType.SUPPORT);
            addReaction(savedPost3, patientSamy, com.neuralconsult.sevrage.community.CommunityPostReaction.ReactionType.SUPPORT);

            // Post 4: Sport et Bien-être
            com.neuralconsult.sevrage.community.CommunityPost post4 = new com.neuralconsult.sevrage.community.CommunityPost();
            post4.setAuthor(patientYasmine);
            post4.setServer(rSport);
            post4.setTitle("Reprise de la course à pied à J+14 : premier 5km couru sans m'arrêter ! 🏃‍♀️");
            post4.setFlair("🧘 Sport & Bien-être");
            post4.setContent("Il y a 2 semaines, faire 500m en trottinant me brûlait les poumons. Ce matin, 5 kilomètres en 32 minutes avec le sourire. Le corps a une capacité de régénération absolument extraordinaire. Ne doutez jamais de votre corps !");
            post4.setImageUrl("https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80");
            com.neuralconsult.sevrage.community.CommunityPost savedPost4 = postRepository.save(post4);

            addReaction(savedPost4, doctor, com.neuralconsult.sevrage.community.CommunityPostReaction.ReactionType.FIRE);
            addReaction(savedPost4, patientSamy, com.neuralconsult.sevrage.community.CommunityPostReaction.ReactionType.CLAP);
            addReaction(savedPost4, patientKarim, com.neuralconsult.sevrage.community.CommunityPostReaction.ReactionType.UPVOTE);

            // Post 5: Substituts TNS
            com.neuralconsult.sevrage.community.CommunityPost post5 = new com.neuralconsult.sevrage.community.CommunityPost();
            post5.setAuthor(patientSamy);
            post5.setServer(rTns);
            post5.setTitle("Mon retour d'expérience : combiner patch 14mg + pastilles 2mg en secours");
            post5.setFlair("💊 Substituts & TNS");
            post5.setContent("Pour ceux qui hésitent entre patch seul ou combiné : mon tabacologue m'a prescrit un patch 14mg continu + pastilles 2mg en secours. La combinaison fait toute la différence pendant les moments de convivialité ou après les repas !");
            postRepository.save(post5);

            log.info("✅ Reddit-style community seeded successfully with subreddits and realistic posts!");
        } catch (Exception e) {
            log.warn("⚠️ Failed to seed community data: {}", e.getMessage());
        }
    }

    private com.neuralconsult.sevrage.community.CommunityServer createSubreddit(String name, String description, User creator) {
        return serverRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            com.neuralconsult.sevrage.community.CommunityServer s = new com.neuralconsult.sevrage.community.CommunityServer();
            s.setName(name);
            s.setDescription(description);
            s.setCreatedByUser(creator);
            com.neuralconsult.sevrage.community.CommunityServer saved = serverRepository.save(s);

            com.neuralconsult.sevrage.community.CommunityChannel ch = new com.neuralconsult.sevrage.community.CommunityChannel();
            ch.setServer(saved);
            ch.setName("discussions");
            ch.setDescription("Fil de discussions pour " + name);
            channelRepository.save(ch);
            return saved;
        });
    }

    private void addComment(com.neuralconsult.sevrage.community.CommunityPost post, User author, String content) {
        com.neuralconsult.sevrage.community.CommunityPostComment c = new com.neuralconsult.sevrage.community.CommunityPostComment();
        c.setPost(post);
        c.setAuthor(author);
        c.setContent(content);
        commentRepository.save(c);
    }

    private void addReaction(com.neuralconsult.sevrage.community.CommunityPost post, User user, com.neuralconsult.sevrage.community.CommunityPostReaction.ReactionType type) {
        com.neuralconsult.sevrage.community.CommunityPostReaction r = new com.neuralconsult.sevrage.community.CommunityPostReaction();
        r.setPost(post);
        r.setUser(user);
        r.setType(type);
        reactionRepository.save(r);
    }

    private void ensureEssentialDemoDataEnriched() {
        try {
            User doctorUser = userRepository.findByEmailIgnoreCase("ayman.tantani@uit.ac.ma").orElse(null);
            if (doctorUser != null) {
                doctorUser.setFullName("Dr. Ayman Tantani");
                doctorUser.setFirstName("Ayman");
                doctorUser.setLastName("Tantani");
                doctorUser.setAccountEnabled(true);
                doctorUser.setIdentityVerified(true);
                doctorUser.setStatus(User.UserStatus.ACTIVE);
                userRepository.save(doctorUser);

                DoctorProfile doctor = doctorProfileRepository.findByUser(doctorUser).orElseGet(() -> {
                    DoctorProfile d = new DoctorProfile();
                    d.setUser(doctorUser);
                    return d;
                });
                doctor.setActive(true);
                doctor.setAcceptsTeleconsultation(true);
                doctor.setSpecialty("Tabacologue & Addictologue");
                doctor.setYearsExperience(12);
                doctor.setCity("Rabat");
                doctor.setCountryCode("MA");
                doctor.setSuccessScore(98);
                doctor.setDocumentsVerified(true);
                doctor.setBio("Médecin spécialiste en tabacologie clinique et addictologie comportementale. Accompagnement bienveillant et protocoles validés HAS / OMS.");
                doctor = doctorProfileRepository.save(doctor);

                // Ensure all 5 demo patients exist, have rich clinical data, and are assigned to Dr. Tantani
                record DemoPatientSeed(String email, String firstName, String lastName, LocalDate dob, String city, String occupation, int fScore, int hAnx, int hDep, PatientProfile.DependenceLevel dep) {}
                List<DemoPatientSeed> demoPatientSeeds = List.of(
                    new DemoPatientSeed("tantaniayman0@gmail.com", "Youssef", "El Fassi", LocalDate.of(1994, 8, 22), "Rabat", "Architecte Logiciel", 0, 2, 1, PatientProfile.DependenceLevel.LOW),
                    new DemoPatientSeed("aymantantani18@gmail.com", "Karim", "Benali", LocalDate.of(1984, 3, 15), "Casablanca", "Cadre Financier", 6, 9, 4, PatientProfile.DependenceLevel.VERY_HIGH),
                    new DemoPatientSeed("projetfinetude4@gmail.com", "Sara", "Mansour", LocalDate.of(1998, 11, 4), "Marrakech", "Enseignante", 2, 4, 2, PatientProfile.DependenceLevel.MODERATE),
                    new DemoPatientSeed("saidpa1969@gmail.com", "Said", "Alaoui", LocalDate.of(1968, 1, 30), "Fès", "Commerçant", 0, 1, 1, PatientProfile.DependenceLevel.LOW),
                    new DemoPatientSeed("testaccsimo@gmail.com", "Mohamed", "Chraibi", LocalDate.of(1990, 6, 19), "Tanger", "Ingénieur Logistique", 7, 12, 6, PatientProfile.DependenceLevel.HIGH)
                );

                for (DemoPatientSeed seed : demoPatientSeeds) {
                    final DoctorProfile finalDoctor = doctor;
                    User pUser = userRepository.findByEmailIgnoreCase(seed.email()).orElseGet(() -> {
                        User u = new User();
                        u.setEmail(seed.email());
                        u.setPasswordHash(passwordEncoder.encode("password"));
                        u.setRoles(new HashSet<>(Set.of("ROLE_PATIENT", "ROLE_USER")));
                        return u;
                    });
                    pUser.setFullName(seed.firstName() + " " + seed.lastName());
                    pUser.setFirstName(seed.firstName());
                    pUser.setLastName(seed.lastName());
                    pUser.setDateOfBirth(seed.dob());
                    pUser.setAccountEnabled(true);
                    pUser.setIdentityVerified(true);
                    pUser.setStatus(User.UserStatus.ACTIVE);
                    pUser = userRepository.save(pUser);

                    PatientProfile pProf = patientProfileRepository.findByUser(pUser).orElseGet(() -> {
                        PatientProfile pp = new PatientProfile();
                        pp.setUser(pUser);
                        return pp;
                    });
                    pProf.setDateOfBirth(seed.dob());
                    pProf.setCity(seed.city());
                    pProf.setCountryCode("MA");
                    pProf.setOccupation(seed.occupation());
                    pProf.setFagerstromScore(seed.fScore());
                    pProf.setHadAnxietyScore(seed.hAnx());
                    pProf.setHadDepressionScore(seed.hDep());
                    pProf.setDependenceLevel(seed.dep());
                    pProf.setOnboardingComplete(true);
                    pProf.setTestsComplete(true);
                    pProf.setJournalComplete(true);
                    pProf = patientProfileRepository.save(pProf);

                    // Ensure Assignment
                    if (assignmentRepository.findByPatientProfileAndActiveTrue(pProf).isEmpty()) {
                        DoctorPatientAssignment dpa = new DoctorPatientAssignment();
                        dpa.setPatientProfile(pProf);
                        dpa.setDoctorProfile(finalDoctor);
                        dpa.setActive(true);
                        assignmentRepository.save(dpa);
                    }
                }
            }

            User patientUser = userRepository.findByEmailIgnoreCase("tantaniayman0@gmail.com").orElse(null);
            DoctorProfile doctor = doctorUser != null ? doctorProfileRepository.findByUser(doctorUser).orElse(null) : null;
            if (patientUser == null || doctor == null) return;

            PatientProfile patient = patientProfileRepository.findByUser(patientUser).orElse(null);
            if (patient == null) return;

            // 1. Ensure SevragePlan exists
            if (sevragePlanRepository.findByPatientProfile(patient).isEmpty()) {
                SevragePlan plan = new SevragePlan();
                plan.setPatientProfile(patient);
                plan.setIntensity(SevragePlan.PlanIntensity.MODERATE);
                plan.setSummary("Plan de sevrage personnalisé avec substitution nicotinique combinée (patch transdermique 21mg + gommes 2mg) et thérapie comportementale active.");
                plan.setNrtRecommendation("Patch 21mg/24h le matin au réveil + gommes 2mg en cas de pic d'envie aigu (max 8 gommes/jour).");
                plan.setBehavioralRecommendations("Séance de respiration 4-7-8 avant chaque café matinal, marche active quotidienne de 20 minutes, réhydratation réflexe lors des envies.");
                plan.setFollowUpPlan("Téléconsultation de contrôle tous les 15 jours avec mesure du CO expiré et adaptation du palier nicotinique.");
                plan.setRelapseProtocol("En cas de forte tentation ou de faux-pas, activer immédiatement le mode SOS Envie dans l'application et contacter le Dr. Tantani.");
                plan.setStartDate(LocalDate.now().minusDays(30));
                plan.setTargetQuitDate(LocalDate.now().minusDays(20));
                plan.setSteps(List.of(
                    "Étape 1 : Cartographie des déclencheurs et préparation de l'environnement sans tabac",
                    "Étape 2 : Pose du premier patch 21mg et démarrage du journal quotidien",
                    "Étape 3 : Passage du cap critique des 7 premiers jours sans aucune cigarette",
                    "Étape 4 : Déconditionnement du rituel café-tabac avec les substituts oraux",
                    "Étape 5 : Consolidation de l'abstinence et stabilisation du souffle"
                ));
                sevragePlanRepository.save(plan);
                log.info("✅ SevragePlan seeded for Youssef El Fassi");
            }

            // 2. Ensure OnboardingAssessment exists
            if (onboardingRepository.findByPatientProfile(patient).isEmpty()) {
                com.neuralconsult.sevrage.onboarding.OnboardingAssessment ob = new com.neuralconsult.sevrage.onboarding.OnboardingAssessment();
                ob.setPatientProfile(patient);
                ob.setConsultationObjective(com.neuralconsult.sevrage.onboarding.OnboardingAssessment.ConsultationObjective.STOP_COMPLETELY);
                ob.setProfessionalStatus(com.neuralconsult.sevrage.onboarding.OnboardingAssessment.ProfessionalStatus.ACTIVE);
                ob.setEducationLevel(com.neuralconsult.sevrage.onboarding.OnboardingAssessment.EducationLevel.BAC_PLUS_2);
                ob.setReferralSource(com.neuralconsult.sevrage.onboarding.OnboardingAssessment.ReferralSource.PERSONAL_DECISION);
                ob.setIncomeBracket(com.neuralconsult.sevrage.onboarding.OnboardingAssessment.IncomeBracket.FROM_2001_TO_3000);
                ob.setPhysicalActivityLevel(com.neuralconsult.sevrage.onboarding.OnboardingAssessment.PhysicalActivityLevel.ONE_TO_TWO_HOURS);
                ob.setSmokesDaily(true);
                ob.setManufacturedCigarettesPerDay(15);
                ob.setWeeklyTobaccoSpend(290);
                ob.setMotivationStage(4);
                ob.setMotivationScore(9);
                ob.setConfidenceScore(8);
                ob.setSmokingReasonStress(8);
                ob.setSmokingReasonConviviality(7);
                ob.setSmokingReasonAutomatic(6);
                ob.setSmokingReasonPleasure(5);
                ob.setQuitReasons("Amélioration du souffle, préservation de la santé cardio-vasculaire, économies financières importantes et protection de ma famille.");
                ob.setQuitFears("Peur de la prise de poids et des pics d'irritabilité les premières semaines.");
                ob.setTriggers("Café du matin, pause au travail avec collègues fumeurs, soirées et fins de repas.");
                onboardingRepository.save(ob);
                log.info("✅ OnboardingAssessment seeded for Youssef El Fassi");
            }

            // 3. Ensure Upcoming Confirmed Teleconsultation exists
            boolean hasUpcoming = appointmentRepository.findAll().stream()
                .anyMatch(a -> a.getPatientProfile().getId().equals(patient.getId()) && a.getStartsAt().isAfter(LocalDateTime.now()));
            if (!hasUpcoming) {
                Appointment upcomingApt = new Appointment();
                upcomingApt.setPatientProfile(patient);
                upcomingApt.setDoctorProfile(doctor);
                upcomingApt.setStartsAt(LocalDateTime.now().plusDays(3).withHour(15).withMinute(0).withSecond(0));
                upcomingApt.setDurationMinutes(30);
                upcomingApt.setStatus(Appointment.Status.CONFIRMED);
                upcomingApt.setReason("Consultation de suivi M+1 : Bilan biologique, contrôle du monoxyde de carbone et consolidation du sevrage.");
                upcomingApt.setDoctorNote("Patient très motivé. Prévoir vérification de l'adhésion au patch 14mg et maintien des exercices de cohérence cardiaque.");
                upcomingApt.setPatientNote("Le souffle s'est nettement amélioré, les envies du matin ont quasiment disparu.");
                upcomingApt.setMeetingProvider("JITSI");
                upcomingApt.setMeetingRoomName("NeuralConsult-Sevrage-Suivi-Youssef-Tantani");
                upcomingApt.setMeetingJoinUrl("https://meet.jit.si/NeuralConsult-Sevrage-Suivi-Youssef-Tantani");
                upcomingApt.setMeetingLinkSentAt(java.time.Instant.now());
                appointmentRepository.save(upcomingApt);
                log.info("✅ Upcoming Teleconsultation seeded for Youssef El Fassi & Dr. Tantani");
            }

        } catch (Exception e) {
            log.warn("⚠️ Error enriching essential demo data: {}", e.getMessage());
        }
    }
}

