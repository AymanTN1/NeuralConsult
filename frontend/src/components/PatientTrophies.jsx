import React, { useState } from "react";

export const ALL_CLINICAL_TROPHIES = [
  // ⏳ TEMPS DE LIBERTÉ (Paliers chronologiques)
  {
    id: "time_24h",
    category: "time",
    categoryLabel: "Temps",
    title: "Premier Pas",
    requirement: "24 heures sans fumer",
    requiredDays: 1,
    icon: "bi-star-fill",
    level: "Départ",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    color: "#10b981",
    clinicalBenefit: "Les premières 24 heures sont le cap le plus décisif. Le monoxyde de carbone sanguin est purgé et le cœur bat à un rythme normal.",
    doctorQuote: "Chaque heure gagnée est une brique posée pour votre nouvelle vie."
  },
  {
    id: "time_3d",
    category: "time",
    categoryLabel: "Temps",
    title: "Cap 72 Heures",
    requirement: "3 jours sans fumer",
    requiredDays: 3,
    icon: "bi-shield-shaded",
    level: "Bronze",
    gradient: "linear-gradient(135deg, #f97316, #b45309)",
    color: "#f97316",
    clinicalBenefit: "La nicotine a totalement quitté votre organisme. Le sevrage chimique aigu est maintenant derrière vous.",
    doctorQuote: "Le poison est dehors, votre volonté a pris le dessus !"
  },
  {
    id: "time_7d",
    category: "time",
    categoryLabel: "Temps",
    title: "Semaine d'Acier",
    requirement: "7 jours sans fumer",
    requiredDays: 7,
    icon: "bi-award-fill",
    level: "Argent Éclatant",
    gradient: "linear-gradient(135deg, #64748b, #334155)",
    color: "#38bdf8",
    clinicalBenefit: "Une semaine entière franchie ! Les papilles gustatives et les récepteurs olfactifs se régénèrent, les saveurs réapparaissent.",
    doctorQuote: "1 semaine d'arrêt multiplie par 9 vos chances de libération définitive."
  },
  {
    id: "time_14d",
    category: "time",
    categoryLabel: "Temps",
    title: "Guerrier du Souffle",
    requirement: "14 jours (2 semaines)",
    requiredDays: 14,
    icon: "bi-lungs-fill",
    level: "Argent Élite",
    gradient: "linear-gradient(135deg, #0284c7, #1e40af)",
    color: "#0284c7",
    clinicalBenefit: "La circulation sanguine dans les membres inférieurs s'est fluidifiée. Marcher et faire du sport redevient un plaisir.",
    doctorQuote: "Votre souffle profond est de retour. Vos alvéoles respirent à nouveau."
  },
  {
    id: "time_21d",
    category: "time",
    categoryLabel: "Temps",
    title: "Habitude Ancrée",
    requirement: "21 jours (3 semaines)",
    requiredDays: 21,
    icon: "bi-lightning-charge-fill",
    level: "Or 21J",
    gradient: "linear-gradient(135deg, #eab308, #ca8a04)",
    color: "#eab308",
    clinicalBenefit: "Principe de neuroplasticité : en 21 jours, le cerveau crée de nouvelles voies neuronales indépendantes du geste réflexe de la cigarette.",
    doctorQuote: "L'automatisme est brisé. Vous pilotez désormais votre liberté."
  },
  {
    id: "time_30d",
    category: "time",
    categoryLabel: "Temps",
    title: "Victoire d'Or",
    requirement: "1 mois (30 jours)",
    requiredDays: 30,
    icon: "bi-trophy-fill",
    level: "Or Majeur",
    gradient: "linear-gradient(135deg, #f59e0b, #b45309)",
    color: "#f59e0b",
    clinicalBenefit: "1 mois complet sans tabac ! La capacité pulmonaire augmente de 30%. Les quintes de toux matinales et les essoufflements ont disparu.",
    doctorQuote: "Un mois d'abstinence est le plus grand pivot clinique vers la victoire totale !"
  },
  {
    id: "time_60d",
    category: "time",
    categoryLabel: "Temps",
    title: "Bouclier de Résilience",
    requirement: "2 mois (60 jours)",
    requiredDays: 60,
    icon: "bi-shield-fill-check",
    level: "Platine",
    gradient: "linear-gradient(135deg, #06b6d4, #0e7490)",
    color: "#06b6d4",
    clinicalBenefit: "Le stress oxydatif cellulaire s'est normalisé. Le système immunitaire est renforcé et la peau a retrouvé tout son éclat.",
    doctorQuote: "Votre corps a inversé des années de toxicité."
  },
  {
    id: "time_90d",
    category: "time",
    categoryLabel: "Temps",
    title: "Palier Platine",
    requirement: "3 mois (1 trimestre)",
    requiredDays: 90,
    icon: "bi-gem",
    level: "Platine Élite",
    gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "#3b82f6",
    clinicalBenefit: "Les cils bronchiques ont entièrement repoussé, protégeant vos poumons contre toutes les infections et polluants extérieurs.",
    doctorQuote: "Un trimestre complet de pureté : vos poumons sont métamorphosés."
  },
  {
    id: "time_180d",
    category: "time",
    categoryLabel: "Temps",
    title: "Maître du Souffle",
    requirement: "6 mois sans tabac",
    requiredDays: 180,
    icon: "bi-flower1",
    level: "Diamant",
    gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    color: "#8b5cf6",
    clinicalBenefit: "La dépendance psychologique est éteinte. Vous vivez sans penser à la cigarette dans toutes vos activités quotidiennes.",
    doctorQuote: "Le sevrage n'est plus un combat quotidien, mais une fierté acquise."
  },
  {
    id: "time_365d",
    category: "time",
    categoryLabel: "Temps",
    title: "Renaissance Totale",
    requirement: "1 an de liberté",
    requiredDays: 365,
    icon: "bi-stars",
    level: "Légende",
    gradient: "linear-gradient(135deg, #ec4899, #be185d)",
    color: "#ec4899",
    clinicalBenefit: "Le risque d'infarctus du myocarde et d'AVC est réduit de 50%. Vos vaisseaux coronaires sont redevenus sains et souples.",
    doctorQuote: "Vous avez offert des années de vie supplémentaires à vous et à vos proches."
  },

  // 💰 ÉCONOMIES FINANCIÈRES (Cagnotte en DH)
  {
    id: "money_100",
    category: "money",
    categoryLabel: "Économies",
    title: "Première Tirelire",
    requirement: "100 DH épargnés",
    requiredAmount: 100,
    icon: "bi-coin",
    level: "Épargne",
    gradient: "linear-gradient(135deg, #10b981, #047857)",
    color: "#10b981",
    clinicalBenefit: "Le premier billet préservé. L'argent qui partait en fumée commence à construire vos projets concrets.",
    doctorQuote: "Chaque dirham économisé est un dirham investi dans votre avenir."
  },
  {
    id: "money_500",
    category: "money",
    categoryLabel: "Économies",
    title: "Cagnotte Réconfort",
    requirement: "500 DH épargnés",
    requiredAmount: 500,
    icon: "bi-wallet-fill",
    level: "Épargne",
    gradient: "linear-gradient(135deg, #059669, #065f46)",
    color: "#059669",
    clinicalBenefit: "500 DH épargnés ! C'est l'occasion de vous offrir une récompense saine (restaurant, loisir, sport).",
    doctorQuote: "Récompensez-vous, vous avez mérité ce cadeau !"
  },
  {
    id: "money_1000",
    category: "money",
    categoryLabel: "Économies",
    title: "Coffre-Fort Santé",
    requirement: "1 000 DH épargnés",
    requiredAmount: 1000,
    icon: "bi-bank",
    level: "Épargne",
    gradient: "linear-gradient(135deg, #0284c7, #0369a1)",
    color: "#0284c7",
    clinicalBenefit: "1 000 DH préservés du lobby du tabac. C'est l'équivalent d'un équipement sportif ou d'un week-end en famille.",
    doctorQuote: "Une étape financière remarquable et hautement symbolique."
  },
  {
    id: "money_2500",
    category: "money",
    categoryLabel: "Économies",
    title: "Trésor Réinvesti",
    requirement: "2 500 DH épargnés",
    requiredAmount: 2500,
    icon: "bi-safe2-fill",
    level: "Épargne",
    gradient: "linear-gradient(135deg, #7c3aed, #5b21b6)",
    color: "#7c3aed",
    clinicalBenefit: "Une véritable réserve de liberté financière. Un budget loisirs annuel qui se concrétise sans effort.",
    doctorQuote: "Votre portefeuille respire autant que vos poumons !"
  },

  // 🚭 CIGARETTES ÉVITÉES
  {
    id: "cigs_50",
    category: "cigarettes",
    categoryLabel: "Cigarettes",
    title: "Poumons Soulagés",
    requirement: "50 cigarettes évitées",
    requiredCigs: 50,
    icon: "bi-check-circle-fill",
    level: "Pureté",
    gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "#3b82f6",
    clinicalBenefit: "Deux paquets et demi de moins dans votre arbre respiratoire. Vos bronches ont évité des milliers de goudrons toxiques.",
    doctorQuote: "Chaque cigarette non fumée est une victoire pour votre cœur."
  },
  {
    id: "cigs_100",
    category: "cigarettes",
    categoryLabel: "Cigarettes",
    title: "Centenaire Purifié",
    requirement: "100 cigarettes évitées",
    requiredCigs: 100,
    icon: "bi-slash-circle-fill",
    level: "Pureté",
    gradient: "linear-gradient(135deg, #0284c7, #075985)",
    color: "#0284c7",
    clinicalBenefit: "Le cap des 100 cigarettes évitées ! Plus de 4 000 substances chimiques n'ont pas pénétré dans votre sang.",
    doctorQuote: "100 victoires consécutives contre l'illusion de la nicotine."
  },
  {
    id: "cigs_500",
    category: "cigarettes",
    categoryLabel: "Cigarettes",
    title: "Barrière Anti-Poison",
    requirement: "500 cigarettes évitées",
    requiredCigs: 500,
    icon: "bi-shield-slash",
    level: "Pureté",
    gradient: "linear-gradient(135deg, #f59e0b, #b45309)",
    color: "#f59e0b",
    clinicalBenefit: "Une cartouche et demie de cigarettes évitée. Vos parois artérielles ont échappé à une agression toxique massive.",
    doctorQuote: "Une montagne de goudrons évitée grâce à votre persévérance."
  },
  {
    id: "cigs_1000",
    category: "cigarettes",
    categoryLabel: "Cigarettes",
    title: "Légion de Pureté",
    requirement: "1 000 cigarettes évitées",
    requiredCigs: 1000,
    icon: "bi-patch-check-fill",
    level: "Pureté",
    gradient: "linear-gradient(135deg, #ec4899, #9d174d)",
    color: "#ec4899",
    clinicalBenefit: "1 000 cigarettes non fumées ! Vous avez littéralement protégé vos poumons de plusieurs litres de fumée dense et cancérigène.",
    doctorQuote: "Vous appartenez à l'élite des patients déterminés à vivre libres !"
  }
];

