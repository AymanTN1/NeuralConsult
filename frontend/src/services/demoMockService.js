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
    isDemo: true,
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
  patient1: {
    id: "p0c70000-0000-0000-0000-000000000001",
    email: "tantaniayman0@gmail.com",
    fullName: "Youssef El Fassi",
    firstName: "Youssef",
    lastName: "El Fassi",
    dateOfBirth: "1994-08-22",
    identityVerified: true,
    active: true,
    status: "ACTIVE",
    isDemo: true,
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
  },
  patient2: {
    id: "p0c70000-0000-0000-0000-000000000002",
    email: "aymantantani18@gmail.com",
    fullName: "Karim Benali",
    firstName: "Karim",
    lastName: "Benali",
    dateOfBirth: "1984-03-15",
    identityVerified: true,
    active: true,
    status: "ACTIVE",
    isDemo: true,
    patientProfile: {
      id: "prof-002",
      dateOfBirth: "1984-03-15",
      sex: "MALE",
      city: "Casablanca",
      countryCode: "MA",
      occupation: "Cadre Financier",
      cigarettesPerDay: 25,
      smokingStartAge: 17,
      onboardingComplete: true,
      testsComplete: true,
      journalComplete: true,
      dependenceLevel: "FORTE DÉPENDANCE",
      packPrice: 42,
      smokeFreeStartDate: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0],
      fagerstromScore: 6,
      hadAnxietyScore: 9,
      hadDepressionScore: 4
    },
    profile: {
      id: "prof-002",
      dateOfBirth: "1984-03-15",
      sex: "MALE",
      city: "Casablanca",
      countryCode: "MA",
      occupation: "Cadre Financier",
      cigarettesPerDay: 25,
      smokingStartAge: 17,
      onboardingComplete: true,
      testsComplete: true,
      journalComplete: true,
      dependenceLevel: "FORTE DÉPENDANCE",
      fagerstromScore: 6,
      hadAnxietyScore: 9,
      hadDepressionScore: 4
    },
    scores: {
      fagerstrom: 6,
      hadAnxiety: 9,
      hadDepression: 4,
      fagerstromScore: 6,
      hadAnxietyScore: 9,
      hadDepressionScore: 4
    },
    roles: ["ROLE_PATIENT", "ROLE_USER"]
  },
  patient3: {
    id: "p0c70000-0000-0000-0000-000000000003",
    email: "projetfinetude4@gmail.com",
    fullName: "Sara Mansour",
    firstName: "Sara",
    lastName: "Mansour",
    dateOfBirth: "1998-11-04",
    identityVerified: true,
    active: true,
    status: "ACTIVE",
    isDemo: true,
    patientProfile: {
      id: "prof-003",
      dateOfBirth: "1998-11-04",
      sex: "FEMALE",
      city: "Marrakech",
      countryCode: "MA",
      occupation: "Enseignante",
      cigarettesPerDay: 12,
      smokingStartAge: 20,
      onboardingComplete: true,
      testsComplete: true,
      journalComplete: true,
      dependenceLevel: "DÉPENDANCE FAIBLE",
      packPrice: 35,
      smokeFreeStartDate: new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0],
      fagerstromScore: 2,
      hadAnxietyScore: 4,
      hadDepressionScore: 2
    },
    profile: {
      id: "prof-003",
      dateOfBirth: "1998-11-04",
      sex: "FEMALE",
      city: "Marrakech",
      countryCode: "MA",
      occupation: "Enseignante",
      cigarettesPerDay: 12,
      smokingStartAge: 20,
      onboardingComplete: true,
      testsComplete: true,
      journalComplete: true,
      dependenceLevel: "DÉPENDANCE FAIBLE",
      fagerstromScore: 2,
      hadAnxietyScore: 4,
      hadDepressionScore: 2
    },
    scores: {
      fagerstrom: 2,
      hadAnxiety: 4,
      hadDepression: 2,
      fagerstromScore: 2,
      hadAnxietyScore: 4,
      hadDepressionScore: 2
    },
    roles: ["ROLE_PATIENT", "ROLE_USER"]
  },
  patient4: {
    id: "p0c70000-0000-0000-0000-000000000004",
    email: "saidpa1969@gmail.com",
    fullName: "Said Alaoui",
    firstName: "Said",
    lastName: "Alaoui",
    dateOfBirth: "1968-01-30",
    identityVerified: true,
    active: true,
    status: "ACTIVE",
    isDemo: true,
    patientProfile: {
      id: "prof-004",
      dateOfBirth: "1968-01-30",
      sex: "MALE",
      city: "Fès",
      countryCode: "MA",
      occupation: "Commerçant",
      cigarettesPerDay: 30,
      smokingStartAge: 16,
      onboardingComplete: true,
      testsComplete: true,
      journalComplete: true,
      dependenceLevel: "SEVRÉ CONSOLIDÉ",
      packPrice: 38,
      smokeFreeStartDate: new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0],
      fagerstromScore: 0,
      hadAnxietyScore: 1,
      hadDepressionScore: 1
    },
    profile: {
      id: "prof-004",
      dateOfBirth: "1968-01-30",
      sex: "MALE",
      city: "Fès",
      countryCode: "MA",
      occupation: "Commerçant",
      cigarettesPerDay: 30,
      smokingStartAge: 16,
      onboardingComplete: true,
      testsComplete: true,
      journalComplete: true,
      dependenceLevel: "SEVRÉ CONSOLIDÉ",
      fagerstromScore: 0,
      hadAnxietyScore: 1,
      hadDepressionScore: 1
    },
    scores: {
      fagerstrom: 0,
      hadAnxiety: 1,
      hadDepression: 1,
      fagerstromScore: 0,
      hadAnxietyScore: 1,
      hadDepressionScore: 1
    },
    roles: ["ROLE_PATIENT", "ROLE_USER"]
  },
  patient5: {
    id: "p0c70000-0000-0000-0000-000000000005",
    email: "testaccsimo@gmail.com",
    fullName: "Mohamed Chraibi",
    firstName: "Mohamed",
    lastName: "Chraibi",
    dateOfBirth: "1990-06-19",
    identityVerified: true,
    active: true,
    status: "ACTIVE",
    isDemo: true,
    patientProfile: {
      id: "prof-005",
      dateOfBirth: "1990-06-19",
      sex: "MALE",
      city: "Tanger",
      countryCode: "MA",
      occupation: "Ingénieur Logistique",
      cigarettesPerDay: 20,
      smokingStartAge: 18,
      onboardingComplete: true,
      testsComplete: true,
      journalComplete: true,
      dependenceLevel: "DÉPENDANCE SÉVÈRE",
      packPrice: 40,
      smokeFreeStartDate: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
      fagerstromScore: 7,
      hadAnxietyScore: 12,
      hadDepressionScore: 6
    },
    profile: {
      id: "prof-005",
      dateOfBirth: "1990-06-19",
      sex: "MALE",
      city: "Tanger",
      countryCode: "MA",
      occupation: "Ingénieur Logistique",
      cigarettesPerDay: 20,
      smokingStartAge: 18,
      onboardingComplete: true,
      testsComplete: true,
      journalComplete: true,
      dependenceLevel: "DÉPENDANCE SÉVÈRE",
      fagerstromScore: 7,
      hadAnxietyScore: 12,
      hadDepressionScore: 6
    },
    scores: {
      fagerstrom: 7,
      hadAnxiety: 12,
      hadDepression: 6,
      fagerstromScore: 7,
      hadAnxietyScore: 12,
      hadDepressionScore: 6
    },
    roles: ["ROLE_PATIENT", "ROLE_USER"]
  }
};

// Aliases for backwards compatibility
DEMO_USERS.patient = DEMO_USERS.patient1;

