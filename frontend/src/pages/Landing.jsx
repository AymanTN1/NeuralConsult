import React, { Suspense, lazy, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PhaseSpotlightModal from "../components/landing/PhaseSpotlightModal";
import { CLINICAL_PHASES, CO2_PER_CIGARETTE_KG, LANDING_MILESTONES } from "../data/clinicalJourney";

const CinematicLandingScene = lazy(() => import("../components/landing/CinematicLandingScene"));
const DEFAULT_PHASE = CLINICAL_PHASES[0];
const FLOATING_SMOKE_PLUMES = Array.from({ length: 7 }, (_, index) => ({
  id: index,
  delay: index * 0.18,
  duration: 2.3 + index * 0.2,
  drift: -18 - index * 8,
  scale: 0.82 + index * 0.08
}));

const defaultCalculator = {
  cigarettesPerDay: 20,
  cigarettesPerPack: 20,
  packPrice: 42
};

const commandCards = [
  {
    title: "Parcours structure",
    copy:
      "Le premier acces oriente le patient vers une evaluation claire et progressive: contexte, risques, habitudes, dependance et vulnerabilite sociale.",
    icon: "bi bi-clipboard2-pulse"
  },
  {
    title: "Aide clinique IA",
    copy:
      "L'interface transforme les reponses en repères cliniques, syntheses utiles et plans candidats sans laisser le dossier sous forme de formulaire brut.",
    icon: "bi bi-cpu"
  }
];

const interruptionBlocks = [
  {
    kicker: "Apaisement",
    title: "Le sevrage a besoin d'un cadre lisible et non agressif.",
    copy:
      "La landing a ete adoucie pour reduire la surcharge sensorielle et laisser plus de place aux repères utiles: souffle, progression et soutien clinique."
  },
  {
    kicker: "Repères",
    title: "La dependance est physique, psychique et contextuelle.",
    copy:
      "Le parcours explique les dimensions du dossier sans dramatiser visuellement, pour aider le patient a rester present et engage."
  },
  {
    kicker: "Recuperation",
    title: "Le retour vers la sante doit etre visible et rassurant.",
    copy:
      "La scene 3D garde un role pedagogique, mais avec une palette plus douce et une respiration visuelle plus compatible avec un public anxieux ou en manque."
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
        end: "bottom bottom",
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
  const floatingCigaretteVisibility = Math.min(Math.max((pageScrollProgress - 0.16) / 0.14, 0), 1);
  const floatingCigaretteScale = 0.72 + pageScrollProgress * 0.42;
  const floatingCigaretteRotation = 18 - pageScrollProgress * 28;
  const floatingCigaretteX = 20 - pageScrollProgress * 2;
  const floatingCigaretteY = 74 - pageScrollProgress * 32;
  const floatingCigaretteBodyScale = Math.max(0.18, 1 - scrollProgress * 0.84);

  return (
    <div className="landing-cinematic" ref={pageRef}>
      <div
        className={`landing-floating-cigarette ${floatingCigaretteVisibility > 0.02 ? "is-visible" : ""}`}
        style={{
          "--floating-cigarette-scale": floatingCigaretteScale,
          "--floating-cigarette-rotation": `${floatingCigaretteRotation}deg`,
          "--floating-cigarette-x": `${floatingCigaretteX}vw`,
          "--floating-cigarette-y": `${floatingCigaretteY}vh`,
          "--floating-cigarette-opacity": floatingCigaretteVisibility
        }}
        aria-hidden="true"
      >
        <div className="landing-floating-cigarette-shadow" />
        <div className="landing-floating-cigarette-rail">
          <div className="landing-floating-cigarette-filter" />
          <div
            className="landing-floating-cigarette-body"
            style={{ transform: `scaleX(${floatingCigaretteBodyScale})` }}
          >
            <div className="landing-floating-cigarette-stripe" />
            <div className="landing-floating-cigarette-stripe landing-floating-cigarette-stripe-secondary" />
          </div>
          <div className="landing-floating-cigarette-ember" />
        </div>
        <div className="landing-floating-cigarette-smoke" aria-hidden="true">
          {FLOATING_SMOKE_PLUMES.map((plume) => (
            <span
              key={plume.id}
              className="landing-floating-cigarette-plume"
              style={{
                "--smoke-delay": `${plume.delay}s`,
                "--smoke-duration": `${plume.duration}s`,
                "--smoke-drift": `${plume.drift}px`,
                "--smoke-scale": plume.scale,
                opacity: Math.max(0.14, floatingCigaretteVisibility - plume.id * 0.08)
              }}
            />
          ))}
        </div>
      </div>

      <section className="landing-scroll-theater" ref={sceneScrollRef}>
        <div className="landing-scroll-sticky">
          <Suspense fallback={<div className="landing-scene-fallback">Preparation de la visualisation clinique...</div>}>
            <CinematicLandingScene progress={scrollProgress} scrollVelocity={velocityLevel} />
          </Suspense>
        </div>
      </section>

      <section className="landing-command-section">
        <div className="container command-section-inner">
          <div className="command-section-head">
            <div className="hero-kicker">Repères cliniques</div>
            <h2 className="section-title">
              Des espaces calmes.
              <br />
              Pas une interface qui brusque.
            </h2>
            <p className="muted-text">
              Le calculateur d'impact et l'acces clinique restent centraux, mais dans un langage
              visuel plus respirable, plus doux et plus compatible avec l'accompagnement du sevrage.
            </p>
          </div>

          <div className="landing-command-grid">
            <div className="landing-command-card landing-command-card-impact">
              <div className="landing-command-card-head">
                <span className="landing-command-badge">Repere d'impact</span>
                <strong>Module patient</strong>
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
                      ? `Prochaine cible: ${impact.nextMilestone.label}`
                      : "Tous les paliers proposes sont atteints"}
                  </span>
                </div>
              </div>
            </div>

            <div className="landing-command-card landing-command-card-auth">
              <div className="landing-command-card-head">
                <span className="landing-command-badge">Acces clinique</span>
                <strong>Module d'entree</strong>
              </div>

              <div className="landing-auth-module">
                <h3>Entrer dans l'espace clinique</h3>
                <p>
                  Connectez-vous pour commencer par le profil personnel, puis poursuivre l'evaluation
                  clinique dans un parcours structure et accompagne.
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
            <div className="hero-kicker">Parcours clinique</div>
            <h2 className="section-title">
              Une timeline centrale.
              <br />
              Des etapes plus lisibles.
            </h2>
            <p className="muted-text">
              Chaque phase s'ouvre comme un repère explicatif, pour montrer au patient et au medecin
              ce qui est explore et pourquoi.
            </p>
          </div>

          <div className="landing-roadmap-central-line">
            {CLINICAL_PHASES.map((phase) => (
              <button
                key={phase.id}
                type="button"
                className={`landing-roadmap-central-phase ${selectedPhase?.id === phase.id ? "is-selected" : ""}`}
                onClick={() => setSelectedPhase(phase)}
                onMouseEnter={() => setHoveredPhase(phase)}
                onFocus={() => setHoveredPhase(phase)}
                onMouseLeave={() => setHoveredPhase(selectedPhase || DEFAULT_PHASE)}
                aria-expanded={selectedPhase?.id === phase.id}
                aria-label={`${phase.label} ${phase.title}`}
              >
                <span className="landing-roadmap-central-index">{phase.id}</span>
                <div className="landing-roadmap-central-copy">
                  <span>{phase.label}</span>
                  <strong>{phase.title}</strong>
                  <p>{phase.questionRange}</p>
                  <small className="landing-roadmap-phase-preview">{phase.summary}</small>
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
              <span className="landing-roadmap-hover-range">{roadmapPhase.questionRange}</span>
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
            <div className="hero-kicker">Calme clinique</div>
            <h2 className="section-title">La clarte clinique commence quand l'interface laisse respirer.</h2>
            <p className="muted-text">
              Une premiere impression plus apaisante, une evaluation structuree, puis une intelligence
              clinique qui transforme les reponses en aide exploitable pour le medecin.
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