const PatientTrophies = ({
  diffDays = 0,
  realtimeMoney = 0,
  realtimeCigarettes = 0,
  timeElapsed = { days: 0, hours: 0, minutes: 0, seconds: 0 }
}) => {
  const [selectedTrophy, setSelectedTrophy] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "time" | "money" | "cigarettes" | "unlocked"

  // Evaluate unlock status and progression for each trophy
  const trophiesWithStatus = ALL_CLINICAL_TROPHIES.map((trophy) => {
    let unlocked = false;
    let progressPercent = 0;
    let currentVal = 0;
    let targetVal = 0;
    let unit = "";

    if (trophy.category === "time") {
      unlocked = diffDays >= trophy.requiredDays;
      currentVal = diffDays;
      targetVal = trophy.requiredDays;
      unit = "jours";
      progressPercent = Math.min(100, Math.round((diffDays / trophy.requiredDays) * 100));
    } else if (trophy.category === "money") {
      unlocked = realtimeMoney >= trophy.requiredAmount;
      currentVal = Math.floor(realtimeMoney);
      targetVal = trophy.requiredAmount;
      unit = "DH";
      progressPercent = Math.min(100, Math.round((realtimeMoney / trophy.requiredAmount) * 100));
    } else if (trophy.category === "cigarettes") {
      unlocked = realtimeCigarettes >= trophy.requiredCigs;
      currentVal = Math.floor(realtimeCigarettes);
      targetVal = trophy.requiredCigs;
      unit = "cig.";
      progressPercent = Math.min(100, Math.round((realtimeCigarettes / trophy.requiredCigs) * 100));
    }

    return {
      ...trophy,
      unlocked,
      progressPercent,
      currentVal,
      targetVal,
      unit
    };
  });

  const unlockedCount = trophiesWithStatus.filter((t) => t.unlocked).length;
  const totalCount = trophiesWithStatus.length;
  const currentLevel = Math.max(1, Math.floor(unlockedCount / 3) + 1);

  // Find next locked trophy closest to unlocking
  const lockedTrophies = trophiesWithStatus.filter((t) => !t.unlocked);
  const nextTrophy = [...lockedTrophies].sort((a, b) => b.progressPercent - a.progressPercent)[0];

  // Filtered trophies list
  const filteredTrophies = trophiesWithStatus.filter((t) => {
    if (filter === "unlocked") return t.unlocked;
    if (filter === "time") return t.category === "time";
    if (filter === "money") return t.category === "money";
    if (filter === "cigarettes") return t.category === "cigarettes";
    return true;
  });

  return (
    <div className="rewards-main-card">
      {/* Header with Level & Unlocked Count */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div>
          <span className="hero-kicker">
            <i className="bi bi-trophy-fill text-warning me-1"></i> Vos Victoires Cliniques & Récompenses
          </span>
          <h3 className="fw-bold text-dark mb-0">Sevrage Niveau {currentLevel}</h3>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold border border-primary border-opacity-15">
            <i className="bi bi-check-circle-fill me-1 text-success"></i> {unlockedCount} / {totalCount} Trophées Débloqués
          </span>
        </div>
      </div>

      <p className="text-secondary mb-3">
        Chaque heure sans fumer régénère vos organes et enrichit votre cagnotte de santé. Cliquez sur un trophée pour découvrir son impact médical.
      </p>

      {/* 📊 Compteurs en Temps Réel */}
      <div className="reward-ticker-grid mb-4">
        <div className="reward-ticker-card">
          <span className="ticker-label">💰 Cagnotte Économisée</span>
          <span className="ticker-value text-success">{realtimeMoney.toFixed(2)} DH</span>
          <span className="ticker-sub">Basé sur vos dépenses habituelles</span>
        </div>

        <div className="reward-ticker-card">
          <span className="ticker-label">🚭 Cigarettes Évitées</span>
          <span className="ticker-value text-primary">{Math.floor(realtimeCigarettes)} cig.</span>
          <span className="ticker-sub">Non consommées au total</span>
        </div>

        <div className="reward-ticker-card">
          <span className="ticker-label">⏳ Temps de Liberté</span>
          <span className="ticker-value text-dark" style={{ fontSize: "1.25rem", padding: "0.2rem 0" }}>
            {timeElapsed.days}j {timeElapsed.hours}h {timeElapsed.minutes}m {timeElapsed.seconds}s
          </span>
          <span className="ticker-sub">Compteur de liberté en direct</span>
        </div>
      </div>

      {/* 🎯 Spotlight on Next Milestone */}
      {nextTrophy && (
        <div className="trophy-spotlight-card mb-4" onClick={() => setSelectedTrophy(nextTrophy)} role="button">
          <div className="d-flex align-items-center gap-3">
            <div
              className="spotlight-icon-wrap"
              style={{
                background: nextTrophy.gradient,
                boxShadow: `0 4px 14px ${nextTrophy.color}40`
              }}
            >
              <i className={`bi ${nextTrophy.icon} text-white fs-4`}></i>
            </div>
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                <div>
                  <span className="badge rounded-pill bg-warning text-dark px-2 py-0.5 small fw-bold me-2">
                    🎯 Prochain Objectif
                  </span>
                  <strong className="text-dark">{nextTrophy.title}</strong>
                  <span className="text-muted ms-2 small">({nextTrophy.requirement})</span>
                </div>
                <span className="fw-bold" style={{ color: nextTrophy.color }}>
                  {nextTrophy.progressPercent}%
                </span>
              </div>
              <div className="progress" style={{ height: "7px", borderRadius: "999px" }}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{
                    width: `${nextTrophy.progressPercent}%`,
                    background: nextTrophy.gradient,
                    borderRadius: "999px"
                  }}
                />
              </div>
              <div className="d-flex justify-content-between text-muted small mt-1">
                <span>
                  Progression : {nextTrophy.currentVal} / {nextTrophy.targetVal} {nextTrophy.unit}
                </span>
                <span className="text-primary fw-semibold">
                  {nextTrophy.category === "time" && `${Math.max(1, Math.ceil(nextTrophy.targetVal - nextTrophy.currentVal))} jour(s) restant(s)`}
                  {nextTrophy.category === "money" && `Encore ${(nextTrophy.targetVal - nextTrophy.currentVal).toFixed(0)} DH`}
                  {nextTrophy.category === "cigarettes" && `Encore ${nextTrophy.targetVal - nextTrophy.currentVal} cig. évitées`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="trophy-filters d-flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          className={`btn btn-sm rounded-pill ${filter === "all" ? "btn-dark" : "btn-outline-secondary"}`}
          onClick={() => setFilter("all")}
        >
          Tous ({totalCount})
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-pill ${filter === "unlocked" ? "btn-success text-white" : "btn-outline-secondary"}`}
          onClick={() => setFilter("unlocked")}
        >
          <i className="bi bi-check2 me-1"></i> Débloqués ({unlockedCount})
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-pill ${filter === "time" ? "btn-dark" : "btn-outline-secondary"}`}
          onClick={() => setFilter("time")}
        >
          ⏳ Paliers de Temps (10)
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-pill ${filter === "money" ? "btn-dark" : "btn-outline-secondary"}`}
          onClick={() => setFilter("money")}
        >
          💰 Économies (4)
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-pill ${filter === "cigarettes" ? "btn-dark" : "btn-outline-secondary"}`}
          onClick={() => setFilter("cigarettes")}
        >
          🚭 Cigarettes (4)
        </button>
      </div>

      {/* Grid of Trophies */}
      <div className="trophies-shelf-grid">
        {filteredTrophies.map((trophy) => (
          <div
            key={trophy.id}
            className={`trophy-card-interactive ${trophy.unlocked ? "is-unlocked" : "is-locked"}`}
            onClick={() => setSelectedTrophy(trophy)}
            title={trophy.unlocked ? `Débloqué ! Cliquez pour détails : ${trophy.title}` : `Verrouillé (${trophy.progressPercent}%) - ${trophy.requirement}`}
            role="button"
            tabIndex={0}
          >
            <div
              className="trophy-badge-circle"
              style={{
                background: trophy.unlocked ? trophy.gradient : "rgba(148, 163, 184, 0.15)",
                color: trophy.unlocked ? "#ffffff" : "#94a3b8",
                boxShadow: trophy.unlocked ? `0 6px 18px ${trophy.color}45` : "none",
                border: trophy.unlocked ? "2px solid rgba(255,255,255,0.8)" : "2px dashed #cbd5e1"
              }}
            >
              <i className={`bi ${trophy.icon} trophy-main-icon`}></i>
              {!trophy.unlocked && (
                <div className="trophy-lock-indicator">
                  <i className="bi bi-lock-fill"></i>
                </div>
              )}
              {trophy.unlocked && (
                <div className="trophy-sparkle-indicator">
                  <i className="bi bi-stars"></i>
                </div>
              )}
            </div>
            <span className="trophy-card-title">{trophy.title}</span>
            <span className="trophy-card-req">{trophy.requirement}</span>
            {trophy.unlocked ? (
              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-0.5 small mt-1">
                Atteint ✓
              </span>
            ) : (
              <span className="badge rounded-pill bg-light text-secondary border px-2 py-0.5 small mt-1">
                {trophy.progressPercent}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 🏆 Modal de Détail Clinique du Trophée */}
      {selectedTrophy && (
        <div className="modal-backdrop-trophy" onClick={() => setSelectedTrophy(null)}>
          <div className="trophy-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="trophy-modal-head text-center">
              <div
                className="trophy-modal-big-badge"
                style={{
                  background: selectedTrophy.unlocked ? selectedTrophy.gradient : "rgba(148, 163, 184, 0.2)",
                  color: selectedTrophy.unlocked ? "#ffffff" : "#64748b",
                  boxShadow: selectedTrophy.unlocked ? `0 12px 32px ${selectedTrophy.color}50` : "none"
                }}
              >
                <i className={`bi ${selectedTrophy.icon}`}></i>
              </div>
              <h4 className="fw-bold mt-3 mb-1 text-dark">{selectedTrophy.title}</h4>
              <span className="badge rounded-pill bg-light text-secondary border px-3 py-1">
                {selectedTrophy.requirement}
              </span>
            </div>

            <div className="trophy-modal-body mt-3">
              <div className="d-flex justify-content-between align-items-center p-2.5 rounded-3 mb-3" style={{ background: "rgba(0,0,0,0.03)" }}>
                <span className="small text-secondary">Statut du trophée :</span>
                {selectedTrophy.unlocked ? (
                  <span className="badge bg-success rounded-pill px-3 py-1.5 fw-bold">
                    <i className="bi bi-check2-circle me-1"></i> DÉBLOQUÉ
                  </span>
                ) : (
                  <span className="badge bg-warning text-dark rounded-pill px-3 py-1.5 fw-bold">
                    <i className="bi bi-hourglass-split me-1"></i> EN COURS ({selectedTrophy.progressPercent}%)
                  </span>
                )}
              </div>

              <div className="mb-3">
                <label className="fw-bold text-dark small d-flex align-items-center gap-1.5 mb-1">
                  <i className="bi bi-clipboard2-pulse text-primary"></i> Impact Clinique & Restauration
                </label>
                <p className="small text-secondary mb-0 bg-light p-3 rounded-3 border">
                  {selectedTrophy.clinicalBenefit}
                </p>
              </div>

              <div className="mb-3">
                <label className="fw-bold text-dark small d-flex align-items-center gap-1.5 mb-1">
                  <i className="bi bi-chat-quote-fill text-warning"></i> Mot d'encouragement de l'équipe
                </label>
                <blockquote className="small text-muted fst-italic mb-0 p-2.5 border-start border-3 border-warning bg-light rounded-end">
                  « {selectedTrophy.doctorQuote} »
                </blockquote>
              </div>
            </div>

            <div className="trophy-modal-footer mt-4 d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-dark rounded-pill px-4"
                onClick={() => setSelectedTrophy(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTrophies;
