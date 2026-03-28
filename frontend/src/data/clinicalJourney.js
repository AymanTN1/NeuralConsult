export const CLINICAL_PHASES = [
  {
    id: 1,
    slug: "social-personal",
    title: "Social & Personal Context",
    label: "Phase 1",
    questionRange: "Q1-Q11",
    summary: "Identite, contexte de vie, objectif, et premiers marqueurs du dossier tabacologique.",
    goals: [
      "Constituer le dossier sociodemographique du patient.",
      "Comprendre le contexte de consultation et l'entourage tabagique.",
      "Poser les bases de l'alliance therapeutique."
    ]
  },
  {
    id: 2,
    slug: "medical-history",
    title: "Medical Risks & History",
    label: "Phase 2",
    questionRange: "Q12-Q17",
    summary: "Facteurs de risque, antecedents cardiovasculaires, respiratoires, oncologiques et traitements.",
    goals: [
      "Identifier les risques somatiques majeurs.",
      "Distinguer les antecedents impactant le sevrage.",
      "Faire remonter les alertes a forte priorite clinique."
    ]
  },
  {
    id: 3,
    slug: "smoking-habits",
    title: "Smoking Habits & E-Cig",
    label: "Phase 3",
    questionRange: "Q18-Q27",
    summary: "Consommation actuelle, produits tabagiques, arrets precedents et usage de cigarette electronique.",
    goals: [
      "Mesurer les habitudes tabagiques actuelles.",
      "Differencier consommation quotidienne, autres produits et vapotage.",
      "Ancrer les donnees brutes du parcours de sevrage."
    ]
  },
  {
    id: 4,
    slug: "dependency-score",
    title: "Dependency Scoring",
    label: "Phase 4",
    questionRange: "Q28-Q30",
    summary: "Score officiel de Fagerstrom pour quantifier la dependance physique a la nicotine.",
    goals: [
      "Calculer la dependance physique a partir des reponses officielles.",
      "Rendre visible le niveau de risque au patient et au clinicien.",
      "Preparer l'orientation therapeutique."
    ]
  },
  {
    id: 5,
    slug: "social-vulnerability",
    title: "Social Vulnerability & Co-Addictions",
    label: "Phase 5",
    questionRange: "EPICES / AUDIT / CAGE",
    summary: "Motivation, alcool, cannabis, vulnerabilite sociale et facteurs de maintien de la dependance.",
    goals: [
      "Evaluer les fragilites sociales et les co-addictions.",
      "Completer le contexte comportemental du sevrage.",
      "Fiabiliser la stratification du plan de prise en charge."
    ]
  }
];

export const LANDING_MILESTONES = [
  { label: "Un week-end respiration", amount: 1200, icon: "bi bi-geo-alt" },
  { label: "Un ordinateur", amount: 6500, icon: "bi bi-laptop" },
  { label: "Un voyage", amount: 12000, icon: "bi bi-airplane" },
  { label: "Un scooter", amount: 22000, icon: "bi bi-bicycle" }
];

export const CO2_PER_CIGARETTE_KG = 0.014;
