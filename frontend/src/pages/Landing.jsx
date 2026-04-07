import React, { Suspense, lazy, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PhaseSpotlightModal from "../components/landing/PhaseSpotlightModal";
import { CLINICAL_PHASES, CO2_PER_CIGARETTE_KG, LANDING_MILESTONES } from "../data/clinicalJourney";

const CinematicLandingScene = lazy(() => import("../components/landing/CinematicLandingScene"));
const DEFAULT_PHASE = CLINICAL_PHASES[0];

const defaultCalculator = {
  cigarettesPerDay: 20,
  cigarettesPerPack: 20,
  packPrice: 42
};

const commandCards = [
  {
    title: "Dossier de premiere consultation",
    copy:
      "Le parcours initialise d'abord l'identite patient, puis structure l'evaluation tabacologique, psychologique et sociale dans un ordre compatible avec la pratique clinique.",
    icon: "bi bi-clipboard2-pulse"
  },
  {
    title: "Synthese et aide medicale",
    copy:
      "Les donnees brutes sont ensuite transformees en scores, notes et pistes therapeutiques utiles pour le medecin sans perdre la trace des reponses d'origine.",
    icon: "bi bi-cpu"
  }
];

const interruptionBlocks = [
  {
    kicker: "Repere clinique",
    title: "Arreter de fumer ne se resume pas a diminuer des cigarettes.",
    copy:
      "Le sevrage tabagique engage a la fois la dependance physique, les facteurs anxieux, les automatismes du quotidien et le contexte social du patient."
  },
  {
    kicker: "Alliance therapeutique",
    title: "Le patient a besoin d'un espace qui rassure avant de convaincre.",
    copy:
      "L'interface met en avant un langage clinique apaisant, des etapes lisibles et un accompagnement guide pour limiter l'evitement, le stress et la confusion."
  },
  {
    kicker: "Projection",
    title: "Chaque jour sans tabac doit devenir visible, compréhensible et concret.",
    copy:
      "Economies, respiration, progression HAD, dependance et suivi quotidien sont utilises comme marqueurs de progression pour soutenir la motivation."
  }
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);

const Landing = () => {
  const pageRef = useRef(null);
  const sceneScrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [pageScrollProgress, setPageScrollProgress] = useState(0);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [hoveredPhase, setHoveredPhase] = useState(DEFAULT_PHASE);
  const [calculator, setCalculator] = useState(defaultCalculator);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sceneScrollRef.current,
        start: "top top",
        end: "bottom center",
        scrub: true,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
          setScrollVelocity(Math.abs(self.getVelocity()));
        }
      });

      ScrollTrigger.create({
        trigger: pageRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          setPageScrollProgress(self.progress);
        }
      });
    }, pageRef);

    return () => context.revert();
  }, []);

  const impact = useMemo(() => {
    const cigarettesPerDay = Number(calculator.cigarettesPerDay) || 0;
    const cigarettesPerPack = Number(calculator.cigarettesPerPack) || 20;
    const packPrice = Number(calculator.packPrice) || 0;
    const packsPerDay = cigarettesPerPack > 0 ? cigarettesPerDay / cigarettesPerPack : 0;
    const dailySpend = packsPerDay * packPrice;
    const monthlySavings = dailySpend * 30;
    const yearlySavings = dailySpend * 365;
    const yearlyCo2Kg = cigarettesPerDay * 365 * CO2_PER_CIGARETTE_KG;
    const unlockedMilestones = LANDING_MILESTONES.filter((milestone) => yearlySavings >= milestone.amount);
    const nextMilestone = LANDING_MILESTONES.find((milestone) => yearlySavings < milestone.amount);

    return {
      monthlySavings,
      yearlySavings,
      yearlyCo2Kg,
      unlockedMilestones,
      nextMilestone
    };
  }, [calculator]);

  const handleCalculatorChange = (event) => {
    const { name, value } = event.target;
    setCalculator((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const velocityLevel = Math.min(scrollVelocity / 1800, 1);
  const roadmapPhase = hoveredPhase || selectedPhase || DEFAULT_PHASE;
  const heroCopyVisibility = Math.max(0.08, 1 - pageScrollProgress * 3.8);

  return (
    <div className="landing-cinematic" ref={pageRef}>
      <div className="landing-persistent-scene" aria-hidden="true">
        <Suspense fallback={<div className="landing-scene-fallback">Preparation de la visualisation clinique...</div>}>
          <CinematicLandingScene
            progress={scrollProgress}
            scrollVelocity={velocityLevel}
            copyVisibility={heroCopyVisibility}
          />
        </Suspense>
      </div>

      <section className="landing-scroll-theater landing-scroll-theater-persistent" ref={sceneScrollRef}>
        <div className="landing-scroll-copy-anchor" />
      </section>

      <section className="landing-command-section">
        <div className="container command-section-inner">
          <div className="command-section-head">
            <div className="hero-kicker">Accompagnement structure</div>
            <h2 className="section-title">
              Un cadre medical calme.
              <br />
              Un sevrage lisible des la premiere minute.
            </h2>
            <p className="muted-text">
              NeuralConsult Sevrage relie impact concret, parcours de consultation, scoring officiel et lecture clinique
              dans une experience qui rassure le patient et facilite la decision therapeutique.
            </p>
          </div>

          <div className="landing-command-grid">
            <div className="landing-command-card landing-command-card-impact">
              <div className="landing-command-card-head">
                <span className="landing-command-badge">Projection patient</span>
                <strong>Impact financier et environnemental</strong>
              </div>

              <div className="landing-command-body">
                <div className="landing-calculator-grid">
                  <label className="impact-field">
                    <span>Cigarettes par jour</span>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      name="cigarettesPerDay"
                      value={calculator.cigarettesPerDay}
                      onChange={handleCalculatorChange}
                    />
                  </label>
                  <label className="impact-field">
                    <span>Cigarettes par paquet</span>
                    <input
                      className="form-control"
                      type="number"
                      min="1"
                      name="cigarettesPerPack"
                      value={calculator.cigarettesPerPack}
                      onChange={handleCalculatorChange}
                    />
                  </label>
                  <label className="impact-field">
                    <span>Prix du paquet (DH)</span>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.1"
                      name="packPrice"
                      value={calculator.packPrice}
                      onChange={handleCalculatorChange}
                    />
                  </label>
                </div>

                <div className="landing-command-stats">
                  <div className="landing-command-stat">
                    <span>Economies mensuelles</span>
                    <strong>{formatCurrency(impact.monthlySavings)} DH</strong>
                  </div>
                  <div className="landing-command-stat">
                    <span>Economies annuelles</span>
                    <strong>{formatCurrency(impact.yearlySavings)} DH</strong>
                  </div>
                  <div className="landing-command-stat">
                    <span>CO2 evite / an</span>
                    <strong>{impact.yearlyCo2Kg.toFixed(0)} kg</strong>
                  </div>
                </div>

                <div className="landing-command-milestones">
                  {LANDING_MILESTONES.map((milestone) => {
                    const unlocked = impact.unlockedMilestones.some((item) => item.label === milestone.label);
                    return (
                      <div key={milestone.label} className={`landing-command-milestone ${unlocked ? "is-unlocked" : ""}`}>
                        <i className={milestone.icon} />
                        <div>
                          <strong>{milestone.label}</strong>
                          <span>{formatCurrency(milestone.amount)} DH</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="landing-command-reset">
                  <button className="btn btn-outline-dark" type="button" onClick={() => setCalculator(defaultCalculator)}>
                    Reinitialiser
                  </button>
                  <span className="muted-text">
                    {impact.nextMilestone
                      ? `Prochain palier motive: ${impact.nextMilestone.label}`
                      : "Tous les paliers de projection proposes sont atteints"}
                  </span>
                </div>
              </div>
            </div>

            <div className="landing-command-card landing-command-card-auth">
              <div className="landing-command-card-head">
                <span className="landing-command-badge">Acces structure</span>
                <strong>Entrer dans l'espace clinique</strong>
              </div>

              <div className="landing-auth-module">
                <h3>Premier acces patient, medecin et administrateur</h3>
                <p>
                  Le patient commence par son profil personnel puis son evaluation initiale. Le medecin renseigne son
                  profil des l'inscription et devient visible seulement apres validation administrateur.
                </p>

                <div className="landing-auth-actions">
                  <Link to="/login" className="btn btn-dark btn-lg">
                    Se connecter
                  </Link>
                  <Link to="/register" className="btn btn-outline-dark btn-lg">
                    Creer un compte
                  </Link>
                </div>

                <div className="landing-auth-tags">
                  {commandCards.map((card) => (
                    <div key={card.title} className="landing-auth-tag">
                      <i className={card.icon} />
                      <div>
                        <strong>{card.title}</strong>
                        <p>{card.copy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-interruption-cinematic">
        <div className="container interruption-cinematic-inner">
          {interruptionBlocks.map((block) => (
            <article key={block.kicker} className="interruption-cinematic-card">
              <span>{block.kicker}</span>
              <h3>{block.title}</h3>
              <p>{block.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-roadmap-centered">
        <div className="container roadmap-centered-inner">
          <div className="roadmap-centered-head">
            <div className="hero-kicker">Parcours de consultation</div>
            <h2 className="section-title">
              Une timeline plus lisible.
              <br />
              Des phases qui s'expliquent d'elles-memes.
            </h2>
            <p className="muted-text">
              Chaque phase du protocole s'ouvre comme un repere clinique. Le patient comprend la logique du parcours,
              le medecin retrouve immediatement l'objectif de chaque bloc d'information.
            </p>
          </div>

          <div className="landing-roadmap-vertical">
            {CLINICAL_PHASES.map((phase) => (
              <button
                key={phase.id}
                type="button"
                className={`landing-roadmap-row ${selectedPhase?.id === phase.id ? "is-selected" : ""}`}
                onClick={() => setSelectedPhase(phase)}
                onMouseEnter={() => setHoveredPhase(phase)}
                onFocus={() => setHoveredPhase(phase)}
                onMouseLeave={() => setHoveredPhase(selectedPhase || DEFAULT_PHASE)}
                aria-label={`${phase.label} ${phase.title}`}
              >
                <div className="landing-roadmap-row-phase">{phase.label}</div>
                <div className="landing-roadmap-row-line">
                  <span className="landing-roadmap-row-node" />
                </div>
                <div className="landing-roadmap-row-card">
                  <span className="landing-roadmap-row-kicker">Etape clinique</span>
                  <strong>{phase.title}</strong>
                  <p>{phase.summary}</p>
                  <div className="landing-roadmap-row-preview">
                    {phase.goals.slice(0, 2).map((goal) => (
                      <span key={goal} className="landing-roadmap-row-chip">
                        <i className="bi bi-check2-circle" />
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="landing-roadmap-hover-console" aria-live="polite">
            <div className="landing-roadmap-hover-head">
              <div>
                <span className="landing-roadmap-hover-kicker">{roadmapPhase.label}</span>
                <h3>{roadmapPhase.title}</h3>
              </div>
              <span className="landing-roadmap-hover-range">Objectifs cliniques</span>
            </div>
            <p className="landing-roadmap-hover-summary">{roadmapPhase.summary}</p>
            <div className="landing-roadmap-hover-goals">
              {roadmapPhase.goals.map((goal) => (
                <div key={goal} className="landing-roadmap-hover-goal">
                  <i className="bi bi-activity" />
                  <span>{goal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-final-cta">
        <div className="container landing-final-cta-inner">
          <div>
            <div className="hero-kicker">Slogan clinique</div>
            <h2 className="section-title">
              Chaque souffle retrouve sa place.
              <br />
              Chaque jour sans tabac doit devenir visible.
            </h2>
            <p className="muted-text">
              Une interface plus calme pour engager, une evaluation plus claire pour comprendre, un dossier plus
              complet pour aider le medecin a decider vite et juste.
            </p>
          </div>

          <div className="landing-final-actions">
            <Link to="/register" className="btn btn-dark btn-lg">
              Demarrer le parcours
            </Link>
            <Link to="/login" className="btn btn-outline-dark btn-lg">
              Revenir a mon espace
            </Link>
          </div>
        </div>
      </section>

      <PhaseSpotlightModal phase={selectedPhase} onClose={() => setSelectedPhase(null)} />
    </div>
  );
};

export default Landing;
