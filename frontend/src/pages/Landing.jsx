import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const smokeRows = Array.from({ length: 9 }, (_, index) => index);

const interruptionBlocks = [
  {
    kicker: "Poumons",
    title: "L'oxygene ne manque pas d'abord a l'ecran. Il manque dans les tissus.",
    copy:
      "Chaque cigarette ajoute une dette biologique. Le systeme visuel la rend tangible avant meme que le patient n'entre dans son dossier."
  },
  {
    kicker: "Cardio",
    title: "L'urgence n'est pas abstraite. Elle s'accumule, pulsation apres pulsation.",
    copy:
      "Le design coupe le scroll avec des panneaux francs pour rappeler que le sevrage n'est pas un simple objectif lifestyle mais une intervention clinique."
  },
  {
    kicker: "Psychique",
    title: "Dependance physique et tension psychologique cohabitent dans la meme brume.",
    copy:
      "La plateforme affiche les scores, le contexte social et l'alliance therapeutique dans une meme narration pour guider l'action medicale."
  }
];

const pathwayCards = [
  {
    label: "Mirror Intake",
    value: "Profilage force",
    copy: "Le dossier patient capte habitudes, contexte de vie, antecedents et vulnerabilites."
  },
  {
    label: "Clinical Glow",
    value: "Scores reactifs",
    copy: "Les niveaux HAD et Fagerstrom se comportent comme des signaux lumineux, jamais comme des champs figes."
  },
  {
    label: "Oxygen Path",
    value: "Plan vivant",
    copy: "Le tableau de bord respire progressivement quand le patient avance dans ses jours sans tabac."
  }
];

const Landing = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollableHeight > 0 ? Math.min(window.scrollY / scrollableHeight, 1) : 0;
      setScrollProgress(nextProgress);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scene = useMemo(() => {
    const burn = Math.min(scrollProgress * 1.35, 1);
    const clarity = Math.min(scrollProgress * 1.6, 1);
    const cigaretteWidth = Math.max(100, 340 - burn * 220);
    const emberSize = 26 + burn * 18;
    const fogOpacity = 0.9 - clarity * 0.72;
    const ashFall = burn * 80;
    return {
      burn,
      clarity,
      cigaretteWidth,
      emberSize,
      fogOpacity,
      ashFall
    };
  }, [scrollProgress]);

  return (
    <div className="landing-dark">
      <section className="landing-hero">
        <div className="landing-fog" style={{ opacity: scene.fogOpacity }} />
        <div className="container landing-grid">
          <div className="landing-copy">
            <div className="hero-kicker">Modern Clinical Darkness</div>
            <h1 className="landing-title">
              Voir le tabac
              <br />
              comme une urgence
              <br />
              mesurable.
            </h1>
            <p className="landing-lead">
              NeuralConsult Sevrage transforme le parcours tabagique en experience clinique immersive.
              Le brouillard, les scores et le temps de vie gagne convergent vers une seule decision : agir.
            </p>

            <div className="landing-actions">
              <Link to="/register" className="btn btn-dark btn-lg">
                Get Help
              </Link>
              <Link to="/login" className="btn btn-outline-dark btn-lg">
                Login
              </Link>
            </div>

            <div className="landing-metrics">
              <div className="landing-metric-card">
                <span className="landing-metric-label">Fog clearance</span>
                <strong>{Math.round(scene.clarity * 100)}%</strong>
              </div>
              <div className="landing-metric-card">
                <span className="landing-metric-label">Burn progression</span>
                <strong>{Math.round(scene.burn * 100)}%</strong>
              </div>
              <div className="landing-metric-card">
                <span className="landing-metric-label">Clinical mode</span>
                <strong>{scene.clarity > 0.55 ? "Activated" : "Smoker state"}</strong>
              </div>
            </div>
          </div>

          <div className="landing-scene">
            <div className="cigarette-stage">
              <div className="cigarette-copy">
                <span>Scroll-linked consumption</span>
                <strong>Le scroll consume l'objet, pas l'urgence.</strong>
              </div>

              <div className="cigarette-rail">
                <div className="cigarette-filter" />
                <div className="cigarette-body" style={{ width: `${scene.cigaretteWidth}px` }}>
                  <div className="cigarette-stripe" />
                  <div className="cigarette-stripe cigarette-stripe-secondary" />
                </div>
                <div
                  className="cigarette-ember"
                  style={{
                    width: `${scene.emberSize}px`,
                    height: `${scene.emberSize}px`
                  }}
                />
              </div>

              <div className="cigarette-smoke-field">
                {smokeRows.map((index) => (
                  <span
                    key={index}
                    className="smoke-puff"
                    style={{
                      animationDelay: `${index * 0.5}s`,
                      opacity: Math.max(0.08, scene.fogOpacity - index * 0.05)
                    }}
                  />
                ))}
              </div>

              <div className="ash-field" style={{ transform: `translateY(${scene.ashFall}px)` }}>
                {Array.from({ length: 14 }, (_, index) => (
                  <span
                    key={index}
                    className="ash-particle"
                    style={{
                      left: `${6 + index * 6}%`,
                      animationDelay: `${index * 0.12}s`,
                      opacity: scene.burn
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-interruption" id="impact">
        <div className="container">
          <div className="interruption-header">
            <div className="hero-kicker">Interruption panels</div>
            <h2 className="section-title">Le design coupe la navigation comme un monitor coupe le silence.</h2>
          </div>

          <div className="interruption-grid">
            {interruptionBlocks.map((block) => (
              <article key={block.kicker} className="interruption-card">
                <div className="interruption-line" />
                <span className="interruption-kicker">{block.kicker}</span>
                <h3>{block.title}</h3>
                <p>{block.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-pathway" id="pathway">
        <div className="container">
          <div className="pathway-shell">
            <div>
              <div className="hero-kicker">Clinical workstation</div>
              <h2 className="section-title">Une interface qui evolue du brouillard vers l'oxygene.</h2>
              <p className="muted-text">
                Le candidat ressent un environnement dense, sombre et charge. Le patient accompagne voit
                au contraire la lumiere clinique remonter au fil des jours sans tabac.
              </p>
            </div>

            <div className="pathway-grid">
              {pathwayCards.map((card) => (
                <div key={card.label} className="pathway-card">
                  <span className="pathway-label">{card.label}</span>
                  <h3>{card.value}</h3>
                  <p>{card.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-clarity" id="clarity">
        <div className="container clarity-shell">
          <div>
            <div className="hero-kicker">Clarity point</div>
            <h2 className="section-title">La fumee ne disparait vraiment qu'au moment de demander de l'aide.</h2>
            <p className="muted-text">
              La plateforme met la sante en premier : le temps de vie gagne, le plan de sevrage, puis les
              gains financiers seulement ensuite.
            </p>
          </div>

          <div className="clarity-cta">
            <Link to="/register" className="btn btn-dark btn-lg">
              Creer un dossier
            </Link>
            <Link to="/login" className="btn btn-outline-dark btn-lg">
              Revenir a mon espace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
