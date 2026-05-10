package com.neuralconsult.sevrage.admin;

import com.neuralconsult.sevrage.appointment.Appointment;
import com.neuralconsult.sevrage.appointment.AppointmentRepository;
import com.neuralconsult.sevrage.clinical.intelligence.AiGlobalSummary;
import com.neuralconsult.sevrage.clinical.intelligence.AiGlobalSummaryRepository;
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
import java.util.List;
import java.util.Set;
import java.util.Random;

/**
 * Seeder global pour générer toutes les données de la soutenance :
 * Médecins, Patients, Consultations, Tests, Journal et Intelligence Artificielle.
 */
// @Component
// @Order(2)
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
    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random();

    public DemoAccountSeeder(UserRepository userRepository, DoctorProfileRepository doctorProfileRepository,
                             PatientProfileRepository patientProfileRepository, DoctorPatientAssignmentRepository assignmentRepository,
                             FagerstromTestRepository fagerstromTestRepository, HadTestRepository hadTestRepository,
                             DailyReportRepository dailyReportRepository, SevragePlanRepository sevragePlanRepository,
                             ConsultationReportRepository consultationReportRepository, AppointmentRepository appointmentRepository,
                             AiGlobalSummaryRepository aiGlobalSummaryRepository, PasswordEncoder passwordEncoder) {
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
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.findByEmailIgnoreCase("ayman.tantani@uit.ac.ma").isPresent()) {
            log.info("Demo data already seeded, skipping...");
            return;
        }

        log.info("🌱 Starting massive demo data seeding for jury presentation...");

        // 1. MEDECINS
        DoctorProfile doc1 = createDoctor("ayman.tantani@uit.ac.ma", "Ayman", "Tantani", "Tabacologue", "Kénitra", 12);
        DoctorProfile doc2 = createDoctor("aymantantani20@gmail.com", "Ayman", "Tantani", "Pneumologue", "Rabat", 8);
        
        createDoctor("dr.lahlou@gmail.com", "Amine", "Lahlou", "Cardiologue", "Casablanca", 15);
        createDoctor("dr.berrada@gmail.com", "Yassine", "Berrada", "Psychiatre", "Marrakech", 20);
        createDoctor("dr.benjelloun@gmail.com", "Salma", "Benjelloun", "Généraliste", "Tanger", 5);
        createDoctor("dr.alaoui@gmail.com", "Hicham", "Alaoui", "Addictologue", "Fès", 10);

        // 2. PATIENTS LIES AU DOC 1
        PatientProfile p1 = createPatient("tantaniayman0@gmail.com", "Youssef", "El Fassi", LocalDate.of(1985, 4, 12), 15, PatientProfile.DependenceLevel.LOW);
        assignPatientToDoctor(p1, doc1);
        seedPatientData(p1, 5, 2, 2, false, false, "En cours de sevrage, motivé, utilise des patchs.", "Youssef montre une très bonne résilience. Le dosage des patchs a été réduit.");
        
        PatientProfile p2 = createPatient("aymantantani18@gmail.com", "Karim", "Benali", LocalDate.of(1992, 8, 22), 30, PatientProfile.DependenceLevel.VERY_HIGH);
        assignPatientToDoctor(p2, doc1);
        seedPatientData(p2, 35, 18, 14, false, false, "Nouveau patient, forte dépendance physique et psychologique.", "Karim vient de commencer son sevrage. Fortes envies (cravings). Prescription TSN forte recommandée.");

        PatientProfile p3 = createPatient("projetfinetude4@gmail.com", "Sara", "Mansour", LocalDate.of(1990, 1, 5), 20, PatientProfile.DependenceLevel.MODERATE);
        assignPatientToDoctor(p3, doc1);
        seedPatientData(p3, 20, 10, 15, true, false, "Patiente très anxieuse, rechute récente suite à un stress professionnel.", "Sara a rechuté il y a 3 jours. Anxiété élevée. Nécessite un soutien psychologique accru.");

        PatientProfile p4 = createPatient("saidpa1969@gmail.com", "Said", "Alaoui", LocalDate.of(1969, 11, 30), 40, PatientProfile.DependenceLevel.HIGH);
        assignPatientToDoctor(p4, doc1);
        seedPatientData(p4, 0, 5, 4, false, true, "Patient ancien, sevrage réussi depuis plus de 6 mois.", "Succès total du sevrage. Said maintient son abstinence sans difficulté majeure.");

        PatientProfile p5 = createPatient("testaccsimo@gmail.com", "Mohamed", "Chraibi", LocalDate.of(1980, 5, 16), 25, PatientProfile.DependenceLevel.HIGH);
        assignPatientToDoctor(p5, doc1);
        seedPatientData(p5, 10, 15, 12, false, false, "Patient sous Bupropion, anxiété importante.", "Mohamed a du mal avec son anxiété. Le traitement Bupropion l'aide mais un suivi rapproché est nécessaire.");

        // 3. PATIENTS LIES AU DOC 2
        PatientProfile p6 = createPatient("pfinetude00@gmail.com", "Nadia", "Tazi", LocalDate.of(1975, 2, 10), 10, PatientProfile.DependenceLevel.LOW);
        assignPatientToDoctor(p6, doc2);
        seedPatientData(p6, 5, 4, 3, false, false, "Patiente en phase de stabilisation.", "Nadia gère bien ses envies avec des gommes occasionnelles.");

        PatientProfile p7 = createPatient("dsitabacpfe@gmail.com", "Hassan", "Naciri", LocalDate.of(1988, 9, 8), 25, PatientProfile.DependenceLevel.HIGH);
        assignPatientToDoctor(p7, doc2);
        seedPatientData(p7, 20, 12, 10, false, false, "Patient en début de sevrage, beaucoup de doutes.", "Hassan est motivé mais craint l'échec. Soutien cognitivo-comportemental recommandé.");

        PatientProfile p8 = createPatient("aymantantani11@gmail.com", "Fatima Zahra", "Amrani", LocalDate.of(1995, 12, 1), 15, PatientProfile.DependenceLevel.MODERATE);
        assignPatientToDoctor(p8, doc2);
        seedPatientData(p8, 0, 2, 2, false, true, "Sevrage réussi, fin de parcours.", "Fatima Zahra est fière de son parcours. Abstinence totale confirmée.");

        log.info("🎉 Massive demo data seeding complete!");
    }

    private DoctorProfile createDoctor(String email, String firstName, String lastName, String specialty, String city, int yearsExp) {
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode("password"));
            user.setFullName(firstName + " " + lastName);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            String baseUsername = firstName.toLowerCase() + "_" + lastName.toLowerCase();
            user.setCommunityUsername(baseUsername + "_" + random.nextInt(1000));
            user.setAccountEnabled(true);
            user.setIdentityVerified(true);
            user.setVerifiedBadge(true);
            user.setStatus(User.UserStatus.ACTIVE);
            user.setRoles(Set.of("ROLE_DOCTOR", "ROLE_USER"));
            user = userRepository.save(user);
        }

        DoctorProfile doc = doctorProfileRepository.findByUser(user).orElse(null);
        if (doc == null) {
            doc = new DoctorProfile();
            doc.setUser(user);
            doc.setSpecialty(specialty);
            doc.setCity(city);
            doc.setCountryCode("MA");
            doc.setYearsExperience(yearsExp);
            doc.setSuccessScore(85 + random.nextInt(15));
            doc.setBio("Spécialiste dévoué à l'accompagnement des patients. Approche personnalisée et bienveillante.");
            doc.setAcceptsTeleconsultation(true);
            doc.setActive(true);
            doc.setDocumentsVerified(true);
            doc = doctorProfileRepository.save(doc);
        }
        return doc;
    }

    private PatientProfile createPatient(String email, String firstName, String lastName, LocalDate dob, int cigsPerDay, PatientProfile.DependenceLevel dependence) {
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode("password"));
            user.setFullName(firstName + " " + lastName);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            String baseUsername = firstName.toLowerCase() + lastName.toLowerCase();
            user.setCommunityUsername(baseUsername + "_" + random.nextInt(10000));
            user.setAccountEnabled(true);
            user.setIdentityVerified(true);
            user.setStatus(User.UserStatus.ACTIVE);
            user.setRoles(Set.of("ROLE_PATIENT", "ROLE_USER"));
            user = userRepository.save(user);
        }

        PatientProfile patient = patientProfileRepository.findByUser(user).orElse(null);
        if (patient == null) {
            patient = new PatientProfile();
            patient.setUser(user);
            patient.setDateOfBirth(dob);
            patient.setSex(PatientProfile.Sex.MALE);
            patient.setHeightCm(170 + random.nextInt(20));
            patient.setWeightKg(65 + random.nextInt(30));
            patient.setCity("Rabat");
            patient.setCountryCode("MA");
            patient.setCigarettesPerDay(cigsPerDay);
            patient.setSmokingStartAge(16 + random.nextInt(5));
            patient.setDependenceLevel(dependence);
            patient.setOnboardingComplete(true);
            patient.setTestsComplete(true);
            patient.setJournalComplete(true);
            patient = patientProfileRepository.save(patient);
        }
        return patient;
    }

    private void assignPatientToDoctor(PatientProfile patient, DoctorProfile doctor) {
        DoctorPatientAssignment assignment = new DoctorPatientAssignment();
        assignment.setPatientProfile(patient);
        assignment.setDoctorProfile(doctor);
        assignment.setActive(true);
        assignmentRepository.save(assignment);
    }

    private void seedPatientData(PatientProfile patient, int currentCigs, int cravingLevel, int stressLevel, boolean hasRelapse, boolean isSuccess, String summary, String docNotes) {
        // Tests
        FagerstromTest fTest = new FagerstromTest();
        fTest.setPatientProfile(patient);
        fTest.setTimeToFirstCigarette(FagerstromRequest.TimeToFirstCigarette.WITHIN_5_MIN);
        fTest.setMostDifficultCigarette(FagerstromRequest.MostDifficultCigarette.FIRST_IN_MORNING);
        fTest.setCigarettesPerDay(FagerstromRequest.CigarettesPerDay.TWENTY_ONE_TO_THIRTY);
        fTest.setTotalScore(8);
        fTest.setDependenceLevel(FagerstromResult.DependenceLevel.HIGH);
        fagerstromTestRepository.save(fTest);

        HadTest hadTest = new HadTest();
        hadTest.setPatientProfile(patient);
        hadTest.setAnxietyScore(stressLevel);
        hadTest.setDepressionScore(cravingLevel);
        hadTest.setAnxietyInterpretation(HadResult.Interpretation.CERTAIN_SYMPTOMATOLOGY);
        hadTest.setDepressionInterpretation(HadResult.Interpretation.NORMAL);
        hadTestRepository.save(hadTest);

        patient.setFagerstromScore(8);
        patient.setHadAnxietyScore(stressLevel);
        patient.setHadDepressionScore(cravingLevel);
        patientProfileRepository.save(patient);

        // Daily Reports (30 days history)
        LocalDate startDate = LocalDate.now().minusDays(30);
        int patientCigs = patient.getCigarettesPerDay() != null ? patient.getCigarettesPerDay() : 20;
        int cigs = isSuccess ? 0 : patientCigs;
        for (int i = 0; i < 30; i++) {
            DailyReport report = new DailyReport();
            report.setPatientProfile(patient);
            report.setReportDate(startDate.plusDays(i));
            
            if (isSuccess) {
                report.setCigarettesSmoked(0);
                report.setCravingsIntensity(Math.max(0, 5 - i/6));
                report.setStressScore(Math.max(0, 4 - i/7));
            } else if (hasRelapse && i == 25) {
                report.setCigarettesSmoked(patientCigs);
                report.setRelapseEvent(true);
                report.setCravingsIntensity(10);
                report.setStressScore(10);
                cigs = patientCigs;
            } else {
                cigs = Math.max(currentCigs, cigs - (random.nextInt(3) == 0 ? 1 : 0));
                report.setCigarettesSmoked(cigs);
                report.setCravingsIntensity(Math.max(cravingLevel, 10 - i/3));
                report.setStressScore(Math.max(stressLevel, 8 - i/4));
            }
            
            report.setUsedNrt(true);
            report.setMoodScore(7);
            dailyReportRepository.save(report);
        }

        // Sevrage Plan
        SevragePlan plan = new SevragePlan();
        plan.setPatientProfile(patient);
        plan.setStartDate(startDate);
        plan.setTargetQuitDate(startDate.plusDays(15));
        plan.setIntensity(SevragePlan.PlanIntensity.INTENSIVE);
        plan.setSummary("Plan de sevrage avec réduction progressive par TSN.");
        plan.setNrtRecommendation("Utilisation de patchs 21mg/24h et gommes 2mg en cas de craving.");
        plan.setBehavioralRecommendations("Éviter les déclencheurs (café, stress), pratiquer la respiration profonde.");
        sevragePlanRepository.save(plan);

        // Consultations
        createConsultation(patient, startDate, ConsultationReport.ReportType.INITIAL_ASSESSMENT, 0, docNotes);
        if (isSuccess || hasRelapse) {
            createConsultation(patient, startDate.plusDays(10), ConsultationReport.ReportType.FOLLOW_UP, 1, "Suivi N°1: " + docNotes);
            createConsultation(patient, startDate.plusDays(20), ConsultationReport.ReportType.FOLLOW_UP, 2, "Suivi N°2: " + docNotes);
        }

        // AI Summary
        AiGlobalSummary aiSummary = new AiGlobalSummary();
        aiSummary.setPatientProfile(patient);
        aiSummary.setSummary("### Analyse Cognitive et Comportementale\n" + summary + "\n\n**Recommandation IA:** Maintenir le suivi régulier. Adapter le traitement selon les variations de l'anxiété.");
        aiSummary.setDoctorFocusPoints(List.of("Surveiller l'anxiété", "Ajuster les substituts nicotiniques"));
        aiSummary.setMissingInformation(List.of("Test sanguin récent", "Qualité du sommeil détaillée"));
        aiSummary.setPatientReadiness("Le patient montre une forte volonté de changement, évaluée à 8/10 par l'analyse sémantique.");
        aiSummary.setModelName("gemini-1.5-pro");
        aiGlobalSummaryRepository.save(aiSummary);
    }

    private void createConsultation(PatientProfile patient, LocalDate date, ConsultationReport.ReportType type, int followUpNumber, String notes) {
        Appointment apt = new Appointment();
        apt.setPatientProfile(patient);
        // On récupère temporairement n'importe quel médecin si la liaison est complexe, ou on passe le docteur en param
        // Pour simplifier, on trouve le médecin depuis l'assignation:
        DoctorPatientAssignment assignment = assignmentRepository.findAll().stream().filter(a -> a.getPatientProfile().getId().equals(patient.getId())).findFirst().orElse(null);
        if (assignment != null) {
            apt.setDoctorProfile(assignment.getDoctorProfile());
        }
        apt.setStartsAt(date.atTime(10, 0));
        apt.setStatus(Appointment.Status.COMPLETED);
        apt.setMeetingJoinUrl("https://meet.neuralconsult.local/demo");
        apt = appointmentRepository.save(apt);

        ConsultationReport report = new ConsultationReport();
        report.setAppointment(apt);
        report.setConsultationDate(date);
        report.setReportType(type);
        if (type == ConsultationReport.ReportType.FOLLOW_UP) {
            report.setFollowUpNumber(followUpNumber);
        }
        report.setObservations(notes);
        report.setTobaccoConsumptionDaily(patient.getCigarettesPerDay() != null ? patient.getCigarettesPerDay() : 20);
        report.setCoExpiredPpm(15);
        report.setPrescribedNrt(true);
        report.setNrtPatch(true);
        report.setNrtPatchDosage("21mg/24h");
        consultationReportRepository.save(report);
    }
}
