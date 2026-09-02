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
    patientProfile: null,
    scores: null,
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
    patientProfile: {
      id: "prof-001",
      onboardingComplete: true,
      cigarettesPerDay: 0,
      packPrice: 38,
      smokeFreeStartDate: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
      fagerstromScore: 0,
      hadAnxietyScore: 2,
      hadDepressionScore: 1
    },
    scores: {
      fagerstrom: 0,
      hadAnxiety: 2,
      hadDepression: 1
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
      date: dateStr,
      cigarettesSmoked: cigs,
      cravingIntensity: craving,
      stressLevel: stress,
      moodLevel: mood,
      notes: i === 0 ? "Journée formidable, souffle très dégagé après ma séance de sport !" : "Suivi régulier du plan.",
      createdAt: d.toISOString()
    });
  }
  return reports;
};

// Generate historical Fagerström & HAD tests
export const generateDemoTests = () => {
  const fagerstrom = [
    { id: "fag-1", score: 7, level: "DÉPENDANCE FORTE", createdAt: new Date(Date.now() - 35 * 86400000).toISOString() },
    { id: "fag-2", score: 5, level: "DÉPENDANCE MOYENNE", createdAt: new Date(Date.now() - 28 * 86400000).toISOString() },
    { id: "fag-3", score: 3, level: "DÉPENDANCE FAIBLE", createdAt: new Date(Date.now() - 21 * 86400000).toISOString() },
    { id: "fag-4", score: 1, level: "TRÈS FAIBLE", createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
    { id: "fag-5", score: 0, level: "NON DÉPENDANT", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() }
  ];

  const had = [
    { id: "had-1", anxietyScore: 11, depressionScore: 7, anxietyLevel: "SYMPTOMATOLOGIE AVERÉE", depressionLevel: "DOUTEUSE", createdAt: new Date(Date.now() - 35 * 86400000).toISOString() },
    { id: "had-2", anxietyScore: 8, depressionScore: 5, anxietyLevel: "DOUTEUSE", depressionLevel: "ABSENCE", createdAt: new Date(Date.now() - 28 * 86400000).toISOString() },
    { id: "had-3", anxietyScore: 6, depressionScore: 4, anxietyLevel: "ABSENCE", depressionLevel: "ABSENCE", createdAt: new Date(Date.now() - 21 * 86400000).toISOString() },
    { id: "had-4", anxietyScore: 3, depressionScore: 2, anxietyLevel: "ABSENCE", depressionLevel: "ABSENCE", createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
    { id: "had-5", anxietyScore: 1, depressionScore: 1, anxietyLevel: "ABSENCE", depressionLevel: "ABSENCE", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() }
  ];

  return { fagerstrom, had };
};

// Demo Sevrage Plan
export const DEMO_SEVRAGE_PLAN = {
  id: "plan-demo-001",
  intensity: "MODERATE",
  summary: "Plan de sevrage progressif personnalisé avec substitution nicotinique combinée (patch 21mg + gommes 2mg) et soutien TCC comportemental.",
  nrtRecommendation: "Patch transdermique 21mg/24h le matin au réveil + gommes 2mg en cas de craving aigu (max 8/jour).",
  behavioralRecommendations: "Cohérence cardiaque 4-7-8 avant chaque café matinal, verre d'eau fraîche réflexe lors des envies, marche active quotidienne 20 minutes.",
  followUpPlan: "Téléconsultation de contrôle tous les 15 jours avec mesure du CO expiré et ajustement des paliers.",
  relapseProtocol: "En cas de tentation ou faux-pas, activer le bouton SOS Envie dans l'application et contacter le Dr. Tantani.",
  startDate: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
  targetQuitDate: new Date(Date.now() - 20 * 86400000).toISOString().split("T")[0],
  steps: [
    "Étape 1 : Cartographie des déclencheurs et préparation du domicile sans tabac",
    "Étape 2 : Pose du premier patch 21mg et démarrage du journal quotidien",
    "Étape 3 : Passage réussi du cap des 7 premiers jours sans aucune cigarette",
    "Étape 4 : Déconditionnement du rituel café-tabac avec les substituts oraux",
    "Étape 5 : Consolidation de l'abstinence et stabilisation du souffle"
  ]
};

// Demo Patients for Doctor Workspace
export const DEMO_DOCTOR_PATIENTS = [
  {
    id: "p0c70000-0000-0000-0000-000000000001",
    name: "Youssef El Fassi",
    email: "tantaniayman0@gmail.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    age: 31,
    status: "SUCCÈS STABLE (J+30)",
    statusType: "success",
    daysSmokeFree: 30,
    cigarettesPerDayBefore: 15,
    currentCigarettes: 0,
    fagerstromScore: 0,
    hadAnxietyScore: 2,
    riskLevel: "FAIBLE",
    lastReportDate: "Aujourd'hui",
    aiSummary: "Patient très observant avec excellente adhésion au patch 14mg. Craving résiduel quasi nul. Félicitations pour le premier mois validé !",
    treatment: "Patch Nicopatch 14mg/24h + Pastilles 2mg au besoin"
  },
  {
    id: "pat-002",
    name: "Karim Bennani",
    email: "karim.bennani@demo.ma",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    age: 42,
    status: "RISQUE DE RECHUTE",
    statusType: "warning",
    daysSmokeFree: 4,
    cigarettesPerDayBefore: 25,
    currentCigarettes: 2,
    fagerstromScore: 6,
    hadAnxietyScore: 9,
    riskLevel: "ÉLEVÉ",
    lastReportDate: "Hier 22h",
    aiSummary: "Pic d'anxiété professionnelle rapporté. Faux-pas de 2 cigarettes hier soir. Recommandation : adapter le dosage de nicotine et planifier une téléconsultation.",
    treatment: "Patch Nicorette 21mg/24h + Spray buccal"
  },
  {
    id: "pat-003",
    name: "Fatima Zahra Mansouri",
    email: "fatima.mansouri@demo.ma",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    age: 28,
    status: "EN PROGRESSION (J+14)",
    statusType: "primary",
    daysSmokeFree: 14,
    cigarettesPerDayBefore: 12,
    currentCigarettes: 0,
    fagerstromScore: 2,
    hadAnxietyScore: 4,
    riskLevel: "MODÉRÉ",
    lastReportDate: "Aujourd'hui",
    aiSummary: "Évolution favorable. Pratique régulière de la cohérence cardiaque. Légers troubles du sommeil à surveiller.",
    treatment: "Gommes à mâcher 4mg"
  },
  {
    id: "pat-004",
    name: "Mehdi Alami",
    email: "mehdi.alami@demo.ma",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    age: 36,
    status: "ANXIÉTÉ SÉVÈRE",
    statusType: "danger",
    daysSmokeFree: 2,
    cigarettesPerDayBefore: 20,
    currentCigarettes: 4,
    fagerstromScore: 7,
    hadAnxietyScore: 12,
    riskLevel: "CRITIQUE",
    lastReportDate: "Aujourd'hui 08h",
    aiSummary: "Score HAD anxiété au plafond (12/21). Besoin d'un renforcement du soutien psychologique TCC d'urgence.",
    treatment: "Patch 21mg + Thérapie TCC active"
  },
  {
    id: "pat-005",
    name: "Hajj Said Tazi",
    email: "said.tazi@demo.ma",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    age: 58,
    status: "SUIVI SENIOR (J+60)",
    statusType: "success",
    daysSmokeFree: 60,
    cigarettesPerDayBefore: 30,
    currentCigarettes: 0,
    fagerstromScore: 0,
    hadAnxietyScore: 1,
    riskLevel: "FAIBLE",
    lastReportDate: "Il y a 2 jours",
    aiSummary: "Sevrage consolidé. Amélioration respiratoire majeure (+35% de capacité spirométrique). Diminution du palier nicotinique en cours.",
    treatment: "Patch 7mg (sevrage final)"
  }
];

// Demo Appointments
export const DEMO_APPOINTMENTS = [
  {
    id: "apt-demo-01",
    startsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    durationMinutes: 30,
    status: "CONFIRMED",
    reason: "Consultation de suivi M+1 : Bilan biologique, contrôle du monoxyde de carbone et consolidation du sevrage.",
    doctorName: "Dr. Ayman Tantani",
    doctorSpecialty: "Tabacologue & Médecin Référent",
    patientName: "Youssef El Fassi",
    meetingProvider: "JITSI",
    meetingRoomName: "NeuralConsult-Sevrage-Suivi-Youssef-Tantani",
    meetingJoinUrl: "https://meet.jit.si/NeuralConsult-Sevrage-Suivi-Youssef-Tantani",
    triggeredByAiAlert: false
  }
];

// Mock handler for api.js
export const handleDemoMockRequest = (url, method = "GET") => {
  const activeDemoEmail = typeof window !== "undefined" ? localStorage.getItem("nc_active_demo_email") : null;
  const isDoctor = activeDemoEmail === "ayman.tantani@uit.ac.ma";

  if (url.includes("/api/me")) {
    return isDoctor ? DEMO_USERS.doctor : DEMO_USERS.patient;
  }
  if (url.includes("/api/doctors/profile/me")) {
    return {
      id: "doc-prof-01",
      user: DEMO_USERS.doctor,
      specialty: "Tabacologue & Addictologue",
      rppsNumber: "10109876543",
      city: "Rabat / Télémédecine",
      experienceYears: 12,
      consultationPrice: 50,
      bio: "Médecin spécialiste en tabacologie clinique et addictologie comportementale. Accompagnement bienveillant et protocoles validés HAS / OMS."
    };
  }
  if (url.includes("/api/doctors/patients") || url.includes("/api/doctor/patients")) {
    return DEMO_DOCTOR_PATIENTS;
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
  if (url.includes("/api/appointments")) {
    return DEMO_APPOINTMENTS;
  }
  if (url.includes("/api/doctors")) {
    return [
      {
        id: "doc-01",
        user: DEMO_USERS.doctor,
        specialty: "Tabacologue & Addictologue",
        city: "Rabat",
        experienceYears: 12,
        consultationPrice: 50
      },
      {
        id: "doc-02",
        user: { fullName: "Dr. Sarah Lahlou", email: "dr.lahlou@neural.ma" },
        specialty: "Pneumologue & Tabacologue",
        city: "Casablanca",
        experienceYears: 15,
        consultationPrice: 50
      }
    ];
  }
  if (url.includes("/api/notifications")) {
    return { unreadCount: 1, items: [{ id: "notif-1", title: "Rappel Téléconsultation", message: "Consultation avec le Dr. Tantani dans 3 jours.", read: false }] };
  }
  return null;
};