export const getDemoUserByEmail = (email) => {
  if (!email) return null;
  const clean = email.toLowerCase().trim();
  if (clean === "ayman.tantani@uit.ac.ma" || clean.includes("dr_tantani") || clean.includes("doctor")) {
    return DEMO_USERS.doctor;
  }
  if (clean === "tantaniayman0@gmail.com" || clean.includes("samy_zen") || clean === "patient@demo.ma") {
    return DEMO_USERS.patient1;
  }
  if (clean === "aymantantani18@gmail.com" || clean.includes("karim") || clean.includes("bennani")) {
    return DEMO_USERS.patient2;
  }
  if (clean === "projetfinetude4@gmail.com" || clean.includes("sara") || clean.includes("mansour")) {
    return DEMO_USERS.patient3;
  }
  if (clean === "saidpa1969@gmail.com" || clean.includes("said") || clean.includes("alaoui") || clean.includes("tazi")) {
    return DEMO_USERS.patient4;
  }
  if (clean === "testaccsimo@gmail.com" || clean.includes("mohamed") || clean.includes("chraibi") || clean.includes("alami")) {
    return DEMO_USERS.patient5;
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
    fullName: "Youssef El Fassi",
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
    id: "p0c70000-0000-0000-0000-000000000002",
    patientProfileId: "p0c70000-0000-0000-0000-000000000002",
    patientName: "Karim Benali",
    name: "Karim Benali",
    fullName: "Karim Benali",
    patientEmail: "aymantantani18@gmail.com",
    email: "aymantantani18@gmail.com",
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
    aiSummary: "Pic d'anxiété professionnelle aigu rapporté. Faux-pas de 2 cigarettes hier soir. Recommandation : adapter le dosage de nicotine et planifier une téléconsultation.",
    treatment: "Patch Nicorette 21mg/24h + Spray buccal"
  },
  {
    id: "p0c70000-0000-0000-0000-000000000003",
    patientProfileId: "p0c70000-0000-0000-0000-000000000003",
    patientName: "Sara Mansour",
    name: "Sara Mansour",
    fullName: "Sara Mansour",
    patientEmail: "projetfinetude4@gmail.com",
    email: "projetfinetude4@gmail.com",
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
    id: "p0c70000-0000-0000-0000-000000000004",
    patientProfileId: "p0c70000-0000-0000-0000-000000000004",
    patientName: "Said Alaoui",
    name: "Said Alaoui",
    fullName: "Said Alaoui",
    patientEmail: "saidpa1969@gmail.com",
    email: "saidpa1969@gmail.com",
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
  },
  {
    id: "p0c70000-0000-0000-0000-000000000005",
    patientProfileId: "p0c70000-0000-0000-0000-000000000005",
    patientName: "Mohamed Chraibi",
    name: "Mohamed Chraibi",
    fullName: "Mohamed Chraibi",
    patientEmail: "testaccsimo@gmail.com",
    email: "testaccsimo@gmail.com",
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
  }
];

