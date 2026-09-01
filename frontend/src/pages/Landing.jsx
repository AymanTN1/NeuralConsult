import React, { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PhaseSpotlightModal from "../components/landing/PhaseSpotlightModal";
import CursorFollower from "../components/landing/CursorFollower";
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
    title: "Dossier de Première Consultation",
    copy:
      "Le parcours initialise l'identité patient, puis structure l'évaluation tabacologique, psychologique et somatique dans un ordre rigoureusement conforme aux pratiques cliniques.",
    icon: "bi bi-clipboard2-pulse-fill"
  },
  {
    title: "Synthèse & Aide à la Décision Médicale",
    copy:
      "Les données recueillies sont automatiquement consolidées en scores de dépendance, alertes cliniques et pistes thérapeutiques exploitables immédiatement par le médecin.",
    icon: "bi bi-cpu-fill"
  }
];

const interruptionBlocks = [
  {
    kicker: "Fondement Thérapeutique",
    title: "Arrêter de fumer ne se résume pas à réduire sa consommation.",
    copy:
      "Le sevrage tabagique mobilise simultanément la dépendance neuro-physique à la nicotine, les facteurs anxieux sous-jacents, les rituels comportementaux et le contexte de vie du patient.",
    icon: "bi bi-shield-check"
  },
  {
    kicker: "Alliance de Soin",
    title: "Un espace médical sécurisant avant d'être exigeant.",
    copy:
      "L'interface privilégie une ergonomie apaisante, une progression limpide et un guidage pas-à-pas pour éliminer le stress, l'anxiété d'évaluation et l'évitement.",
    icon: "bi bi-heart-pulse"
  },
  {
    kicker: "Mesure d'Impact",
    title: "Chaque journée sans tabac doit devenir tangible et quantifiable.",
    copy:
      "Économies réelles réinjectées, souffle restauré, scores HAD et Fagerström constituent des marqueurs objectifs renforçant durablement l'auto-efficacité.",
    icon: "bi bi-graph-up-arrow"
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
  const [roadmapScrollProgress, setRoadmapScrollProgress] = useState(0);
  const roadmapContainerRef = useRef(null);

  useEffect(() => {
    const computeProgress = () => {
      if (!roadmapContainerRef.current) return;
      const rect = roadmapContainerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const startLine = viewportHeight * 0.85;
      const endLine = viewportHeight * 0.2;
      const totalDistance = Math.max(rect.height + startLine - endLine, 1);
      const traveled = startLine - rect.top;
      const ratio = Math.min(1, Math.max(0, traveled / totalDistance));
      setRoadmapScrollProgress(Math.round(ratio * 100));
    };

    window.addEventListener("scroll", computeProgress, { passive: true });
    window.addEventListener("resize", computeProgress);
    computeProgress();

    return () => {
      window.removeEventListener("scroll", computeProgress);
      window.removeEventListener("resize", computeProgress);
    };
  }, []);

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
  const heroCopyVisibility = Math.max(0.08, 1 - pageScrollProgress * 3.8);

  return (
    <div className="landing-cinematic" ref={pageRef}>
      <CursorFollower />
      <div className="landing-persistent-scene" aria-hidden="true">
        <Suspense fallback={<div className="landing-scene-fallback">Initialisation de la simulation clinique 3D...</div>}>
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

      {/* SECTION SERVICES & ÉCOSYSTÈME CLINIQUE */}
      <section className="landing-services-section" id="services">
        <div className="container services-section-inner">
          <div className="services-section-head">
            <div className="hero-kicker">
              <i className="bi bi-stars me-2" />
              Écosystème de Soin & Services
            </div>
            <h2 className="section-title">
              Une prise en charge globale, humaine
              <br />
              <span>et accessible à tous.</span>
            </h2>
            <p className="muted-text">
              NeuralConsult met la technologie et la médecine au service de votre libération du tabac à travers des téléconsultations solidaires, un soutien psychologique 24/7, un suivi digital sur-mesure et une communauté bienveillante.
            </p>
          </div>

          <div className="services-bento-grid">
            {/* CARTE HERO : TÉLÉCONSULTATION SOLIDAIRE (50 DH) */}
            <div className="services-bento-card services-card-teleconsult">
              <div className="teleconsult-glow-pill">
                <span className="teleconsult-pulse-dot" />
                <span>Tarification Solidaire & Engagée</span>
              </div>
              <div className="teleconsult-price-hero">
                <div className="price-tag-wrap">
                  <span className="price-currency">DH</span>
                  <span className="price-amount">50</span>
                  <span className="price-period">/ consultation</span>
                </div>
                <span className="price-badge-accessible">
                  <i className="bi bi-check-circle-fill me-1" />
                  À la portée de tous pour la lutte contre le tabagisme
                </span>
              </div>
              <div className="teleconsult-info">
                <h3>Téléconsultation avec des Médecins & Tabacologues</h3>
                <p>
                  Consultez des praticiens certifiés depuis chez vous en toute confidentialité. Bénéficiez d'un diagnostic approfondi, d'un ajustement précis de vos substituts nicotiniques (TSN) et d'ordonnances médicales sécurisées.
                </p>
                <div className="teleconsult-features-list">
                  <div className="feature-item">
                    <i className="bi bi-camera-video-fill text-primary" />
                    <span>Téléconsultation vidéo médicale HD sécurisée</span>
                  </div>
                  <div className="feature-item">
                    <i className="bi bi-prescription2 text-success" />
                    <span>Prescription de TSN & plan de soin personnalisé</span>
                  </div>
                  <div className="feature-item">
                    <i className="bi bi-clock-history text-info" />
                    <span>Disponibilité rapide & suivi médical régulier</span>
                  </div>
                </div>
                <div className="teleconsult-action-wrap mt-4">
                  <Link to="/appointments" className="btn btn-primary-gradient btn-lg">
                    <i className="bi bi-calendar2-check-fill me-2" />
                    Prendre rendez-vous (50 DH)
                  </Link>
                </div>
              </div>
            </div>

            {/* CARTE 2 : PSYCHOLOGUE 24/7 & SOUTIEN ÉMOTIONNEL */}
            <div className="services-bento-card services-card-psych">
              <div className="service-card-icon-wrap icon-rose">
                <i className="bi bi-heart-pulse-fill" />
              </div>
              <span className="service-category-badge">Écoute & Santé Mentale</span>
              <h3>Psychologue & Tabacologue 24/7</h3>
              <p>
                Un accompagnement psychologique continu basé sur les thérapies cognitivo-comportementales (TCC). Surmontez l'anxiété, le stress et les déclencheurs émotionnels du sevrage avec l'aide d'experts de l'addiction.
              </p>
              <div className="service-pills-list">
                <span className="badge-chip"><i className="bi bi-person-check-fill me-1 text-primary" />Psychologues cliniciens</span>
                <span className="badge-chip"><i className="bi bi-brain me-1 text-danger" />Thérapies TCC</span>
                <span className="badge-chip"><i className="bi bi-chat-dots-fill me-1 text-success" />Soutien 7j/7</span>
              </div>
              <Link to="/appointments" className="btn btn-ghost-card mt-auto">
                Consulter un psychologue <i className="bi bi-arrow-right ms-1" />
              </Link>
            </div>

            {/* CARTE 3 : SUIVIS & CONSULTATIONS À DISTANCE */}
            <div className="services-bento-card services-card-tracking">
              <div className="service-card-icon-wrap icon-indigo">
                <i className="bi bi-sliders" />
              </div>
              <span className="service-category-badge">Télé-Suivi Personnalisé</span>
              <h3>Consultations & Suivis à Distance</h3>
              <p>
                Un suivi clinique continu de votre réduction ou arrêt complet. Votre praticien adapte votre posologie de substituts, surveille vos constantes et ajuste votre traitement en temps réel.
              </p>
              <div className="service-pills-list">
                <span className="badge-chip"><i className="bi bi-clipboard2-check-fill me-1 text-info" />Carnet de bord partagé</span>
                <span className="badge-chip"><i className="bi bi-capsule me-1 text-primary" />Ajustement TSN</span>
              </div>
              <Link to="/dashboard" className="btn btn-ghost-card mt-auto">
                Espace de suivi patient <i className="bi bi-arrow-right ms-1" />
              </Link>
            </div>

            {/* CARTE 4 : ESPACE COMMUNAUTAIRE */}
            <div className="services-bento-card services-card-community">
              <div className="service-card-icon-wrap icon-purple">
                <i className="bi bi-people-fill" />
              </div>
              <span className="service-category-badge">Entraide & Partage</span>
              <h3>Espace Communautaire & Cercles de Soutien</h3>
              <p>
                Rejoignez des cercles d'échange bienveillants. Partagez votre quotidien, célébrez chaque journée de liberté sans tabac et bénéficiez du soutien continu de pairs et de professionnels.
              </p>
              <div className="service-pills-list">
                <span className="badge-chip"><i className="bi bi-chat-heart-fill me-1 text-danger" />Cercles d'écoute active</span>
                <span className="badge-chip"><i className="bi bi-trophy-fill me-1 text-warning" />Badges & Victoires</span>
                <span className="badge-chip"><i className="bi bi-shield-lock-fill me-1 text-success" />Modération médicale</span>
              </div>
              <Link to="/communities" className="btn btn-ghost-card mt-auto">
                Rejoindre la communauté <i className="bi bi-arrow-right ms-1" />
              </Link>
            </div>

            {/* CARTE 5 : SUIVI DIGITAL & BOUTON SOS CRAVING */}
            <div className="services-bento-card services-card-sos">
              <div className="service-card-icon-wrap icon-red">
                <i className="bi bi-shield-fill-exclamation" />
              </div>
              <span className="service-category-badge">Accompagnement d'Urgence</span>
              <h3>Bouton SOS Craving & Gestion des Pulsions</h3>
              <p>
                Une envie soudaine de fumer ? Déclenchez le mode SOS pour accéder instantanément à des exercices de cohérence cardiaque, des techniques de diversion et des protocoles anti-craving.
              </p>
              <div className="service-pills-list">
                <span className="badge-chip"><i className="bi bi-lungs-fill me-1 text-info" />Cohérence cardiaque (5 min)</span>
                <span className="badge-chip"><i className="bi bi-lightning-charge-fill me-1 text-warning" />Gestion immédiate du pic</span>
              </div>
              <Link to="/register" className="btn btn-ghost-card mt-auto">
                Découvrir l'outil SOS <i className="bi bi-arrow-right ms-1" />
              </Link>
            </div>

            {/* CARTE 6 : BILAN SCIENTIFIQUE & IA MÉDICALE */}
            <div className="services-bento-card services-card-ai">
              <div className="service-card-icon-wrap icon-cyan">
                <i className="bi bi-cpu-fill" />
              </div>
              <span className="service-category-badge">Intelligence Médicale</span>
              <h3>Bilan Diagnostique & RAG Clinique</h3>
              <p>
                Évaluation scientifique intégrant les scores officiels de Fagerström, HAD et EPICES, avec synthèse intelligente facilitant l'orientation thérapeutique de votre médecin.
              </p>
              <div className="service-pills-list">
                <span className="badge-chip"><i className="bi bi-journal-medical me-1 text-primary" />Score de Fagerström officiel</span>
                <span className="badge-chip"><i className="bi bi-graph-up-arrow me-1 text-success" />Analyse prédictive de sevrage</span>
              </div>
              <Link to="/register" className="btn btn-ghost-card mt-auto">
                Commencer mon évaluation <i className="bi bi-arrow-right ms-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION IMPACT & CALCULATEUR */}
      <section className="landing-command-section" id="impact">
        <div className="container command-section-inner">
          <div className="command-section-head">
            <div className="hero-kicker">
              <i className="bi bi-calculator-fill me-2" />
              Impact Clinique & Économique
            </div>
            <h2 className="section-title">
              Un cadre médical clair et apaisé.
              <br />
              Des résultats mesurables dès le premier jour.
            </h2>
            <p className="muted-text">
              NeuralConsult relie la projection d'économies concrètes, l'évaluation structurée de la dépendance et la décision thérapeutique dans une expérience fluide qui renforce l'adhésion au soin.
            </p>
          </div>

          <div className="landing-command-grid">
            <div className="landing-command-card landing-command-card-impact">
              <div className="landing-command-card-head">
                <span className="landing-command-badge">
                  <i className="bi bi-cash-coin me-1" />
                  Simulateur Thérapeutique
                </span>
                <strong>Impact Financier & Écologique</strong>
              </div>

              <div className="landing-command-body">
                <div className="landing-calculator-grid">
                  <label className="impact-field">
                    <span>
                      <i className="bi bi-fire text-danger me-1" />
                      Cigarettes / jour
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={calculator.cigarettesPerDay}
                      onChange={(e) =>
                        setCalculator((prev) => ({
                          ...prev,
                          cigarettesPerDay: Math.max(1, Number(e.target.value) || 0)
                        }))
                      }
                    />
                  </label>
                  <label className="impact-field">
                    <span>
                      <i className="bi bi-box me-1" />
                      Cigarettes / paquet
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={calculator.cigarettesPerPack}
                      onChange={(e) =>
                        setCalculator((prev) => ({
                          ...prev,
                          cigarettesPerPack: Math.max(1, Number(e.target.value) || 0)
                        }))
                      }
                    />
                  </label>
                  <label className="impact-field">
                    <span>
                      <i className="bi bi-cash-stack text-success me-1" />
                      Prix paquet (DH)
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={calculator.packPrice}
                      onChange={(e) =>
                        setCalculator((prev) => ({
                          ...prev,
                          packPrice: Math.max(1, Number(e.target.value) || 0)
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="landing-command-stats">
                  <div className="landing-command-stat stat-glow-cyan">
                    <span>Économies mensuelles</span>
                    <strong>{formatCurrency(impact.monthlySavings)} <small>DH</small></strong>
                  </div>
                  <div className="landing-command-stat stat-glow-emerald">
                    <span>Économies annuelles</span>
                    <strong>{formatCurrency(impact.yearlySavings)} <small>DH</small></strong>
                  </div>
                  <div className="landing-command-stat stat-glow-sky">
                    <span>CO₂ évité / an</span>
                    <strong>{impact.yearlyCo2Kg.toFixed(0)} <small>kg</small></strong>
                  </div>
                </div>

                <div className="landing-command-milestones">
                  {LANDING_MILESTONES.map((milestone) => {
                    const unlocked = impact.unlockedMilestones.some((item) => item.label === milestone.label);
                    return (
                      <div key={milestone.label} className={`landing-command-milestone ${unlocked ? "is-unlocked" : ""}`}>
                        <div className="milestone-icon-wrap">
                          <i className={milestone.icon} />
                        </div>
                        <div className="milestone-details">
                          <strong>{milestone.label}</strong>
                          <span>{formatCurrency(milestone.amount)} DH</span>
                        </div>
                        {unlocked && (
                          <span className="milestone-status-badge">
                            <i className="bi bi-check-lg" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="landing-command-reset">
                  <button className="btn btn-outline-custom" type="button" onClick={() => setCalculator(defaultCalculator)}>
                    <i className="bi bi-arrow-counterclockwise me-1" />
                    Réinitialiser
                  </button>
                  <span className="muted-text">
                    {impact.nextMilestone
                      ? `Prochain palier débloqué : ${impact.nextMilestone.label} (${formatCurrency(impact.nextMilestone.amount)} DH)`
                      : "🎉 Félicitations : tous les paliers de projection sont atteints !"}
                  </span>
                </div>
              </div>
            </div>

            <div className="landing-command-card landing-command-card-auth">
              <div className="landing-command-card-head">
                <span className="landing-command-badge">
                  <i className="bi bi-door-open-fill me-1" />
                  Accès Praticien & Patient
                </span>
                <strong>Espace Médical Sécurisé</strong>
              </div>

              <div className="landing-auth-module">
                <h3>Premier accès patient et médecin</h3>
                <p>
                  Le patient débute par son bilan initial guidé. Le médecin configure son profil clinique certifié et accède à la console d'évaluation diagnostique.
                </p>

                <div className="landing-auth-actions">
                  <Link to="/login" className="btn btn-primary-gradient btn-lg">
                    <i className="bi bi-box-arrow-in-right me-2" />
                    Se connecter
                  </Link>
                  <Link to="/register" className="btn btn-ghost-nav btn-lg">
                    <i className="bi bi-person-plus-fill me-2" />
                    Créer un compte
                  </Link>
                </div>

                <div className="landing-auth-tags">
                  {commandCards.map((card) => (
                    <div key={card.title} className="landing-auth-tag">
                      <div className="auth-tag-icon">
                        <i className={card.icon} />
                      </div>
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

      {/* SECTION PHILOSOPHIE CLINIQUE */}
      <section className="landing-interruption-cinematic" id="clarity">
        <div className="container interruption-cinematic-inner">
          {interruptionBlocks.map((block) => (
            <article key={block.kicker} className="interruption-cinematic-card">
              <div className="interruption-card-header">
                <i className={block.icon} />
                <span>{block.kicker}</span>
              </div>
              <h3>{block.title}</h3>
              <p>{block.copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION ACCRÉDITATIONS & BASES SCIENTIFIQUES OFFICIELLES */}
      <section className="landing-accreditations-section" id="accreditations">
        <div className="container accreditations-inner">
          <div className="accreditations-header text-center">
            <div className="hero-kicker">
              <i className="bi bi-patch-check-fill me-2 text-primary" />
              Bases Scientifiques, Recommandations & Agréments
            </div>
            <h2 className="section-title">
              Un dossier médical et des protocoles
              <br />
              <span>agréés par les plus hautes autorités de santé.</span>
            </h2>
            <p className="muted-text">
              La méthodologie de NeuralConsult repose rigoureusement sur les recommandations de pratique clinique de la Haute Autorité de Santé (HAS), de l'Organisation Mondiale de la Santé (OMS/WHO), de la Fondation Lalla Salma et de l'Ordre National des Médecins.
            </p>
          </div>

          {/* BANDEAU OFFICIEL DES LOGOS ET ORGANISMES DE RÉFÉRENCE */}
          <div className="accreditations-partners-banner">
            <div className="partners-banner-title">
              <span>Organismes de Référence & Cadres Réglementaires Officiels</span>
            </div>
            <div className="authorities-pills-grid">
              <div className="authority-card-pill">
                <div className="authority-pill-icon icon-bg-blue">
                  <i className="bi bi-hospital-fill text-primary" />
                </div>
                <div className="authority-pill-text">
                  <strong>Haute Autorité de Santé (HAS)</strong>
                  <span>Recommandations de Bonne Pratique</span>
                </div>
              </div>

              <div className="authority-card-pill">
                <div className="authority-pill-icon icon-bg-cyan">
                  <i className="bi bi-globe-americas text-info" />
                </div>
                <div className="authority-pill-text">
                  <strong>OMS / WHO</strong>
                  <span>Directives Mondiales Sevrage</span>
                </div>
              </div>

              <div className="authority-card-pill">
                <div className="authority-pill-icon icon-bg-emerald">
                  <i className="bi bi-shield-heart-fill text-success" />
                </div>
                <div className="authority-pill-text">
                  <strong>Fondation Lalla Salma</strong>
                  <span>Guide National de Tabacologie</span>
                </div>
              </div>

              <div className="authority-card-pill">
                <div className="authority-pill-icon icon-bg-amber">
                  <i className="bi bi-award-fill text-warning" />
                </div>
                <div className="authority-pill-text">
                  <strong>Ordre National des Médecins</strong>
                  <span>Déontologie Médicale BO n° 7066</span>
                </div>
              </div>

              <div className="authority-card-pill">
                <div className="authority-pill-icon icon-bg-purple">
                  <i className="bi bi-heart-pulse-fill" style={{ color: "#9333ea" }} />
                </div>
                <div className="authority-pill-text">
                  <strong>SFT Tabacologie</strong>
                  <span>Société Francophone de Tabacologie</span>
                </div>
              </div>

              <div className="authority-card-pill">
                <div className="authority-pill-icon icon-bg-teal">
                  <i className="bi bi-diagram-3-fill" style={{ color: "#0d9488" }} />
                </div>
                <div className="authority-pill-text">
                  <strong>Respadd Addictions</strong>
                  <span>Réseau Prévention des Addictions</span>
                </div>
              </div>

              <div className="authority-card-pill">
                <div className="authority-pill-icon icon-bg-indigo">
                  <i className="bi bi-people-fill" style={{ color: "#4f46e5" }} />
                </div>
                <div className="authority-pill-text">
                  <strong>Santé Publique France</strong>
                  <span>Protocoles Scientifiques Tabac</span>
                </div>
              </div>

              <div className="authority-card-pill">
                <div className="authority-pill-icon icon-bg-sky">
                  <i className="bi bi-shield-check" style={{ color: "#0284c7" }} />
                </div>
                <div className="authority-pill-text">
                  <strong>L'Assurance Maladie</strong>
                  <span>Cadre Thérapeutique & TSN</span>
                </div>
              </div>
            </div>
          </div>

          {/* GRILLE DES GUIDES ET DOCUMENTS SCIENTIFIQUES CONSULTABLES */}
          <div className="clinical-sources-grid">
            <div className="clinical-source-card">
              <div className="source-card-header">
                <span className="source-tag source-tag-has">HAS France</span>
                <span className="source-date">Recommandation de Bonne Pratique</span>
              </div>
              <h3>Arrêt de la consommation de tabac : du dépistage individuel au maintien de l'abstinence</h3>
              <p>
                Dossier médical tabacologique de référence établissant les conduites à tenir pour l'aide à l'arrêt, le calcul des dépendances et les stratégies thérapeutiques de premier recours.
              </p>
              <a
                href="/papiersMedicales/Dossier_de_tabacologie.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-source-link"
              >
                <i className="bi bi-file-earmark-pdf-fill me-2 text-danger" />
                Consulter le Dossier Médical HAS (PDF)
              </a>
            </div>

            <div className="clinical-source-card">
              <div className="source-card-header">
                <span className="source-tag source-tag-who">OMS / WHO</span>
                <span className="source-date">Lignes Directrices Internationales</span>
              </div>
              <h3>WHO Clinical Treatment Guideline for Tobacco Cessation in Adults</h3>
              <p>
                Protocole international de l'Organisation Mondiale de la Santé détaillant les interventions comportementales, les thérapies digitales et les substituts nicotiniques validés.
              </p>
              <a
                href="/papiersMedicales/WHO guideline for tabacco cessation.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-source-link"
              >
                <i className="bi bi-file-earmark-pdf-fill me-2 text-danger" />
                Consulter le Guide OMS (PDF)
              </a>
            </div>

            <div className="clinical-source-card">
              <div className="source-card-header">
                <span className="source-tag source-tag-maroc">Fondation Lalla Salma</span>
                <span className="source-date">Guide National de Tabacologie</span>
              </div>
              <h3>Guide Marocain de Prise en Charge et de Lutte Contre le Tabagisme</h3>
              <p>
                Référentiel national de lutte contre le tabagisme élaboré par la Fondation Lalla Salma et le Ministère de la Santé pour la prévention et le sevrage encadré.
              </p>
              <a
                href="/papiersMedicales/Guide marocain tabac complet.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-source-link"
              >
                <i className="bi bi-file-earmark-pdf-fill me-2 text-danger" />
                Consulter le Guide National (PDF)
              </a>
            </div>

            <div className="clinical-source-card">
              <div className="source-card-header">
                <span className="source-tag source-tag-deonto">Ordre des Médecins</span>
                <span className="source-date">Bulletin Officiel n° 7066</span>
              </div>
              <h3>Code de Déontologie de la Profession Médicale</h3>
              <p>
                Garantie de stricte conformité avec les dispositions éthiques, le secret professionnel médical, la télémédecine et le devoir d'indépendance du praticien.
              </p>
              <a
                href="/Code-de-Deontologie-de-la-profession-medicale-BO-n-7066-17-2-2022 ordre national des medcins.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-source-link"
              >
                <i className="bi bi-file-earmark-pdf-fill me-2 text-danger" />
                Consulter le Code de Déontologie (PDF)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION ROADMAP CLINIQUE */}
      <section
        className="landing-roadmap-centered"
        id="pathway"
        ref={roadmapContainerRef}
        style={{ "--roadmap-progress": `${roadmapScrollProgress}%` }}
      >
        <div className="container roadmap-centered-inner">
          <div className="landing-roadmap-header">
            <span className="roadmap-stylized-kicker">Parcours Thérapeutique</span>
            <h2 className="roadmap-stylized-title">
              Protocole des 5 Phases
              <br />
              <span>D'Évaluation Clinique</span>
            </h2>
            <p className="roadmap-subtitle">
              Un cheminement diagnostique validé scientifiquement, structuré pour concilier rigueur médicale et bienveillance.
            </p>
          </div>

          <div className="landing-roadmap-vertical">
            {CLINICAL_PHASES.map((phase) => (
              <button
                key={phase.id}
                className="landing-roadmap-row"
                type="button"
                onClick={() => setSelectedPhase(phase)}
              >
                <div className="landing-roadmap-row-info">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="landing-roadmap-row-phase">{phase.label}</span>
                    <span className="landing-roadmap-row-range">{phase.questionRange}</span>
                  </div>
                  <strong>{phase.title}</strong>
                </div>
                <div className="landing-roadmap-row-line">
                  <span className="landing-roadmap-row-node">
                    <i className="bi bi-chevron-right" />
                  </span>
                </div>
                <div className="landing-roadmap-row-description">
                  <p>{phase.summary}</p>
                  <span className="landing-roadmap-explore-link">
                    Découvrir les objectifs cliniques
                    <i className="bi bi-arrow-right ms-1" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION SLOGAN FINAL */}
      <section className="landing-final-cta">
        <div className="container landing-final-cta-inner">
          <div className="final-cta-content">
            <div className="hero-kicker">
              <i className="bi bi-check-all me-1" />
              Engagement Thérapeutique
            </div>
            <h2 className="section-title">
              Chaque souffle retrouve sa place.
              <br />
              Chaque jour sans tabac devient une victoire visible.
            </h2>
            <p className="muted-text">
              Une interface médicale conçue pour apaiser le patient, clarifier l'évaluation et doter le médecin des clés décisionnelles les plus fiables.
            </p>
          </div>

          <div className="landing-final-actions">
            <Link to="/register" className="btn btn-primary-gradient btn-lg">
              <i className="bi bi-lightning-charge-fill me-2" />
              Démarrer le parcours
            </Link>
            <Link to="/login" className="btn btn-ghost-nav btn-lg">
              <i className="bi bi-box-arrow-in-right me-2" />
              Accéder à mon espace
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION FOOTER INSTITUTIONNEL COMPLET */}
      <footer className="landing-footer-contacts" id="contact">
        <div className="container landing-footer-main">
          {/* EN-TÊTE DU FOOTER AVEC LOGO & CERTIFICATIONS */}
          <div className="footer-brand-strip">
            <div className="footer-brand-wrap">
              <Link className="public-brand" to="/">
                <span className="public-brand-mark">
                  <img src="/icons/icon_Neural_Consult_Sevrage.png" alt="NeuralConsult Icon" className="public-brand-img" />
                </span>
                <span className="public-brand-text">
                  <span className="public-brand-eyebrow">Accompagnement clinique</span>
                  <span className="public-brand-title">NeuralConsult</span>
                </span>
              </Link>
              <p className="footer-brand-motto">
                Plateforme médicale innovante d'accompagnement au sevrage tabagique, alliant téléconsultations solidaires à 50 DH, soutien psychologique 24/7 et protocoles cliniques agréés (HAS, OMS, Fondation Lalla Salma).
              </p>
            </div>
            <div className="footer-trust-badges">
              <div className="trust-pill">
                <i className="bi bi-shield-check text-success" />
                <span>Code Déontologie Médicale BO n° 7066</span>
              </div>
              <div className="trust-pill">
                <i className="bi bi-lock-fill text-primary" />
                <span>Données de Santé Chiffrées & Sécurisées</span>
              </div>
            </div>
          </div>

          {/* 4 COLONNES DE NAVIGATION INSTITUTIONNELLE */}
          <div className="footer-nav-columns-grid">
            <div className="footer-nav-col">
              <h4>Soins & Téléconsultations</h4>
              <ul>
                <li><Link to="/appointments"><i className="bi bi-chevron-right" />Téléconsultation Tabacologue (50 DH)</Link></li>
                <li><Link to="/appointments"><i className="bi bi-chevron-right" />Soutien Psychologue 24/7</Link></li>
                <li><Link to="/dashboard"><i className="bi bi-chevron-right" />Suivi à distance & Ordonnances TSN</Link></li>
                <li><Link to="/register"><i className="bi bi-chevron-right" />Bilan Initial & Score Fagerström</Link></li>
                <li><Link to="/communities"><i className="bi bi-chevron-right" />Espace Communautaire & Entraide</Link></li>
                <li><a href="#services"><i className="bi bi-chevron-right" />Mode Urgence SOS Craving</a></li>
              </ul>
            </div>

            <div className="footer-nav-col">
              <h4>Bases & Protocoles Scientifiques</h4>
              <ul>
                <li><a href="/papiersMedicales/Dossier_de_tabacologie.pdf" target="_blank" rel="noopener noreferrer"><i className="bi bi-file-earmark-pdf" />Recommandations HAS France</a></li>
                <li><a href="/papiersMedicales/WHO guideline for tabacco cessation.pdf" target="_blank" rel="noopener noreferrer"><i className="bi bi-file-earmark-pdf" />Directives OMS / WHO Tabac</a></li>
                <li><a href="/papiersMedicales/Guide marocain tabac complet.pdf" target="_blank" rel="noopener noreferrer"><i className="bi bi-file-earmark-pdf" />Guide Fondation Lalla Salma</a></li>
                <li><a href="/papiersMedicales/Test HAD.pdf" target="_blank" rel="noopener noreferrer"><i className="bi bi-file-earmark-pdf" />Échelle HAD (Anxiété & Dépression)</a></li>
                <li><a href="/papiersMedicales/institut national de prévention et education pour la santé inpes fr dossier tabacologie.pdf" target="_blank" rel="noopener noreferrer"><i className="bi bi-file-earmark-pdf" />Dossier Tabacologie INPES</a></li>
                <li><a href="#pathway"><i className="bi bi-chevron-right" />Protocole des 5 Phases Cliniques</a></li>
              </ul>
            </div>

            <div className="footer-nav-col">
              <h4>Cadre Légal & Déontologie</h4>
              <ul>
                <li><a href="/Code-de-Deontologie-de-la-profession-medicale-BO-n-7066-17-2-2022 ordre national des medcins.pdf" target="_blank" rel="noopener noreferrer"><i className="bi bi-shield-shaded" />Ordre des Médecins (BO n° 7066)</a></li>
                <li><a href="/code-de-deontologie-medicale.pdf" target="_blank" rel="noopener noreferrer"><i className="bi bi-file-text" />Charte de Déontologie Médicale</a></li>
                <li><Link to="/login"><i className="bi bi-chevron-right" />Secret Professionnel & Confidentialité</Link></li>
                <li><Link to="/register"><i className="bi bi-chevron-right" />Consentement Éclairé du Patient</Link></li>
                <li><Link to="/login"><i className="bi bi-chevron-right" />Hébergement Données de Santé (HDS)</Link></li>
                <li><Link to="/login"><i className="bi bi-chevron-right" />Mentions Légales & Conditions Générales</Link></li>
              </ul>
            </div>

            <div className="footer-nav-col">
              <h4>Assistance & Canaux d'Échange</h4>
              <div className="footer-contact-box">
                <div className="contact-box-item">
                  <i className="bi bi-envelope-at-fill text-primary" />
                  <div>
                    <strong>Support Médical & Technique</strong>
                    <a href="mailto:neuralconsult.sevrage@gmail.com">neuralconsult.sevrage@gmail.com</a>
                  </div>
                </div>
                <div className="contact-box-item">
                  <i className="bi bi-clock-fill text-success" />
                  <div>
                    <strong>Disponibilité de Soin</strong>
                    <span>Médecins & Psychologues 7j/7</span>
                  </div>
                </div>
              </div>

              <div className="footer-social-inline">
                <a href="https://www.instagram.com/neuralconsult.sevrage" target="_blank" rel="noopener noreferrer" title="Instagram">
                  <img src="/icons/Instagram_icon.png" alt="Instagram" />
                </a>
                <a href="https://www.facebook.com/profile.php?id=61589395475281" target="_blank" rel="noopener noreferrer" title="Facebook">
                  <img src="/icons/Facebook_Logo_2023.png" alt="Facebook" />
                </a>
                <a href="https://open.spotify.com/show/033dJ0geCQa9xL5L1CBRw3?si=98d0e9846a704c8e" target="_blank" rel="noopener noreferrer" title="Spotify Podcast">
                  <img src="/icons/images-removebg-preview.png" alt="Spotify Podcast" />
                </a>
                <a href="https://www.tiktok.com/@neuralconsultsevrage" target="_blank" rel="noopener noreferrer" title="TikTok">
                  <img src="/icons/Tiktok_icon.svg.png" alt="TikTok" />
                </a>
                <a href="https://x.com/Neural_Consult" target="_blank" rel="noopener noreferrer" title="X (Twitter)">
                  <img src="/icons/x-twitter-logo-top697n5ef8g4ua0vz2lu.jpg" alt="X" />
                </a>
              </div>
            </div>
          </div>

          {/* CARTE BENTO MOBILE EXPRESS QR CODE */}
          <div className="footer-mobile-card-row">
            <div className="footer-qr-banner-card">
              <div className="qr-banner-image-wrap">
                <img src="/icons/QR_ALL_Links.png" alt="QR Code NeuralConsult Links" className="qr-banner-image" />
              </div>
              <div className="qr-banner-content">
                <div className="badge-pill-qr">
                  <i className="bi bi-phone-fill me-1" />
                  Accès Smartphone Instantané
                </div>
                <h3>Scannez pour ouvrir NeuralConsult sur votre mobile</h3>
                <p>
                  Retrouvez l'ensemble de nos guides cliniques, vidéos de sensibilisation, podcasts audio et coordonnées médicales directement sur votre téléphone.
                </p>
              </div>
              <div className="qr-banner-cta">
                <a href="mailto:neuralconsult.sevrage@gmail.com" className="btn btn-outline-custom">
                  <i className="bi bi-headset me-2" />
                  Contacter le support clinique
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* BANDEAU DE BAS DE PAGE & AVERTISSEMENT MÉDICAL */}
        <div className="container footer-bottom-bar">
          <div className="footer-disclaimer-text">
            <p>
              <i className="bi bi-info-circle-fill me-1 text-primary" />
              <strong>Avis Médical Déontologique :</strong> NeuralConsult est un dispositif d'accompagnement clinique et d'aide à la décision thérapeutique au sevrage tabagique. Il ne se substitue pas à une consultation médicale d'urgence vitale. En cas de détresse respiratoire aiguë ou d'urgence vitale, contactez immédiatement le SAMU (15 / 141).
            </p>
          </div>
          <div className="footer-legal-copy-row">
            <span>
              © {new Date().getFullYear()} NeuralConsult. Tous droits réservés. Conçu dans le respect strict des recommandations HAS, OMS et du Code de Déontologie Médicale.
            </span>
            <div className="footer-legal-links">
              <a href="/Code-de-Deontologie-de-la-profession-medicale-BO-n-7066-17-2-2022 ordre national des medcins.pdf" target="_blank" rel="noopener noreferrer">Code de Déontologie (BO n°7066)</a>
              <span>•</span>
              <a href="/papiersMedicales/Dossier_de_tabacologie.pdf" target="_blank" rel="noopener noreferrer">Dossier HAS</a>
              <span>•</span>
              <a href="/papiersMedicales/Guide marocain tabac complet.pdf" target="_blank" rel="noopener noreferrer">Guide National</a>
            </div>
          </div>
        </div>
      </footer>

      <PhaseSpotlightModal phase={selectedPhase} onClose={() => setSelectedPhase(null)} />
    </div>
  );
};

export default Landing;

