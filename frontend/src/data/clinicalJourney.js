export const CLINICAL_PHASES = [
  {
    id: 1,
    slug: "social-personal",
    title: "Contexte personnel et alliance de soin",
    label: "Phase 1",
    questionRange: "Q1-Q11",
    summary: "Identité, rythme de vie, environnement tabagique, objectifs et fondations du dossier médical patient.",
    goals: [
      "Constituer une base sociodémographique fiable et sécurisée.",
      "Comprendre les motivations profondes et l'environnement quotidien.",
      "Sceller l'alliance thérapeutique et la confiance médicale."
    ]
  },
  {
    id: 2,
    slug: "medical-history",
    title: "Risques médicaux et antécédents",
    label: "Phase 2",
    questionRange: "Q12-Q17",
    summary: "Facteurs de risque cardiovasculaires, antécédents respiratoires, comorbidités et traitements en cours.",
    goals: [
      "Identifier les facteurs de vulnérabilité somatique prioritaires.",
      "Signaler les points de vigilance clinique et interactions.",
      "Adapter le protocole thérapeutique de sevrage avec précision."
    ]
  },
  {
    id: 3,
    slug: "smoking-habits",
    title: "Habitudes tabagiques et vapotage",
    label: "Phase 3",
    questionRange: "Q18-Q27",
    summary: "Consommation actuelle, typologie des produits, antécédents d'arrêt et recours éventuel au vapotage.",
    goals: [
      "Quantifier avec précision la consommation tabagique journalière.",
      "Distinguer tabac manufacturé, roulé, chicha et cigarette électronique.",
      "Cartographier les déclencheurs comportementaux et rituels clés."
    ]
  },
  {
    id: 4,
    slug: "dependency-score",
    title: "Dépendance nicotinique (Fagerström)",
    label: "Phase 4",
    questionRange: "Q28-Q30",
    summary: "Évaluation du score officiel de Fagerström pour objectiver scientifiquement la dépendance pharmacologique.",
    goals: [
      "Mesurer le niveau de dépendance physique à la nicotine.",
      "Ajuster le dosage des substituts nicotiniques (TSN).",
      "Sécuriser la prise de décision du médecin traitant."
    ]
  },
  {
    id: 5,
    slug: "social-vulnerability",
    title: "Vulnérabilités sociales & Co-addictions",
    label: "Phase 5",
    questionRange: "EPICES / AUDIT / CAGE",
    summary: "Niveau de stress, score d'anxiété, consommation d'alcool ou cannabis et facteurs psycho-sociaux.",
    goals: [
      "Dépister les fragilités psycho-sociales et co-facteurs addictifs.",
      "Prévenir les risques de rechute liés au stress ou à l'anxiété.",
      "Personnaliser l'accompagnement holistique du sevrage."
    ]
  }
];

export const LANDING_MILESTONES = [
  { label: "Un week-end de récupération", amount: 1200, icon: "bi bi-geo-alt-fill" },
  { label: "Un ordinateur portable", amount: 6500, icon: "bi bi-laptop-fill" },
  { label: "Un voyage régénérant", amount: 12000, icon: "bi bi-airplane-fill" },
  { label: "Un grand projet personnel", amount: 22000, icon: "bi bi-stars" }
];

export const CO2_PER_CIGARETTE_KG = 0.014;