// Helper to create a complete clinical dossier for Doctor Workspace
export const createDemoDossier = (patientProfileId) => {
  const patient = DEMO_DOCTOR_PATIENTS.find(
    p => p.patientProfileId === patientProfileId || p.id === patientProfileId || p.email === patientProfileId
  ) || DEMO_DOCTOR_PATIENTS[0];
  const tests = generateDemoTests();

  const isUrgent = patient.patientEmail === "aymantantani18@gmail.com" || patient.patientName?.includes("Karim");
  const isSevere = patient.patientEmail === "testaccsimo@gmail.com" || patient.patientName?.includes("Mohamed");

  const conversationMessages = isUrgent
    ? [
        { id: "msg-k1", senderType: "PATIENT", content: "🚨 SOS Envie : J'ai une envie de fumer incontrôlable suite à une grosse crise au travail ! Je tremble et je suis prêt à descendre acheter un paquet. Aidez-moi vite !", createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString() },
        { id: "msg-k2", senderType: "AI", content: "🚨 Karim, asseyez-vous immédiatement et restez avec moi ! Ne bougez pas. Prenez votre spray nicotinique ou votre gomme 2mg tout de suite. Inspirez en 4 secondes... Bloquez 7 secondes... Expirez lentement par la bouche en 8 secondes. Cette tempête dopaminergique est violente mais elle va redescendre dans 180 secondes. J'ai alerté le Dr. Tantani en priorité sur votre dossier.", createdAt: new Date(Date.now() - 3600000 * 1.4).toISOString() },
        { id: "msg-k3", senderType: "PATIENT", content: "J'ai pris la gomme et je fais les respirations... Le tremblement diminue mais le manque physique me brûle.", createdAt: new Date(Date.now() - 3600000 * 0.8).toISOString() },
        { id: "msg-k4", senderType: "AI", content: "Bravo pour votre immense courage, Karim ! Vous tenez bon. Buvez immédiatement un grand verre d'eau glacée. Le Dr. Tantani a reçu votre alerte d'urgence et peut initier une téléconsultation si nécessaire. Continuez la respiration 4-7-8.", createdAt: new Date(Date.now() - 3600000 * 0.7).toISOString() }
      ]
    : isSevere
    ? [
        { id: "msg-m1", senderType: "PATIENT", content: "L'anxiété est très forte ce matin, je n'ai pas dormi de la nuit. Fumer une cigarette est la seule chose qui me vient à l'esprit.", createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
        { id: "msg-m2", senderType: "AI", content: "Mohamed, l'insomnie et l'irritabilité sont les manifestations typiques du sevrage nicotinique à J+2. Cela prouve que votre corps commence déjà à éliminer les toxines. Utilisez votre patch 21mg et accordez-vous une douche tiède pour relâcher les tensions musculaires.", createdAt: new Date(Date.now() - 3600000 * 3.9).toISOString() }
      ]
    : [
        { id: "msg-1", senderType: "PATIENT", content: "Bonjour, j'ai parfois un léger craving après le repas du midi. Que me conseillez-vous ?", createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
        { id: "msg-2", senderType: "AI", content: "Bonjour Youssef ! C'est un déclencheur classique lié au rituel post-prandial. Prenez une gomme 2mg immédiatement après le repas, buvez un grand verre d'eau fraîche et faites 2 minutes de cohérence cardiaque 4-7-8.", createdAt: new Date(Date.now() - 3600000 * 4.9).toISOString() },
        { id: "msg-3", senderType: "PATIENT", content: "Merci beaucoup, la respiration m'a fait énormément de bien, l'envie est passée !", createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
        { id: "msg-4", senderType: "AI", content: "Bravo Youssef ! Chaque vague surmontée renforce votre cerveau contre la nicotine. Continuez comme cela !", createdAt: new Date(Date.now() - 3600000 * 3.9).toISOString() }
      ];

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
      medicalHistoryNotes: "Patient suivi avec protocole de substitution active.",
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
      medicalSummary: "Le patient suit le protocole médical. Suivi clinique régulier en cours."
    },
    clinicalIntelligence: {
      globalSummary: {
        summary: `Synthèse IA Clinique pour ${patient.patientName} : Profil ${patient.status}. Observance et biomarqueurs sous monitoring continu.`
      },
      phaseSummaries: [
        { id: "ph-1", phaseId: 1, phaseTitle: "Bilan Initial & Dépendance", summary: "Dépendance nicotinique évaluée et protocole validé.", attentionPoints: ["Surveillance du sommeil"] },
        { id: "ph-2", phaseId: 2, phaseTitle: "Phase Aiguë (J1-J7)", summary: "Stabilisation du sevrage.", attentionPoints: ["Gestion du stress"] },
        { id: "ph-3", phaseId: 3, phaseTitle: "Stabilisation (J8-J30)", summary: "Amélioration spirométrique continue.", attentionPoints: ["Cohérence cardiaque"] }
      ]
    },
    supportConversation: {
      latestRiskLevel: patient.riskLevel,
      latestSummary: patient.aiSummary,
      messages: conversationMessages
    },
    supportAlerts: [
      { id: `alt-${patient.patientProfileId}`, alertType: isUrgent ? "SOS_CRAVING" : "CRAVING", summary: patient.aiSummary, level: patient.riskLevel, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() }
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
  },
  {
    id: "apt-demo-02",
    startsAt: new Date(Date.now() + 3600000 * 2).toISOString(),
    durationMinutes: 30,
    status: "CONFIRMED",
    reason: "🚨 Consultation Urgente : Suite à l'alerte SOS Envie du patient Karim Benali (Casablanca).",
    doctorName: "Dr. Ayman Tantani",
    doctorSpecialty: "Tabacologue & Médecin Référent",
    patientName: "Karim Benali",
    patientProfileId: "p0c70000-0000-0000-0000-000000000002",
    meetingProvider: "JITSI",
    meetingRoomName: "NeuralConsult-Urgence-Karim-Benali",
    meetingJoinUrl: "https://meet.jit.si/NeuralConsult-Urgence-Karim-Benali",
    triggeredByAiAlert: true
  }
];

// Demo Alerts for Doctor Support
export const DEMO_SUPPORT_ALERTS = [
  {
    id: "alt-101",
    patientProfileId: "p0c70000-0000-0000-0000-000000000002",
    patientName: "Karim Benali",
    patientEmail: "aymantantani18@gmail.com",
    level: "CRITICAL",
    summary: "🚨 SOS Envie : Pic d'anxiété professionnelle aigu. Faux-pas de 2 cigarettes hier soir. Protocole d'urgence activé.",
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    status: "OPEN"
  },
  {
    id: "alt-102",
    patientProfileId: "p0c70000-0000-0000-0000-000000000005",
    patientName: "Mohamed Chraibi",
    patientEmail: "testaccsimo@gmail.com",
    level: "HIGH",
    summary: "Score HAD Anxiété à 12/21. Insomnies sévères et manque physique persistant.",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    status: "OPEN"
  },
  {
    id: "alt-103",
    patientProfileId: "p0c70000-0000-0000-0000-000000000001",
    patientName: "Youssef El Fassi",
    patientEmail: "tantaniayman0@gmail.com",
    level: "LOW",
    summary: "Bilan J+30 validé avec succès. Abstinence consolidée.",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: "RESOLVED"
  }
];

// ─── DEMO COMMUNITY MOCK DATA & PERSISTENCE ───
export const DEMO_COMMUNITY_SERVERS = [
  {
    "id": "all",
    "name": "r/tous",
    "label": "Accueil Global",
    "icon": "bi-globe2",
    "color": "#3b82f6",
    "description": "Toutes les publications de la communauté NeuralConsult"
  },
  {
    "id": "victoires",
    "name": "r/victoires_sevrage",
    "label": "Victoires & Étapes",
    "icon": "bi-trophy-fill",
    "color": "#10b981",
    "description": "Partagez vos jours sans tabac, économies et fiertés !"
  },
  {
    "id": "entraide",
    "name": "r/entraide_urgences",
    "label": "SOS & Urgences Craving",
    "icon": "bi-shield-fill-exclamation",
    "color": "#ef4444",
    "description": "Pics d'envie, moments difficiles et soutien immédiat 24/7."
  },
  {
    "id": "conseils",
    "name": "r/conseils_tabacologues",
    "label": "Conseils Médicaux",
    "icon": "bi-heart-pulse-fill",
    "color": "#8b5cf6",
    "description": "Conseils validés par les médecins tabacologues et pneumologues."
  },
  {
    "id": "tns",
    "name": "r/substituts_tns",
    "label": "Substituts & Traitements",
    "icon": "bi-capsule",
    "color": "#f59e0b",
    "description": "Avis et questions sur les patchs, gommes, sprays et posologies."
  },
  {
    "id": "sport",
    "name": "r/sport_et_bienetre",
    "label": "Sport & Respiration",
    "icon": "bi-lungs-fill",
    "color": "#06b6d4",
    "description": "Cohérence cardiaque, reprise du souffle, course et nutrition."
  }
];

export const DEMO_COMMUNITY_PEOPLE = [
  {
    "id": "user-tantani",
    "name": "Dr. Ayman Tantani",
    "username": "dr_tantani",
    "email": "ayman.tantani@uit.ac.ma",
    "profilePhotoUrl": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    "role": "Médecin Tabacologue & Addictologue",
    "isDoctor": true,
    "city": "Rabat",
    "smokeFreeStatus": "Médecin Référent",
    "bio": "Médecin spécialiste en addictologie clinique et sevrage tabagique. Accompagnement bienveillant basé sur les preuves.",
    "following": false,
    "stats": {
      "daysSmokeFree": 0,
      "savedAmount": 0,
      "postsCount": 18
    }
  },
  {
    "id": "user-benjelloun",
    "name": "Dr. Leila Benjelloun",
    "username": "dr_benjelloun",
    "profilePhotoUrl": "https://images.unsplash.com/photo-1594824813576-a4c4a40733a1?w=150&auto=format&fit=crop&q=80",
    "role": "Pneumologue Spécialiste",
    "isDoctor": true,
    "city": "Casablanca",
    "smokeFreeStatus": "Médecin Spécialiste",
    "bio": "Pneumologue hospitalière, spécialiste de la régénération pulmonaire post-sevrage et de la BPCO.",
    "following": false,
    "stats": {
      "daysSmokeFree": 0,
      "savedAmount": 0,
      "postsCount": 12
    }
  },
  {
    "id": "user-lahlou",
    "name": "Dr. Mehdi Lahlou",
    "username": "dr_lahlou_tabac",
    "profilePhotoUrl": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80",
    "role": "Médecin Généraliste & Praticien TCC",
    "isDoctor": true,
    "city": "Marrakech",
    "smokeFreeStatus": "Médecin Praticien",
    "bio": "Thérapies comportementales et cognitives (TCC) appliquées au conditionnement tabagique.",
    "following": false,
    "stats": {
      "daysSmokeFree": 0,
      "savedAmount": 0,
      "postsCount": 9
    }
  },
  {
    "id": "user-fassi",
    "name": "Youssef El Fassi",
    "username": "youssef_fassi",
    "email": "tantaniayman0@gmail.com",
    "profilePhotoUrl": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "role": "Patient Sevré J+30",
    "isDoctor": false,
    "city": "Rabat",
    "smokeFreeStatus": "30 jours sans tabac",
    "bio": "Architecte logiciel à Rabat. 15 cigarettes/jour pendant 10 ans. 100% sevré et libéré !",
    "following": false,
    "stats": {
      "daysSmokeFree": 30,
      "savedAmount": 280,
      "postsCount": 5
    }
  },
  {
    "id": "user-karim",
    "name": "Karim Benali",
    "username": "karim_courage",
    "email": "aymantantani18@gmail.com",
    "profilePhotoUrl": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    "role": "Patient en Sevrage (J+4)",
    "isDoctor": false,
    "city": "Casablanca",
    "smokeFreeStatus": "4 jours sans tabac",
    "bio": "Cadre financier à Casa. En plein combat contre la dépendance avec l'aide du Dr. Tantani.",
    "following": false,
    "stats": {
      "daysSmokeFree": 4,
      "savedAmount": 45,
      "postsCount": 8
    }
  },
  {
    "id": "user-sara",
    "name": "Sara Mansour",
    "username": "sara_resilience",
    "email": "projetfinetude4@gmail.com",
    "profilePhotoUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "role": "Patiente en Progression (J+14)",
    "isDoctor": false,
    "city": "Marrakech",
    "smokeFreeStatus": "14 jours sans tabac",
    "bio": "Enseignante passionnée. 2 semaines d'abstinence totale grâce aux patchs et à la sophrologie.",
    "following": false,
    "stats": {
      "daysSmokeFree": 14,
      "savedAmount": 135,
      "postsCount": 6
    }
  },
  {
    "id": "user-alaoui",
    "name": "Said Alaoui",
    "username": "said_senior_libre",
    "email": "saidpa1969@gmail.com",
    "profilePhotoUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "role": "Senior Sevré Consolidé (J+60)",
    "isDoctor": false,
    "city": "Fès",
    "smokeFreeStatus": "60 jours sans tabac",
    "bio": "Commerçant à Fès. 30 ans de tabac derrière moi. La preuve vivante qu'il n'est jamais trop tard !",
    "following": false,
    "stats": {
      "daysSmokeFree": 60,
      "savedAmount": 620,
      "postsCount": 11
    }
  },
  {
    "id": "user-simo",
    "name": "Mohamed Chraibi",
    "username": "simo_nouveau_souffle",
    "email": "testaccsimo@gmail.com",
    "profilePhotoUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "role": "Patient Début de Sevrage (J+2)",
    "isDoctor": false,
    "city": "Tanger",
    "smokeFreeStatus": "2 jours sans tabac",
    "bio": "Ingénieur logistique à Tanger. Détermination maximale malgré les insomnies des premiers jours.",
    "following": false,
    "stats": {
      "daysSmokeFree": 2,
      "savedAmount": 20,
      "postsCount": 4
    }
  },
  {
    "id": "user-tazi",
    "name": "Nadia Tazi",
    "username": "nadia_zen",
    "profilePhotoUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    "role": "Patiente Sevrée (J+90)",
    "isDoctor": false,
    "city": "Rabat",
    "smokeFreeStatus": "90 jours sans tabac",
    "bio": "90 jours sans fumée. Passionnée de yoga, thé vert et vie saine sans tabac.",
    "following": false,
    "stats": {
      "daysSmokeFree": 90,
      "savedAmount": 910,
      "postsCount": 14
    }
  },
  {
    "id": "user-kabbaj",
    "name": "Amine Kabbaj",
    "username": "amine_runner",
    "profilePhotoUrl": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    "role": "Patient Sevré & Runner (J+45)",
    "isDoctor": false,
    "city": "Casablanca",
    "smokeFreeStatus": "45 jours sans tabac",
    "bio": "La course à pied a remplacé la cigarette. Préparation du 10km de Casa !",
    "following": false,
    "stats": {
      "daysSmokeFree": 45,
      "savedAmount": 450,
      "postsCount": 7
    }
  },
  {
    "id": "user-berrada",
    "name": "Sofia Berrada",
    "username": "sofia_sans_tabac",
    "profilePhotoUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "role": "Patiente Sevrée (J+21)",
    "isDoctor": false,
    "city": "Rabat",
    "smokeFreeStatus": "21 jours sans tabac",
    "bio": "Sevrage réussi avec la cohérence cardiaque 4-7-8 et le soutien de la communauté.",
    "following": false,
    "stats": {
      "daysSmokeFree": 21,
      "savedAmount": 210,
      "postsCount": 5
    }
  },
  {
    "id": "user-naciri",
    "name": "Hassan Naciri",
    "username": "hassan_focus",
    "profilePhotoUrl": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    "role": "Patient Sevré (J+15)",
    "isDoctor": false,
    "city": "Casablanca",
    "smokeFreeStatus": "15 jours sans tabac",
    "bio": "Développeur fullstack. Mes astuces pour survivre aux pauses café au bureau sans replonger.",
    "following": false,
    "stats": {
      "daysSmokeFree": 15,
      "savedAmount": 150,
      "postsCount": 4
    }
  }
];

export const DEMO_COMMUNITY_POSTS = [
  {
    "id": "post-1",
    "serverId": "victoires",
    "serverName": "r/victoires_sevrage",
    "title": "Aujourd'hui cela fait exactement 30 jours sans aucune cigarette ! Mon souffle et mon énergie sont de retour 🫁",
    "content": "Il y a un mois jour pour jour, j'écrasais ma dernière cigarette après 10 ans à 1 paquet par jour. Les premiers jours étaient rudes, mais en combinant les patchs 14mg prescrits par le Dr. Tantani, la cohérence cardiaque 4-7-8 sur l'application et les encouragements du groupe, j'ai passé le cap fatidique.\n\nBilan : 280€ économisés, fréquence cardiaque au repos passée de 84 à 66 bpm et je monte enfin les escaliers sans essoufflement. Courage à tous, la liberté n'a pas de prix !",
    "flair": "🏆 Victoire J+30",
    "imageUrl": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80",
    "createdAt": "2026-09-04T12:30:00.000Z",
    "upvotesCount": 94,
    "downvotesCount": 1,
    "myReaction": null,
    "reactions": {
      "LOVE": 38,
      "FIRE": 28,
      "CLAP": 22,
      "INSIGHT": 6
    },
    "commentsCount": 3,
    "author": {
      "id": "user-fassi",
      "name": "Youssef El Fassi",
      "username": "youssef_fassi",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      "role": "Patient Sevré J+30",
      "isDoctor": false,
      "smokeFreeStatus": "30 jours sans tabac",
      "following": false
    },
    "comments": [
      {
        "id": "c-101",
        "content": "Félicitations Youssef ! Le cap du premier mois valide la chute radicale du risque d'infarctus et le début du remodelage épithélial bronchique. Bravo pour votre rigueur clinique !",
        "createdAt": "2026-09-04T12:45:00.000Z",
        "author": {
          "id": "user-tantani",
          "name": "Dr. Ayman Tantani",
          "username": "dr_tantani",
          "profilePhotoUrl": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
          "role": "Médecin Tabacologue",
          "isDoctor": true
        }
      },
      {
        "id": "c-102",
        "content": "Bravo Youssef ! Tu es un exemple pour moi qui suis à J+4. Ton témoignage me redonne du courage pour la soirée.",
        "createdAt": "2026-09-04T13:10:00.000Z",
        "author": {
          "id": "user-karim",
          "name": "Karim Benali",
          "username": "karim_courage",
          "profilePhotoUrl": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
          "role": "Patient en Sevrage",
          "isDoctor": false
        }
      }
    ]
  },
  {
    "id": "post-2",
    "serverId": "conseils",
    "serverName": "r/conseils_tabacologues",
    "title": "Craving matinal et café : pourquoi cette envie est la plus féroce et comment la désamorcer ☕",
    "content": "Le pic d'envie au réveil résulte de la clairance nocturne de la nicotine (chute plasmatique de 80%) conjuguée au réflexe pavlovien café-cigarette ancré dans les ganglions de la base cérébrale.\n\n💡 **Mon conseil pratique :** Prenez votre substitut oral (gomme ou pastille 2mg) 10 minutes AVANT votre café. Si l'envie persiste, remplacez temporairement le café par du thé vert matcha ou une infusion citron-gingembre pendant 15 jours. Le cerveau réécrit ce réflexe en moins de 3 semaines !",
    "flair": "🩺 Conseil Médecin",
    "imageUrl": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    "createdAt": "2026-09-04T09:15:00.000Z",
    "upvotesCount": 142,
    "downvotesCount": 0,
    "myReaction": null,
    "reactions": {
      "LOVE": 44,
      "FIRE": 31,
      "CLAP": 29,
      "INSIGHT": 38
    },
    "commentsCount": 2,
    "author": {
      "id": "user-tantani",
      "name": "Dr. Ayman Tantani",
      "username": "dr_tantani",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
      "role": "Médecin Tabacologue",
      "isDoctor": true,
      "smokeFreeStatus": "Médecin Référent",
      "following": false
    },
    "comments": [
      {
        "id": "c-201",
        "content": "Merci Docteur ! C'était mon point faible numéro un. La pastille 10 min avant fonctionne à merveille.",
        "createdAt": "2026-09-04T09:40:00.000Z",
        "author": {
          "id": "user-sara",
          "name": "Sara Mansour",
          "username": "sara_resilience",
          "profilePhotoUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
          "role": "Patiente en Progression",
          "isDoctor": false
        }
      }
    ]
  },
  {
    "id": "post-3",
    "serverId": "entraide",
    "serverName": "r/entraide_urgences",
    "title": "Grosse envie soudaine après une journée de travail stressante... J'ai besoin de force 🚨",
    "content": "La journée au bureau a été particulièrement tendue. Mon réflexe d'avant était d'allumer 3 cigarettes d'affilée sur le parking en partant. Là je suis dans ma voiture, les mains moites, la gorge serrée. J'ai déclenché le mode SOS avec l'IA psychologue et je viens écrire ici pour occuper mon esprit et ne pas bifurquer vers le bureau de tabac.",
    "flair": "🆘 Urgence Craving",
    "imageUrl": null,
    "createdAt": "2026-09-04T14:10:00.000Z",
    "upvotesCount": 48,
    "downvotesCount": 0,
    "myReaction": null,
    "reactions": {
      "LOVE": 26,
      "FIRE": 12,
      "CLAP": 5,
      "INSIGHT": 5
    },
    "commentsCount": 2,
    "author": {
      "id": "user-karim",
      "name": "Karim Benali",
      "username": "karim_courage",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
      "role": "Patient en Sevrage",
      "isDoctor": false,
      "smokeFreeStatus": "4 jours sans tabac",
      "following": false
    },
    "comments": [
      {
        "id": "c-301",
        "content": "Karim, tiens bon ! Une vague d'envie ne dure JAMAIS plus de 180 secondes biologiquement. Respire lentement en 4-7-8, prends une gomme et démarre ta voiture pour rentrer directement. On est tous avec toi !",
        "createdAt": "2026-09-04T14:15:00.000Z",
        "author": {
          "id": "user-alaoui",
          "name": "Said Alaoui",
          "username": "said_senior_libre",
          "profilePhotoUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          "role": "Senior Sevré",
          "isDoctor": false
        }
      }
    ]
  },
  {
    "id": "post-4",
    "serverId": "victoires",
    "serverName": "r/victoires_sevrage",
    "title": "À 55 ans et après 30 ans de tabagisme lourd (1 paquet et demi/jour), je fête mes 60 jours sans fumée. Il n'est JAMAIS trop tard ! 🏆",
    "content": "Je pensais que mes poumons étaient fichus et qu'à mon âge arrêter ne changerait plus grand chose. Erreur totale ! Mon médecin m'a confirmé ce matin que mon taux de monoxyde de carbone expiré est redescendu au niveau d'un non-fumeur strict (2 ppm). Je retrouve le goût des tajines de mon épouse et je dors d'un sommeil profond comme je n'en avais pas connu depuis 20 ans.",
    "flair": "🏆 Victoire J+30",
    "imageUrl": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80",
    "createdAt": "2026-09-03T16:00:00.000Z",
    "upvotesCount": 126,
    "downvotesCount": 0,
    "myReaction": null,
    "reactions": {
      "LOVE": 52,
      "FIRE": 36,
      "CLAP": 32,
      "INSIGHT": 6
    },
    "commentsCount": 1,
    "author": {
      "id": "user-alaoui",
      "name": "Said Alaoui",
      "username": "said_senior_libre",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      "role": "Senior Sevré Consolidé",
      "isDoctor": false,
      "smokeFreeStatus": "60 jours sans tabac",
      "following": false
    },
    "comments": []
  },
  {
    "id": "post-5",
    "serverId": "tns",
    "serverName": "r/substituts_tns",
    "title": "Patchs 21mg + spray buccal : le combo qui a sauvé mes 2 premières semaines 💊",
    "content": "Au début j'avais très peur du surdosage avec les patchs. Mon tabacologue m'a rassurée : le sous-dosage est la cause n°1 de rechute précoce. Le patch 21mg diffuse un plateau nicotinique continu toute la journée, et 1 pulvérisation de spray oral coupe un pic d'angoisse en 60 secondes. N'ayez pas peur des substituts, ils sont nos alliés pour sevrer le cerveau en douceur !",
    "flair": "💊 Substituts & TNS",
    "imageUrl": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80",
    "createdAt": "2026-09-03T11:20:00.000Z",
    "upvotesCount": 78,
    "downvotesCount": 0,
    "myReaction": null,
    "reactions": {
      "LOVE": 24,
      "FIRE": 16,
      "CLAP": 18,
      "INSIGHT": 20
    },
    "commentsCount": 1,
    "author": {
      "id": "user-sara",
      "name": "Sara Mansour",
      "username": "sara_resilience",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      "role": "Patiente en Progression",
      "isDoctor": false,
      "smokeFreeStatus": "14 jours sans tabac",
      "following": false
    },
    "comments": []
  },
  {
    "id": "post-6",
    "serverId": "sport",
    "serverName": "r/sport_et_bienetre",
    "title": "Reprise de la course à pied à J+45 : premiers 5 km sans m'arrêter ! 🏃‍♂️",
    "content": "Quand je fumais, courir 500 mètres me brûlait la trachée. Aujourd'hui à J+45 de sevrage, j'ai bouclé ma première boucle de 5 km à 6:10/km sans cracher mes poumons. La régénération des cils bronchiques est une réalité biologique spectaculaire. Quand une envie monte, chaussez vos baskets : l'endorphine naturelle terrasse la dopamine nicotinique en 15 minutes.",
    "flair": "🧘 Sport & Bien-être",
    "imageUrl": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80",
    "createdAt": "2026-09-03T08:45:00.000Z",
    "upvotesCount": 89,
    "downvotesCount": 0,
    "myReaction": null,
    "reactions": {
      "LOVE": 30,
      "FIRE": 35,
      "CLAP": 20,
      "INSIGHT": 4
    },
    "commentsCount": 2,
    "author": {
      "id": "user-kabbaj",
      "name": "Amine Kabbaj",
      "username": "amine_runner",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      "role": "Runner Sevré",
      "isDoctor": false,
      "smokeFreeStatus": "45 jours sans tabac",
      "following": false
    },
    "comments": []
  },
  {
    "id": "post-7",
    "serverId": "conseils",
    "serverName": "r/conseils_tabacologues",
    "title": "Pourquoi vous ressentez une faim accrue au début du sevrage et comment éviter la prise de poids 🥗",
    "content": "La nicotine est un coupe-faim artificiel qui augmente la dépense énergétique de base d'environ 200 kcal/jour. À l'arrêt, le métabolisme se normalise et la recherche de récompense orale incite au grignotage.\n\n🥦 **Mes recommandations cliniques :**\n1. Prévoyez des bâtonnets de carottes, concombres et quelques amandes prêtes au frigo.\n2. Buvez une infusion cannelle-menthe (régule naturellement les fringales de glycémie).\n3. Fractionnez vos repas et buvez un grand verre d'eau 10 minutes avant chaque repas.",
    "flair": "💡 Astuce du Jour",
    "imageUrl": null,
    "createdAt": "2026-09-02T17:30:00.000Z",
    "upvotesCount": 115,
    "downvotesCount": 0,
    "myReaction": null,
    "reactions": {
      "LOVE": 38,
      "FIRE": 22,
      "CLAP": 25,
      "INSIGHT": 30
    },
    "commentsCount": 3,
    "author": {
      "id": "user-benjelloun",
      "name": "Dr. Leila Benjelloun",
      "username": "dr_benjelloun",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1594824813576-a4c4a40733a1?w=150&auto=format&fit=crop&q=80",
      "role": "Pneumologue Spécialiste",
      "isDoctor": true,
      "smokeFreeStatus": "Médecin Spécialiste",
      "following": false
    },
    "comments": []
  },
  {
    "id": "post-8",
    "serverId": "entraide",
    "serverName": "r/entraide_urgences",
    "title": "J+2 : Nuit blanche, sueurs froides et angoisse... Est-ce que cela va s'atténuer ? 😰",
    "content": "48 heures sans fumer. La nuit passée a été terrifiante : insomnie totale, sueurs et un cerveau qui me supplie d'allumer une cigarette. J'ai le patch collé sur le bras, mais le manque psychologique me torture. Dites-moi que le pic diminue bientôt...",
    "flair": "🔄 Rechute & Courage",
    "imageUrl": null,
    "createdAt": "2026-09-04T07:15:00.000Z",
    "upvotesCount": 52,
    "downvotesCount": 0,
    "myReaction": null,
    "reactions": {
      "LOVE": 30,
      "FIRE": 10,
      "CLAP": 6,
      "INSIGHT": 6
    },
    "commentsCount": 2,
    "author": {
      "id": "user-simo",
      "name": "Mohamed Chraibi",
      "username": "simo_nouveau_souffle",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      "role": "Patient en Sevrage",
      "isDoctor": false,
      "smokeFreeStatus": "2 jours sans tabac",
      "following": false
    },
    "comments": [
      {
        "id": "c-801",
        "content": "Mohamed, vous êtes exactement au pic des 72 heures : le corps élimine les derniers métabolites de nicotine. Dès demain après-midi, l'intensité des sueurs va chuter de 50%. Tenez bon, ce n'est pas vous qui souffrez, c'est l'addiction qui meurt !",
        "createdAt": "2026-09-04T07:30:00.000Z",
        "author": {
          "id": "user-tantani",
          "name": "Dr. Ayman Tantani",
          "username": "dr_tantani",
          "profilePhotoUrl": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
          "role": "Médecin Tabacologue",
          "isDoctor": true
        }
      }
    ]
  },
  {
    "id": "post-9",
    "serverId": "victoires",
    "serverName": "r/victoires_sevrage",
    "title": "3 mois sans fumer : 900€ économisés et un voyage aux Canaries financé grâce au sevrage ! ✈️🌴",
    "content": "Chaque matin, je mettais 10€ dans une tirelire transparente au lieu de les laisser au bureau de tabac. Hier, pour mes 90 jours d'abstinence totale, j'ai compté : 910€ ! J'ai réservé un séjour d'une semaine au soleil pour respirer le grand air marin. La plus belle décision de toute ma vie.",
    "flair": "🏆 Victoire J+30",
    "imageUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    "createdAt": "2026-09-02T10:00:00.000Z",
    "upvotesCount": 167,
    "downvotesCount": 0,
    "myReaction": null,
    "reactions": {
      "LOVE": 65,
      "FIRE": 42,
      "CLAP": 45,
      "INSIGHT": 15
    },
    "commentsCount": 3,
    "author": {
      "id": "user-tazi",
      "name": "Nadia Tazi",
      "username": "nadia_zen",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      "role": "Patiente Sevrée",
      "isDoctor": false,
      "smokeFreeStatus": "90 jours sans tabac",
      "following": false
    },
    "comments": []
  },
  {
    "id": "post-10",
    "serverId": "sport",
    "serverName": "r/sport_et_bienetre",
    "title": "3 minutes de cohérence cardiaque 4-7-8 : la méthode infaillible contre les crises d'irritabilité 🧘‍♀️",
    "content": "Pendant la deuxième semaine, j'étais d'une humeur massacrante avec mes proches. L'IA psychologue de l'application m'a initiée à la cohérence cardiaque 4-7-8 : inspirer par le nez 4s, retenir l'air 7s, expirer lentement par la bouche 8s. Trois cycles suffisent à stimuler le nerf vague et calmer le système nerveux parasympathique. Ça m'a sauvée !",
    "flair": "🧘 Sport & Bien-être",
    "imageUrl": null,
    "createdAt": "2026-09-01T14:20:00.000Z",
    "upvotesCount": 72,
    "downvotesCount": 0,
    "myReaction": null,
    "reactions": {
      "LOVE": 25,
      "FIRE": 18,
      "CLAP": 15,
      "INSIGHT": 14
    },
    "commentsCount": 1,
    "author": {
      "id": "user-berrada",
      "name": "Sofia Berrada",
      "username": "sofia_sans_tabac",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      "role": "Patiente Sevrée",
      "isDoctor": false,
      "smokeFreeStatus": "21 jours sans tabac",
      "following": false
    },
    "comments": []
  },
  {
    "id": "post-11",
    "serverId": "conseils",
    "serverName": "r/conseils_tabacologues",
    "title": "La règle des 3D face au craving : Délai, Distraction, Décompression 🛡️",
    "content": "Une pulsion nicotinique ressemble à une vague : elle monte en 90 secondes, culmine pendant 2 minutes, puis décline inévitablement.\n\n🌊 **Appliquez la règle des 3D :**\n- **Délai :** Accordez-vous 5 minutes avant toute décision impulsive.\n- **Distraction :** Changez de pièce, buvez un verre d'eau, lancez un jeu sur votre téléphone.\n- **Décompression :** Respirez profondément. 9 fois sur 10, le cerveau a déjà oublié l'envie.",
    "flair": "🩺 Conseil Médecin",
    "imageUrl": null,
    "createdAt": "2026-09-01T11:00:00.000Z",
    "upvotesCount": 138,
    "downvotesCount": 0,
    "myReaction": null,
    "reactions": {
      "LOVE": 40,
      "FIRE": 30,
      "CLAP": 32,
      "INSIGHT": 36
    },
    "commentsCount": 2,
    "author": {
      "id": "user-lahlou",
      "name": "Dr. Mehdi Lahlou",
      "username": "dr_lahlou_tabac",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80",
      "role": "Médecin Praticien TCC",
      "isDoctor": true,
      "smokeFreeStatus": "Médecin Praticien",
      "following": false
    },
    "comments": []
  },
  {
    "id": "post-12",
    "serverId": "tns",
    "serverName": "r/substituts_tns",
    "title": "Astuce pour les pauses professionnelles : remplacer le geste par une paille ou un stylo ☕",
    "content": "En tant que développeur, la pause clope était mon rituel de réflexion et de socialisation. Depuis 15 jours, je descends toujours avec les collègues pour prendre l'air, mais avec une gourde d'eau gazeuse fraîche et un bâton de cannelle. Aucun sentiment d'exclusion et mes poumons me remercient !",
    "flair": "💡 Astuce du Jour",
    "imageUrl": null,
    "createdAt": "2026-08-31T15:40:00.000Z",
    "upvotesCount": 63,
    "downvotesCount": 0,
    "myReaction": null,
    "reactions": {
      "LOVE": 18,
      "FIRE": 14,
      "CLAP": 20,
      "INSIGHT": 11
    },
    "commentsCount": 2,
    "author": {
      "id": "user-naciri",
      "name": "Hassan Naciri",
      "username": "hassan_focus",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      "role": "Patient Sevré",
      "isDoctor": false,
      "smokeFreeStatus": "15 jours sans tabac",
      "following": false
    },
    "comments": []
  },
  {
    "id": "post-13",
    "serverId": "victoires",
    "serverName": "r/victoires_sevrage",
    "title": "Félicitations à l'ensemble de la communauté : plus de 1 200 jours sans tabac cumulés ce mois-ci sur NeuralConsult ! 👏",
    "content": "En tant que médecin coordonnateur, je suis chaque jour ému par la solidarité et le courage déployés sur cet espace. Le sevrage n'est pas une épreuve solitaire : chaque conseil partagé, chaque mot d'encouragement sous une alerte SOS sauve concrètement un parcours. Continuez à vous soutenir mutuellement !",
    "flair": "🌟 Victoire J+14",
    "imageUrl": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
    "createdAt": "2026-08-30T10:00:00.000Z",
    "upvotesCount": 210,
    "downvotesCount": 0,
    "myReaction": null,
    "reactions": {
      "LOVE": 80,
      "FIRE": 55,
      "CLAP": 60,
      "INSIGHT": 15
    },
    "commentsCount": 3,
    "author": {
      "id": "user-tantani",
      "name": "Dr. Ayman Tantani",
      "username": "dr_tantani",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
      "role": "Médecin Tabacologue",
      "isDoctor": true,
      "smokeFreeStatus": "Médecin Référent",
      "following": false
    },
    "comments": []
  },
  {
    "id": "post-14",
    "serverId": "entraide",
    "serverName": "r/entraide_urgences",
    "title": "Soirée mariage réussie sans fumer une seule taffe malgré 50 fumeurs autour de moi ! 🎉",
    "content": "J'avais une angoisse terrible à l'idée d'aller à ce mariage hier soir. Ma stratégie : j'avais prévenu 2 amies proches de ma démarche, j'ai gardé mon spray nicotinique dans mon sac et j'ai dansé toute la nuit. Résultat : réveil ce matin sans gueule de bois de fumée, les vêtements qui sentent le propre et une fierté incommensurable !",
    "flair": "🏆 Victoire J+30",
    "imageUrl": null,
    "createdAt": "2026-08-29T18:20:00.000Z",
    "upvotesCount": 99,
    "downvotesCount": 0,
    "myReaction": null,
    "reactions": {
      "LOVE": 42,
      "FIRE": 28,
      "CLAP": 25,
      "INSIGHT": 4
    },
    "commentsCount": 2,
    "author": {
      "id": "user-sara",
      "name": "Sara Mansour",
      "username": "sara_resilience",
      "profilePhotoUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      "role": "Patiente en Progression",
      "isDoctor": false,
      "smokeFreeStatus": "14 jours sans tabac",
      "following": false
    },
    "comments": []
  }
];

export const getDemoCommunityData = () => {
  let storedPosts = [];
  try {
    storedPosts = JSON.parse(localStorage.getItem("nc_demo_community_posts") || "[]");
  } catch (e) {}

  const storedIds = new Set(storedPosts.map(p => p.id));
  const mergedPosts = [
    ...storedPosts,
    ...DEMO_COMMUNITY_POSTS.filter(p => !storedIds.has(p.id))
  ];

  const activeDemoEmail = typeof window !== "undefined" ? localStorage.getItem("nc_active_demo_email") : null;
  const user = (activeDemoEmail ? getDemoUserByEmail(activeDemoEmail) : null) || DEMO_COMMUNITY_PEOPLE[3];

  return {
    posts: mergedPosts,
    servers: DEMO_COMMUNITY_SERVERS,
    people: DEMO_COMMUNITY_PEOPLE,
    viewer: {
      id: user.id || "user-viewer",
      name: user.fullName || user.name || "Membre NeuralConsult",
      username: user.username || (user.email ? user.email.split("@")[0] : "membre_nc"),
      profilePhotoUrl: user.profilePhotoUrl || user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      role: user.role || (user.isDoctor ? "Médecin Tabacologue" : "Patient en Sevrage"),
      isDoctor: Boolean(user.isDoctor),
      smokeFreeStatus: user.smokeFreeStatus || "Suivi actif",
      stats: { daysSmokeFree: 30, savedAmount: 280, postsCount: mergedPosts.filter(p => p.author?.username === user.username).length, badgesCount: 4 },
      badges: ["🏆 Sevrage Actif", "🌟 Membre Vérifié", "🫁 Capacité Restaurée", "🤝 Entraide Pro"]
    },
    conversations: [
      {
        id: "chat-1",
        peer: DEMO_COMMUNITY_PEOPLE[0],
        lastMessage: "Ravi de voir votre régularité dans les bilans, continuez ainsi !",
        unread: false,
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: "chat-2",
        peer: DEMO_COMMUNITY_PEOPLE[4],
        lastMessage: "Merci pour ton conseil sous mon post, ça m'a évité de craquer hier soir !",
        unread: true,
        updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ]
  };
};

// Mock handler for api.js (Supports GET, POST, PUT, DELETE)
export const handleDemoMockRequest = (url, method = "GET", payload = null) => {
  const activeDemoEmail = typeof window !== "undefined" ? localStorage.getItem("nc_active_demo_email") : null;
  const isDoctor = activeDemoEmail === "ayman.tantani@uit.ac.ma";
  const upperMethod = (method || "GET").toUpperCase();

  // ─── MUTATIONS (POST / PUT / DELETE) ───
  if (upperMethod !== "GET") {

    // 4. Communities Social Posts Creation
    if (url.includes("/api/communities/social/posts") && !url.includes("/reactions") && !url.includes("/comments") && upperMethod === "POST") {
      const activeUser = getDemoUserByEmail(activeDemoEmail) || DEMO_COMMUNITY_PEOPLE[3];
      const newPost = {
        id: `post-user-${Date.now()}`,
        serverId: payload?.serverId || "victoires",
        serverName: DEMO_COMMUNITY_SERVERS.find(s => s.id === payload?.serverId)?.name || "r/victoires_sevrage",
        title: payload?.title || "Témoignage de sevrage",
        content: payload?.content || "",
        flair: payload?.flair || "🏆 Victoire J+30",
        imageUrl: payload?.imageUrl || null,
        createdAt: new Date().toISOString(),
        upvotesCount: 1,
        downvotesCount: 0,
        myReaction: "UPVOTE",
        reactions: { LOVE: 1, FIRE: 1, CLAP: 0, INSIGHT: 0 },
        commentsCount: 0,
        comments: [],
        author: {
          id: activeUser.id || "user-viewer",
          name: activeUser.fullName || activeUser.name || "Membre NeuralConsult",
          username: activeUser.username || "membre_actif",
          profilePhotoUrl: activeUser.profilePhotoUrl || activeUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          role: activeUser.role || (activeUser.isDoctor ? "Médecin Tabacologue" : "Patient en Sevrage"),
          isDoctor: Boolean(activeUser.isDoctor),
          smokeFreeStatus: activeUser.smokeFreeStatus || "Suivi actif",
          following: false
        }
      };
      try {
        const stored = JSON.parse(localStorage.getItem("nc_demo_community_posts") || "[]");
        stored.unshift(newPost);
        localStorage.setItem("nc_demo_community_posts", JSON.stringify(stored));
      } catch (e) {}
      return newPost;
    }

    // 5. Communities Social Post Reactions & Votes
    if (url.includes("/api/communities/social/posts/") && url.includes("/reactions") && upperMethod === "POST") {
      const postId = url.split("/posts/")[1].split("/reactions")[0];
      const type = payload?.type;
      const data = getDemoCommunityData();
      let target = data.posts.find(p => p.id === postId) || DEMO_COMMUNITY_POSTS[0];
      const updated = { ...target };

      if (type === "UPVOTE") {
        if (updated.myReaction === "UPVOTE") {
          updated.myReaction = null;
          updated.upvotesCount = Math.max(0, (updated.upvotesCount || 1) - 1);
        } else {
          if (updated.myReaction === "DOWNVOTE") {
            updated.downvotesCount = Math.max(0, (updated.downvotesCount || 1) - 1);
          }
          updated.myReaction = "UPVOTE";
          updated.upvotesCount = (updated.upvotesCount || 0) + 1;
        }
      } else if (type === "DOWNVOTE") {
        if (updated.myReaction === "DOWNVOTE") {
          updated.myReaction = null;
          updated.downvotesCount = Math.max(0, (updated.downvotesCount || 1) - 1);
        } else {
          if (updated.myReaction === "UPVOTE") {
            updated.upvotesCount = Math.max(0, (updated.upvotesCount || 1) - 1);
          }
          updated.myReaction = "DOWNVOTE";
          updated.downvotesCount = (updated.downvotesCount || 0) + 1;
        }
      } else if (type) {
        updated.reactions = { ...(updated.reactions || {}) };
        updated.reactions[type] = (updated.reactions[type] || 0) + 1;
      }

      try {
        const stored = JSON.parse(localStorage.getItem("nc_demo_community_posts") || "[]");
        const idx = stored.findIndex(p => p.id === postId);
        if (idx >= 0) {
          stored[idx] = updated;
        } else {
          stored.unshift(updated);
        }
        localStorage.setItem("nc_demo_community_posts", JSON.stringify(stored));
      } catch (e) {}

      return updated;
    }

    // 6. Communities Social Post Comments
    if (url.includes("/api/communities/social/posts/") && url.includes("/comments") && upperMethod === "POST") {
      const postId = url.split("/posts/")[1].split("/comments")[0];
      const activeUser = getDemoUserByEmail(activeDemoEmail) || DEMO_COMMUNITY_PEOPLE[3];
      const data = getDemoCommunityData();
      let target = data.posts.find(p => p.id === postId) || DEMO_COMMUNITY_POSTS[0];
      const updated = { ...target };

      const newComment = {
        id: `c-${Date.now()}`,
        content: payload?.content || "Excellent message, merci pour ce partage !",
        createdAt: new Date().toISOString(),
        author: {
          id: activeUser.id || "user-viewer",
          name: activeUser.fullName || activeUser.name || "Membre NeuralConsult",
          username: activeUser.username || "membre_actif",
          profilePhotoUrl: activeUser.profilePhotoUrl || activeUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          role: activeUser.role || (activeUser.isDoctor ? "Médecin Tabacologue" : "Patient en Sevrage"),
          isDoctor: Boolean(activeUser.isDoctor),
          smokeFreeStatus: activeUser.smokeFreeStatus || "Suivi actif"
        },
        replies: []
      };

      if (payload?.parentCommentId) {
        updated.comments = (updated.comments || []).map(c => {
          if (c.id === payload.parentCommentId) {
            return { ...c, replies: [...(c.replies || []), newComment] };
          }
          return c;
        });
      } else {
        updated.comments = [...(updated.comments || []), newComment];
      }
      updated.commentsCount = (updated.commentsCount || 0) + 1;

      try {
        const stored = JSON.parse(localStorage.getItem("nc_demo_community_posts") || "[]");
        const idx = stored.findIndex(p => p.id === postId);
        if (idx >= 0) {
          stored[idx] = updated;
        } else {
          stored.unshift(updated);
        }
        localStorage.setItem("nc_demo_community_posts", JSON.stringify(stored));
      } catch (e) {}

      return updated;
    }

    // 7. Follow user toggle
    if (url.includes("/api/communities/social/users/") && url.includes("/follow")) {
      return { success: true, message: "Statut d'abonnement mis à jour." };
    }

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
      const activePatient = getDemoUserByEmail(activeDemoEmail) || DEMO_USERS.patient1;
      const userMessage = payload?.message || "Conseil clinique";
      const isEmergency = Boolean(
        payload?.emergencyMode ||
        userMessage.toLowerCase().includes("sos") ||
        userMessage.toLowerCase().includes("envie") ||
        userMessage.toLowerCase().includes("craquer") ||
        userMessage.toLowerCase().includes("fumer")
      );

      const aiReply = isDoctor
        ? `Consigne médicale enregistrée : « ${userMessage} ». L'assistant IA intègre cette directive au protocole du patient.`
        : isEmergency
        ? `🚨 ${activePatient.firstName || "Cher patient"}, asseyez-vous immédiatement et restez avec moi ! Prenez votre substitut nicotinique oral (gomme 2mg ou spray) tout de suite. Respirez lentement selon la méthode 4-7-8 : inspirez 4 secondes, bloquez 7 secondes, expirez 8 secondes. Votre pic de manque physique va chuter d'ici 3 minutes. Le Dr. Tantani a été notifié de votre alerte d'urgence en temps réel.`
        : `Je vous entends parfaitement. Vous avez déjà accompli un beau parcours : cette envie est temporaire et va disparaître rapidement. Prenez 3 inspirations lentes en cohérence cardiaque 4-7-8. Je reste à vos côtés !`;

      const newMsg = { id: `msg-${Date.now() - 50}`, senderType: isDoctor ? "DOCTOR" : "PATIENT", content: userMessage, createdAt: new Date().toISOString() };
      const aiMsg = { id: `msg-${Date.now()}`, senderType: "AI", content: aiReply, createdAt: new Date().toISOString(), riskLevel: isEmergency ? "CRITICAL" : "LOW" };

      // Persist to demo storage
      try {
        const storedKey = `nc_demo_conv_${activePatient.email}`;
        const existing = JSON.parse(localStorage.getItem(storedKey) || "[]");
        existing.push(newMsg, aiMsg);
        localStorage.setItem(storedKey, JSON.stringify(existing));

        if (isEmergency) {
          const alert = {
            id: `alt-${Date.now()}`,
            patientProfileId: activePatient.id || activePatient.patientProfile?.id,
            patientName: activePatient.fullName,
            patientEmail: activePatient.email,
            level: "CRITICAL",
            summary: `🚨 SOS Envie déclenché : « ${userMessage.slice(0, 80)}... »`,
            createdAt: new Date().toISOString(),
            status: "OPEN"
          };
          const existingAlerts = JSON.parse(localStorage.getItem("nc_demo_alerts") || "[]");
          existingAlerts.unshift(alert);
          localStorage.setItem("nc_demo_alerts", JSON.stringify(existingAlerts));
        }
      } catch (e) {}

      return {
        id: "conv-live",
        patientName: activePatient.fullName,
        latestRiskLevel: isEmergency ? "CRITICAL" : "FAIBLE",
        latestSummary: isEmergency ? "🚨 Urgence SOS Envie en cours" : "Accompagnement continu actif",
        messages: [newMsg, aiMsg]
      };
    }

    // 4. Fallback for any other POST/PUT/DELETE
    return { success: true, message: "Enregistrement effectué avec succès (Mode Démo Portfolio)." };
  }

  // ─── QUERIES (GET) ───

  if (url.includes("/api/communities/social/profile")) {
    const commData = getDemoCommunityData();
    return commData.viewer;
  }
  if (url.includes("/api/communities/social/users/")) {
    const userId = url.split("/users/")[1].split("?")[0];
    const person = DEMO_COMMUNITY_PEOPLE.find(p => p.id === userId) || DEMO_COMMUNITY_PEOPLE[0];
    const userPosts = DEMO_COMMUNITY_POSTS.filter(p => p.author?.id === userId || p.author?.username === person.username);
    return {
      user: person,
      posts: userPosts,
      followersCount: 42,
      followingCount: 15,
      isFollowing: false
    };
  }
  if (url.includes("/api/communities/social")) {
    return getDemoCommunityData();
  }
  if (url.includes("/api/communities/servers")) {
    return DEMO_COMMUNITY_SERVERS;
  }

  if (url.includes("/api/me")) {
    if (isDoctor) return DEMO_USERS.doctor;
    const p = getDemoUserByEmail(activeDemoEmail);
    return p || DEMO_USERS.patient1;
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
    let dynamicAlerts = [];
    try {
      dynamicAlerts = JSON.parse(localStorage.getItem("nc_demo_alerts") || "[]");
    } catch (e) {}
    return [...dynamicAlerts, ...DEMO_SUPPORT_ALERTS];
  }
  if (url.includes("/api/support/doctor/patients/")) {
    const match = url.match(/patients\/([^/]+)/);
    const patientId = match ? match[1] : "p0c70000-0000-0000-0000-000000000001";
    const dossier = createDemoDossier(patientId);
    let dynamicMsgs = [];
    try {
      dynamicMsgs = JSON.parse(localStorage.getItem(`nc_demo_conv_${dossier.patientEmail}`) || "[]");
    } catch (e) {}
    if (dynamicMsgs.length > 0) {
      dossier.supportConversation.messages = [...dossier.supportConversation.messages, ...dynamicMsgs];
    }
    return dossier.supportConversation;
  }
  if (url.includes("/api/support/current")) {
    const activePatient = getDemoUserByEmail(activeDemoEmail) || DEMO_USERS.patient1;
    const dossier = createDemoDossier(activePatient.id || activePatient.patientProfile?.id);
    let dynamicMsgs = [];
    try {
      dynamicMsgs = JSON.parse(localStorage.getItem(`nc_demo_conv_${activePatient.email}`) || "[]");
    } catch (e) {}
    if (dynamicMsgs.length > 0) {
      dossier.supportConversation.messages = [...dossier.supportConversation.messages, ...dynamicMsgs];
    }
    return dossier.supportConversation;
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
