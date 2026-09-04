// ─── High-Fidelity Demo Mock Service for NeuralConsult ──────────
// Ensures 100% seamless, instant portfolio demonstration on Vercel & remote deployments
// even if the Spring Boot backend container is asleep or unreachable.

export const DEMO_USERS = {
  doctor: {
    id: "d0c70000-0000-0000-0000-000000000001",
    email: "ayman.tantani@uit.ac.ma",
    fullName: "Dr. Ayman Tantani",
    firstName: "Ayman",
    lastName: "Tantani",
    dateOfBirth: "1988-04-12",
    identityVerified: true,
    active: true,
    status: "ACTIVE",
    patientProfile: null,
    scores: null,
    profile: {
      id: "doc-prof-01",
      active: true,
      status: "APPROVED",
      fullName: "Dr. Ayman Tantani",
      email: "ayman.tantani@uit.ac.ma",
      specialty: "Tabacologue & Addictologue",
      rppsNumber: "10109876543",
      city: "Rabat",
      countryCode: "MA",
      yearsExperience: 12,
      experienceYears: 12,
      consultationPrice: 50,
      acceptsTeleconsultation: true,
      successScore: 98,
      bio: "Médecin spécialiste en tabacologie clinique et addictologie comportementale. Accompagnement bienveillant et protocoles validés HAS / OMS."
    },
    roles: ["ROLE_DOCTOR", "ROLE_USER"]
  },
  patient: {
    id: "p0c70000-0000-0000-0000-000000000001",
    email: "tantaniayman0@gmail.com",
    fullName: "Youssef El Fassi",
    firstName: "Youssef",
    lastName: "El Fassi",
    dateOfBirth: "1994-08-22",
    identityVerified: true,
    active: true,
    status: "ACTIVE",
    patientProfile: {
      id: "prof-001",
      dateOfBirth: "1994-08-22",
      sex: "MALE",
      city: "Rabat",
      countryCode: "MA",
      occupation: "Architecte Logiciel",
      cigarettesPerDay: 15,
      smokingStartAge: 18,
      onboardingComplete: true,
      testsComplete: true,
      journalComplete: true,
      dependenceLevel: "SEVRÉ (J+30)",
      packPrice: 38,
      smokeFreeStartDate: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
      fagerstromScore: 0,
      hadAnxietyScore: 2,
      hadDepressionScore: 1
    },
    profile: {
      id: "prof-001",
      dateOfBirth: "1994-08-22",
      sex: "MALE",
      city: "Rabat",
      countryCode: "MA",
      occupation: "Architecte Logiciel",
      cigarettesPerDay: 15,
      smokingStartAge: 18,
      onboardingComplete: true,
      testsComplete: true,
      journalComplete: true,
      dependenceLevel: "SEVRÉ (J+30)",
      fagerstromScore: 0,
      hadAnxietyScore: 2,
      hadDepressionScore: 1
    },
    scores: {
      fagerstrom: 0,
      hadAnxiety: 2,
      hadDepression: 1,
      fagerstromScore: 0,
      hadAnxietyScore: 2,
      hadDepressionScore: 1
    },
    roles: ["ROLE_PATIENT", "ROLE_USER"]
  }
};

export const getDemoUserByEmail = (email) => {
  if (!email) return null;
  const clean = email.toLowerCase().trim();
  if (clean === "ayman.tantani@uit.ac.ma" || clean.includes("dr_tantani") || clean.includes("doctor")) {
    return DEMO_USERS.doctor;
  }
  if (clean === "tantaniayman0@gmail.com" || clean.includes("samy_zen") || clean.includes("patient")) {
    return DEMO_USERS.patient;
  }
  return null;
};

// Generate 35 days of realistic daily journal data
export const generateDemoDailyReports = () => {
  const reports = [];
  const now = Date.now();
  for (let i = 35; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    const cigs = i > 30 ? Math.max(0, 15 - (35 - i) * 3) : 0;
    const craving = Math.max(1, Math.min(10, Math.round(8 - (35 - i) * 0.2 + (Math.sin(i) * 1.2))));
    const stress = Math.max(1, Math.min(10, Math.round(7 - (35 - i) * 0.15 + (Math.cos(i) * 1))));
    const mood = Math.min(10, Math.max(2, Math.round(5 + (35 - i) * 0.12)));
    
    reports.push({
      id: `report-${i}`,
      reportDate: dateStr,
      date: dateStr,
      cigarettesSmoked: cigs,
      cravingsIntensity: craving,
      cravingIntensity: craving,
      stressScore: stress,
      stressLevel: stress,
      moodScore: mood,
      moodLevel: mood,
      mood: "Serein & Déterminé",
      withdrawalSymptoms: i > 25 ? "Légère irritabilité matinale" : "Aucun",
      triggers: i > 25 ? "Pause café" : "Aucun déclencheur",
      usedNrt: true,
      relapseEvent: false,
      notes: i === 0 ? "Journée formidable, souffle très dégagé après ma séance de sport !" : "Suivi régulier du plan.",
      createdAt: d.toISOString()
    });
  }
  return reports;
};

