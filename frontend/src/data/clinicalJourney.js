export const CLINICAL_PHASES = [
  {
    id: 1,
    slug: "social-personal",
    title: "Contexte personnel et alliance de soin",
    label: "Phase 1",
    questionRange: "Q1-Q11",
    summary: "Identite, rythme de vie, entourage tabagique, objectif de consultation et premiers elements du dossier patient.",
    goals: [
      "Constituer une base sociodemographique fiable.",
      "Comprendre l'objectif du patient et le contexte du foyer.",
      "Poser les bases de l'alliance therapeutique."
    ]
  },
  {
    id: 2,
    slug: "medical-history",
    title: "Risques medicaux et antecedents",
    label: "Phase 2",
    questionRange: "Q12-Q17",
    summary: "Facteurs de risque cardiovasculaires, antecedents respiratoires, cancers et traitements en cours.",
    goals: [
      "Identifier les risques somatiques majeurs.",
      "Faire remonter les points de vigilance cliniques.",
      "Orienter plus finement la prise en charge."
    ]
  },
  {
    id: 3,
    slug: "smoking-habits",
    title: "Habitudes tabagiques et vapotage",
    label: "Phase 3",
    questionRange: "Q18-Q27",
    summary: "Consommation actuelle, type de produits, arrets precedents, reduction recente et usage d'e-cigarette.",
    goals: [
      "Mesurer les habitudes tabagiques actuelles.",
      "Differencier tabac, autres produits et vapotage.",
      "Ancrer les donnees comportementales du sevrage."
    ]
  },
  {
    id: 4,
    slug: "dependency-score",
    title: "Dependance nicotinique",
    label: "Phase 4",
    questionRange: "Q28-Q30",
    summary: "Lecture du score officiel de Fagerstrom pour objectiver la dependance physique a la nicotine.",
    goals: [
      "Quantifier la dependance physique a la nicotine.",
      "Rendre visible le niveau de dependance.",
      "Preparer l'orientation therapeutique."
    ]
  },
  {
    id: 5,
    slug: "social-vulnerability",
    title: "Vulnerabilites sociales et co-addictions",
    label: "Phase 5",
    questionRange: "EPICES / AUDIT / CAGE",
    summary: "Motivation, alcool, cannabis, fragilites sociales et facteurs susceptibles de compliquer le sevrage.",
    goals: [
      "Evaluer les fragilites sociales et les co-addictions.",
      "Completer le contexte comportemental du sevrage.",
      "Fiabiliser la stratification du plan de prise en charge."
    ]
  }
];

export const LANDING_MILESTONES = [
  { label: "Un week-end de recuperation", amount: 1200, icon: "bi bi-geo-alt" },
  { label: "Un ordinateur", amount: 6500, icon: "bi bi-laptop" },
  { label: "Un voyage", amount: 12000, icon: "bi bi-airplane" },
  { label: "Un projet personnel", amount: 22000, icon: "bi bi-stars" }
];

export const CO2_PER_CIGARETTE_KG = 0.014;