// Generate historical Fagerström & HAD tests
export const generateDemoTests = () => {
  const fagerstrom = [
    { id: "fag-1", totalScore: 7, score: 7, dependenceLevel: "DÉPENDANCE FORTE", level: "DÉPENDANCE FORTE", createdAt: new Date(Date.now() - 35 * 86400000).toISOString() },
    { id: "fag-2", totalScore: 5, score: 5, dependenceLevel: "DÉPENDANCE MOYENNE", level: "DÉPENDANCE MOYENNE", createdAt: new Date(Date.now() - 28 * 86400000).toISOString() },
    { id: "fag-3", totalScore: 3, score: 3, dependenceLevel: "DÉPENDANCE FAIBLE", level: "DÉPENDANCE FAIBLE", createdAt: new Date(Date.now() - 21 * 86400000).toISOString() },
    { id: "fag-4", totalScore: 1, score: 1, dependenceLevel: "TRÈS FAIBLE", level: "TRÈS FAIBLE", createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
    { id: "fag-5", totalScore: 0, score: 0, dependenceLevel: "NON DÉPENDANT", level: "NON DÉPENDANT", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() }
  ];

  const had = [
    { id: "had-1", anxietyScore: 11, depressionScore: 7, anxietyInterpretation: "SYMPTOMATOLOGIE AVERÉE", depressionInterpretation: "DOUTEUSE", createdAt: new Date(Date.now() - 35 * 86400000).toISOString() },
    { id: "had-2", anxietyScore: 8, depressionScore: 5, anxietyInterpretation: "DOUTEUSE", depressionInterpretation: "NORMAL", createdAt: new Date(Date.now() - 28 * 86400000).toISOString() },
    { id: "had-3", anxietyScore: 6, depressionScore: 4, anxietyInterpretation: "NORMAL", depressionInterpretation: "NORMAL", createdAt: new Date(Date.now() - 21 * 86400000).toISOString() },
    { id: "had-4", anxietyScore: 3, depressionScore: 2, anxietyInterpretation: "NORMAL", depressionInterpretation: "NORMAL", createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
    { id: "had-5", anxietyScore: 1, depressionScore: 1, anxietyInterpretation: "NORMAL", depressionInterpretation: "NORMAL", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() }
  ];

  return { fagerstrom, had };
};

// Demo Sevrage Plan
export const DEMO_SEVRAGE_PLAN = {
  id: "plan-demo-001",
  title: "Protocole Sevrage Combiné (TSN + TCC)",
  intensity: "MODERATE",
  summary: "Plan de sevrage progressif personnalisé avec substitution nicotinique combinée (patch 21mg + gommes 2mg) et soutien TCC comportemental.",
  nrtRecommendation: "Patch transdermique 21mg/24h le matin au réveil + gommes 2mg en cas de craving aigu (max 8/jour).",
  behavioralRecommendations: "Cohérence cardiaque 4-7-8 avant chaque café matinal, verre d'eau fraîche réflexe lors des envies, marche active quotidienne 20 minutes.",
  followUpPlan: "Téléconsultation de contrôle tous les 15 jours avec mesure du CO expiré et ajustement des paliers.",
  relapseProtocol: "En cas de tentation ou faux-pas, activer le bouton SOS Envie dans l'application et contacter le Dr. Tantani.",
  startDate: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
  targetQuitDate: new Date(Date.now() - 20 * 86400000).toISOString().split("T")[0],
  active: true,
  steps: [
    "Étape 1 : Cartographie des déclencheurs et préparation du domicile sans tabac",
    "Étape 2 : Pose du premier patch 21mg et démarrage du journal quotidien",
    "Étape 3 : Passage réussi du cap des 7 premiers jours sans aucune cigarette",
    "Étape 4 : Déconditionnement du rituel café-tabac avec les substituts oraux",
    "Étape 5 : Consolidation de l'abstinence et stabilisation du souffle"
  ]
};

// Demo Patients for Doctor Workspace (with all fields mapped for tables and modals)
export const DEMO_DOCTOR_PATIENTS = [
  {
    id: "p0c70000-0000-0000-0000-000000000001",
    patientProfileId: "p0c70000-0000-0000-0000-000000000001",
    patientName: "Youssef El Fassi",
    name: "Youssef El Fassi",
    patientEmail: "tantaniayman0@gmail.com",
    email: "tantaniayman0@gmail.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    dateOfBirth: "1994-08-22",
    age: 32,
    city: "Rabat",
    occupation: "Architecte Logiciel",
    status: "SUCCÈS STABLE (J+30)",
    statusType: "success",
    daysSmokeFree: 30,
    cigarettesPerDayBefore: 15,
    currentCigarettes: 0,
    fagerstromScore: 0,
    hadAnxietyScore: 2,
    hadDepressionScore: 1,
    dependenceLevel: "SEVRÉ (J+30)",
    onboardingComplete: true,
    testsComplete: true,
    journalComplete: true,
    riskLevel: "FAIBLE",
    lastReportDate: "Aujourd'hui",
    aiSummary: "Patient très observant avec excellente adhésion au patch 14mg. Craving résiduel quasi nul. Félicitations pour le premier mois validé !",
    treatment: "Patch Nicopatch 14mg/24h + Pastilles 2mg au besoin"
  },
  {
    id: "pat-002",
    patientProfileId: "pat-002",
    patientName: "Karim Bennani",
    name: "Karim Bennani",
    patientEmail: "karim.bennani@demo.ma",
    email: "karim.bennani@demo.ma",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    dateOfBirth: "1984-03-15",
    age: 42,
    city: "Casablanca",
    occupation: "Cadre Financier",
    status: "RISQUE DE RECHUTE",
    statusType: "warning",
    daysSmokeFree: 4,
    cigarettesPerDayBefore: 25,
    currentCigarettes: 2,
    fagerstromScore: 6,
    hadAnxietyScore: 9,
    hadDepressionScore: 4,
    dependenceLevel: "FORTE DÉPENDANCE",
    onboardingComplete: true,
    testsComplete: true,
    journalComplete: true,
    riskLevel: "ÉLEVÉ",
    lastReportDate: "Hier 22h",
    aiSummary: "Pic d'anxiété professionnelle rapporté. Faux-pas de 2 cigarettes hier soir. Recommandation : adapter le dosage de nicotine et planifier une téléconsultation.",
    treatment: "Patch Nicorette 21mg/24h + Spray buccal"
  },
  {
    id: "pat-003",
    patientProfileId: "pat-003",
    patientName: "Fatima Zahra Mansouri",
    name: "Fatima Zahra Mansouri",
    patientEmail: "fatima.mansouri@demo.ma",
    email: "fatima.mansouri@demo.ma",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    dateOfBirth: "1998-11-04",
    age: 28,
    city: "Marrakech",
    occupation: "Enseignante",
    status: "EN PROGRESSION (J+14)",
    statusType: "primary",
    daysSmokeFree: 14,
    cigarettesPerDayBefore: 12,
    currentCigarettes: 0,
    fagerstromScore: 2,
    hadAnxietyScore: 4,
    hadDepressionScore: 2,
    dependenceLevel: "DÉPENDANCE FAIBLE",
    onboardingComplete: true,
    testsComplete: true,
    journalComplete: true,
    riskLevel: "MODÉRÉ",
    lastReportDate: "Aujourd'hui",
    aiSummary: "Évolution favorable. Pratique régulière de la cohérence cardiaque. Légers troubles du sommeil à surveiller.",
    treatment: "Gommes à mâcher 4mg"
  },
  {
    id: "pat-004",
    patientProfileId: "pat-004",
    patientName: "Mehdi Alami",
    name: "Mehdi Alami",
    patientEmail: "mehdi.alami@demo.ma",
    email: "mehdi.alami@demo.ma",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    dateOfBirth: "1990-06-19",
    age: 36,
    city: "Tanger",
    occupation: "Ingénieur Logistique",
    status: "ANXIÉTÉ SÉVÈRE",
    statusType: "danger",
    daysSmokeFree: 2,
    cigarettesPerDayBefore: 20,
    currentCigarettes: 4,
    fagerstromScore: 7,
    hadAnxietyScore: 12,
    hadDepressionScore: 6,
    dependenceLevel: "DÉPENDANCE SÉVÈRE",
    onboardingComplete: true,
    testsComplete: true,
    journalComplete: true,
    riskLevel: "CRITIQUE",
    lastReportDate: "Aujourd'hui 08h",
    aiSummary: "Score HAD anxiété au plafond (12/21). Besoin d'un renforcement du soutien psychologique TCC d'urgence.",
    treatment: "Patch 21mg + Thérapie TCC active"
  },
  {
    id: "pat-005",
    patientProfileId: "pat-005",
    patientName: "Hajj Said Tazi",
    name: "Hajj Said Tazi",
    patientEmail: "said.tazi@demo.ma",
    email: "said.tazi@demo.ma",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    dateOfBirth: "1968-01-30",
    age: 58,
    city: "Fès",
    occupation: "Commerçant",
    status: "SUIVI SENIOR (J+60)",
    statusType: "success",
    daysSmokeFree: 60,
    cigarettesPerDayBefore: 30,
    currentCigarettes: 0,
    fagerstromScore: 0,
    hadAnxietyScore: 1,
    hadDepressionScore: 1,
    dependenceLevel: "SEVRÉ CONSOLIDÉ",
    onboardingComplete: true,
    testsComplete: true,
    journalComplete: true,
    riskLevel: "FAIBLE",
    lastReportDate: "Il y a 2 jours",
    aiSummary: "Sevrage consolidé. Amélioration respiratoire majeure (+35% de capacité spirométrique). Diminution du palier nicotinique en cours.",
    treatment: "Patch 7mg (sevrage final)"
  }
];

// Helper to create a complete clinical dossier for Doctor Workspace
export const createDemoDossier = (patientProfileId) => {
  const patient = DEMO_DOCTOR_PATIENTS.find(p => p.patientProfileId === patientProfileId) || DEMO_DOCTOR_PATIENTS[0];
  const tests = generateDemoTests();

  return {
    patientProfileId: patient.patientProfileId,
    patientName: patient.patientName,
    patientEmail: patient.patientEmail,
    profile: {
      id: patient.patientProfileId,
      dateOfBirth: patient.dateOfBirth,
      sex: "MALE",
      heightCm: 180,
      weightKg: 75,
      city: patient.city,
      countryCode: "MA",
      occupation: patient.occupation,
      cigarettesPerDay: patient.cigarettesPerDayBefore,
      smokingStartAge: 19,
      dependenceLevel: patient.dependenceLevel,
      onboardingComplete: true,
      testsComplete: true,
      journalComplete: true,
      medicalHistoryNotes: "Patient motivé. Aucun antécédent cardio-vasculaire majeur. Bonne réponse aux thérapies de substitution.",
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString()
    },
    assessment: {
      educationLevel: "Bac+5 / Master",
      consultationObjective: "Arrêt complet définitif du tabac",
      otherSmokersAtHome: false,
      riskHypertension: false,
      riskDiabetes: false
    },
    latestFagerstrom: {
      totalScore: patient.fagerstromScore,
      dependenceLevel: patient.fagerstromScore > 5 ? "DÉPENDANCE FORTE" : patient.fagerstromScore > 2 ? "DÉPENDANCE MOYENNE" : "NON DÉPENDANT"
    },
    latestHad: {
      anxietyScore: patient.hadAnxietyScore,
      depressionScore: patient.hadDepressionScore,
      anxietyInterpretation: patient.hadAnxietyScore > 10 ? "SYMPTOMATOLOGIE SÉVÈRE" : patient.hadAnxietyScore > 7 ? "DOUTEUSE" : "NORMAL",
      depressionInterpretation: patient.hadDepressionScore > 7 ? "DOUTEUSE" : "NORMAL"
    },
    fagerstromHistory: tests.fagerstrom,
    hadHistory: tests.had,
    dailyReports: generateDemoDailyReports(),
    validatedPlan: DEMO_SEVRAGE_PLAN,
    sevragePlans: [DEMO_SEVRAGE_PLAN],
    clinicalNote: {
      medicalSummary: "Le patient suit rigoureusement le protocole combiné. Disparition progressive des envies réflexes du matin. Suivi très encourageant."
    },
    clinicalIntelligence: {
      globalSummary: {
        summary: "Synthèse IA Clinique : Trajectoire très positive. Baisse de 100% de la consommation de cigarettes manufacturées depuis J+1. Marqueurs d'anxiété en nette régression."
      },
      phaseSummaries: [
        { id: "ph-1", phaseId: 1, phaseTitle: "Bilan Initial & Dépendance", summary: "Dépendance nicotinique évaluée et protocole TNS validé.", attentionPoints: ["Surveillance du sommeil à J+3"] },
        { id: "ph-2", phaseId: 2, phaseTitle: "Phase Aiguë (J1-J7)", summary: "Cap des 7 jours passé avec succès grâce aux gommes 2mg.", attentionPoints: ["Gestion du stress professionnel"] },
        { id: "ph-3", phaseId: 3, phaseTitle: "Stabilisation (J8-J30)", summary: "Capacité respiratoire restaurée de 20%. Absence totale de rechute.", attentionPoints: ["Maintien de la cohérence cardiaque"] }
      ]
    },
    supportConversation: {
      latestRiskLevel: patient.riskLevel,
      latestSummary: patient.aiSummary,
      messages: [
        { id: "msg-1", senderType: "PATIENT", content: "Bonjour, j'ai parfois un léger craving après le repas du midi. Que me conseillez-vous ?", createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
        { id: "msg-2", senderType: "AI", content: "Bonjour ! C'est un déclencheur classique lié au rituel post-prandial. Prenez une gomme 2mg immédiatement après le repas, buvez un grand verre d'eau fraîche et faites 2 minutes de cohérence cardiaque 4-7-8.", createdAt: new Date(Date.now() - 3600000 * 4.9).toISOString() },
        { id: "msg-3", senderType: "PATIENT", content: "Merci beaucoup, la respiration m'a fait énormément de bien, l'envie est passée !", createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
        { id: "msg-4", senderType: "AI", content: "Bravo Youssef ! Chaque vague surmontée renforce votre cerveau contre la nicotine. Continuez comme cela !", createdAt: new Date(Date.now() - 3600000 * 3.9).toISOString() }
      ]
    },
    supportAlerts: [
      { id: "alt-1", alertType: "CRAVING", summary: "Craving post-prandial surmonté par le patient", level: patient.riskLevel, createdAt: new Date(Date.now() - 3600000 * 4).toISOString() }
    ]
  };
};

// Demo Appointments (in-memory state)
export let DEMO_APPOINTMENTS = [
  {
    id: "apt-demo-01",
    startsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    durationMinutes: 30,
    status: "CONFIRMED",
    reason: "Consultation de suivi M+1 : Bilan biologique, contrôle du monoxyde de carbone et consolidation du sevrage.",
    doctorName: "Dr. Ayman Tantani",
    doctorSpecialty: "Tabacologue & Médecin Référent",
    patientName: "Youssef El Fassi",
    patientProfileId: "p0c70000-0000-0000-0000-000000000001",
    meetingProvider: "JITSI",
    meetingRoomName: "NeuralConsult-Sevrage-Suivi-Youssef-Tantani",
    meetingJoinUrl: "https://meet.jit.si/NeuralConsult-Sevrage-Suivi-Youssef-Tantani",
    triggeredByAiAlert: false
  }
];

// Demo Alerts for Doctor Support
export const DEMO_SUPPORT_ALERTS = [
  {
    id: "alt-101",
    patientProfileId: "pat-002",
    patientName: "Karim Bennani",
    level: "HIGH",
    summary: "Faux-pas de 2 cigarettes après pic de stress. Demande d'ajustement du patch.",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "OPEN"
  },
  {
    id: "alt-102",
    patientProfileId: "pat-004",
    patientName: "Mehdi Alami",
    level: "CRITICAL",
    summary: "Score HAD Anxiété à 12/21. Besoin d'un entretien de soutien prioritaire.",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    status: "OPEN"
  },
  {
    id: "alt-103",
    patientProfileId: "p0c70000-0000-0000-0000-000000000001",
    patientName: "Youssef El Fassi",
    level: "LOW",
    summary: "Bilan J+30 validé avec succès. Félicitations envoyées par l'assistant.",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: "RESOLVED"
  }
];

// Mock handler for api.js (Supports GET, POST, PUT, DELETE)
export const handleDemoMockRequest = (url, method = "GET", payload = null) => {
  const activeDemoEmail = typeof window !== "undefined" ? localStorage.getItem("nc_active_demo_email") : null;
  const isDoctor = activeDemoEmail === "ayman.tantani@uit.ac.ma";
  const upperMethod = (method || "GET").toUpperCase();

  // ─── MUTATIONS (POST / PUT / DELETE) ───
  if (upperMethod !== "GET") {
    // 1. Appointments decisions (complete / confirm / refuse / cancel)
    if (url.includes("/api/appointments/")) {
      const parts = url.split("/");
      const action = parts[parts.length - 1];
      const appointmentId = parts[parts.length - 2];

      if (action === "complete") {
        DEMO_APPOINTMENTS = DEMO_APPOINTMENTS.map(a => a.id === appointmentId ? { ...a, status: "COMPLETED" } : a);
        return { success: true, message: "Rendez-vous marqué comme terminé." };
      }
      if (action === "confirm") {
        DEMO_APPOINTMENTS = DEMO_APPOINTMENTS.map(a => a.id === appointmentId ? { ...a, status: "CONFIRMED" } : a);
        return { success: true, message: "Rendez-vous confirmé." };
      }
      if (action === "refuse" || action.includes("cancel")) {
        DEMO_APPOINTMENTS = DEMO_APPOINTMENTS.map(a => a.id === appointmentId ? { ...a, status: "CANCELLED" } : a);
        return { success: true, message: "Rendez-vous annulé." };
      }
    }

    // 2. Urgent appointment creation
    if (url.includes("/api/appointments/doctor/urgent")) {
      const patientId = payload?.patientProfileId || "p0c70000-0000-0000-0000-000000000001";
      const patient = DEMO_DOCTOR_PATIENTS.find(p => p.patientProfileId === patientId) || DEMO_DOCTOR_PATIENTS[0];
      const newApt = {
        id: `apt-urgent-${Date.now()}`,
        startsAt: payload?.startsAt || new Date(Date.now() + 3600000 * 2).toISOString(),
        durationMinutes: 30,
        status: "CONFIRMED",
        reason: payload?.reason || "Consultation urgente prioritaire programmée par le Dr. Tantani.",
        doctorName: "Dr. Ayman Tantani",
        doctorSpecialty: "Tabacologue & Médecin Référent",
        patientName: patient.patientName,
        patientProfileId: patient.patientProfileId,
        meetingProvider: "JITSI",
        meetingRoomName: `NeuralConsult-Urgent-${Date.now()}`,
        meetingJoinUrl: `https://meet.jit.si/NeuralConsult-Urgent-${Date.now()}`,
        triggeredByAiAlert: !!payload?.triggeredByAiAlert
      };
      DEMO_APPOINTMENTS.unshift(newApt);
      return newApt;
    }

    // 3. AI Support Chat Message sending
    if (url.includes("/api/support/current/messages") || url.includes("/api/support/doctor/patients")) {
      const userMessage = payload?.message || "Conseil clinique";
      const aiReply = isDoctor
        ? `Consigne médicale enregistrée : « ${userMessage} ». L'assistant IA intègre cette directive au protocole du patient.`
        : `Je vous entends parfaitement. Vous avez déjà accompli 30 jours sans tabac : cette envie est temporaire et va disparaître dans 3 minutes. Prenez 3 inspirations lentes en cohérence cardiaque 4-7-8. Je reste à vos côtés !`;

      return {
        id: "conv-live",
        patientName: "Youssef El Fassi",
        latestRiskLevel: "FAIBLE",
        latestSummary: "Accompagnement continu actif",
        messages: [
          { id: `msg-${Date.now() - 100}`, senderType: isDoctor ? "DOCTOR" : "PATIENT", content: userMessage, createdAt: new Date().toISOString() },
          { id: `msg-${Date.now()}`, senderType: "AI", content: aiReply, createdAt: new Date().toISOString() }
        ]
      };
    }

    // 4. Fallback for any other POST/PUT/DELETE
    return { success: true, message: "Enregistrement effectué avec succès (Mode Démo Portfolio)." };
  }

  // ─── QUERIES (GET) ───
  if (url.includes("/api/me")) {
    return isDoctor ? DEMO_USERS.doctor : DEMO_USERS.patient;
  }
  if (url.includes("/api/doctors/profile/me")) {
    return {
      id: "doc-prof-01",
      active: true, // Activated by default: removes pending admin validation alert
      status: "APPROVED",
      accountStatus: "ACTIVE",
      user: DEMO_USERS.doctor,
      fullName: "Dr. Ayman Tantani",
      email: "ayman.tantani@uit.ac.ma",
      specialty: "Tabacologue & Addictologue",
      rppsNumber: "10109876543",
      city: "Rabat",
      countryCode: "MA",
      yearsExperience: 12,
      experienceYears: 12,
      consultationPrice: 50,
      acceptsTeleconsultation: true,
      successScore: 98,
      bio: "Médecin spécialiste en tabacologie clinique et addictologie comportementale. Accompagnement bienveillant et protocoles validés HAS / OMS."
    };
  }
  if (url.includes("/dossier")) {
    // Extract patientProfileId if present in URL
    const match = url.match(/patients\/([^/]+)\/dossier/);
    const patientId = match ? match[1] : "p0c70000-0000-0000-0000-000000000001";
    return createDemoDossier(patientId);
  }
  if (url.includes("/api/doctors/patients") || url.includes("/api/doctor/patients")) {
    return DEMO_DOCTOR_PATIENTS;
  }
  if (url.includes("/api/doctors/requests/doctor")) {
    return [];
  }
  if (url.includes("/api/support/doctor/alerts")) {
    return DEMO_SUPPORT_ALERTS;
  }
  if (url.includes("/api/support/doctor/patients/")) {
    const match = url.match(/patients\/([^/]+)/);
    const patientId = match ? match[1] : "p0c70000-0000-0000-0000-000000000001";
    return createDemoDossier(patientId).supportConversation;
  }
  if (url.includes("/api/support/current")) {
    return createDemoDossier("p0c70000-0000-0000-0000-000000000001").supportConversation;
  }
  if (url.includes("/api/sevrage-plan/current") || url.includes("/api/sevrage-plan")) {
    return DEMO_SEVRAGE_PLAN;
  }
  if (url.includes("/api/daily-reports")) {
    return generateDemoDailyReports();
  }
  if (url.includes("/api/tests/had")) {
    return generateDemoTests().had;
  }
  if (url.includes("/api/tests/fagerstrom")) {
    return generateDemoTests().fagerstrom;
  }
  if (url.includes("/api/appointments/doctor") || url.includes("/api/appointments/patient") || url.includes("/api/appointments")) {
    return DEMO_APPOINTMENTS;
  }
  if (url.includes("/api/doctors/association/patient")) {
    return {
      doctorProfileId: "doc-prof-01",
      doctorName: "Dr. Ayman Tantani",
      specialty: "Tabacologue & Addictologue",
      city: "Rabat",
      countryCode: "MA",
      acceptsTeleconsultation: true,
      yearsExperience: 12,
      assignedAt: new Date(Date.now() - 30 * 86400000).toISOString()
    };
  }
  if (url.includes("/api/doctors")) {
    return [
      {
        id: "doc-01",
        doctorProfileId: "doc-01",
        user: DEMO_USERS.doctor,
        doctorName: "Dr. Ayman Tantani",
        specialty: "Tabacologue & Addictologue",
        city: "Rabat",
        yearsExperience: 12,
        consultationPrice: 50,
        acceptsTeleconsultation: true
      },
      {
        id: "doc-02",
        doctorProfileId: "doc-02",
        user: { fullName: "Dr. Sarah Lahlou", email: "dr.lahlou@neural.ma" },
        doctorName: "Dr. Sarah Lahlou",
        specialty: "Pneumologue & Tabacologue",
        city: "Casablanca",
        yearsExperience: 15,
        consultationPrice: 50,
        acceptsTeleconsultation: true
      }
    ];
  }
  if (url.includes("/api/notifications")) {
    return [
      { id: "notif-1", title: "Rappel Téléconsultation", content: "Consultation de suivi avec le Dr. Tantani programmée.", status: "UNREAD", createdAt: new Date().toISOString() }
    ];
  }
  if (url.includes("/api/onboarding")) {
    return {
      assessment: {
        educationLevel: "Bac+5 / Master",
        consultationObjective: "Arrêt complet définitif du tabac",
        weeklyTobaccoSpend: 250,
        manufacturedCigarettesPerDay: 15
      }
    };
  }
  if (url.includes("/api/clinical-notes")) {
    return { medicalSummary: "Patient très motivé avec sevrage consolidé à J+30." };
  }
  return null;
};
