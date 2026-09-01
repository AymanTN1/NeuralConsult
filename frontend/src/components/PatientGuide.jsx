import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isPatient } from "../utils/roles";

const GUIDE_VERSION = "2026-04-14-patient-guide-v1";

const ROUTE_GUIDES = {
  "/evaluation": [
    {
      selector: '[data-guide-id="nav-evaluation"]',
      title: "Commencez par l'evaluation",
      body:
        "C'est la premiere etape obligatoire. Ici, la plateforme construit votre dossier tabagique et clinique pour comprendre votre dependance et personnaliser la suite du parcours.",
      placement: "right"
    },
    {
      selector: '[data-guide-id="evaluation-timeline"]',
      title: "Avancez phase par phase",
      body:
        "Cliquez sur une phase pour ouvrir son panel central. Quand vous terminez l'evaluation, la plateforme vous enverra automatiquement vers les tests, puis vers le journal.",
      placement: "top"
    }
  ],
  "/tests": [
    {
      selector: '[data-guide-id="tests-clinical"]',
      title: "Passez maintenant les tests cliniques",
      body:
        "Cette etape mesure la dependance physique avec Fagerstrom puis l'etat anxieux et depressif avec HAD. Les scores alimentent directement le dashboard et aident le medecin.",
      placement: "right"
    }
  ],
  "/journal": [
    {
      selector: '[data-guide-id="journal-form"]',
      title: "Terminez avec le journal quotidien",
      body:
        "Le journal enregistre cravings, stress, humeur et consommation. Une fois cette etape remplie, le menu patient devient pleinement exploitable.",
      placement: "right"
    }
  ],
  "/dashboard": [
    {
      selector: '[data-guide-id="sidebar-nav"]',
      title: "Voici votre menu de controle",
      body:
        "Apres evaluation, tests et journal, toutes les fonctionnalites patient s'ouvrent ici. Vous pouvez revenir a chaque module sans perdre le fil clinique.",
      placement: "right"
    },
    {
      selector: '[data-guide-id="dashboard-command"]',
      title: "Le tableau de bord synthétise votre progression",
      body:
        "Ici, vous visualisez vos scores, vos tendances et les premiers signaux utiles pour vous et pour le medecin. C'est votre lecture rapide de la progression.",
      placement: "bottom"
    }
  ],
  "/plan": [
    {
      selector: '[data-guide-id="plan-header"]',
      title: "Le plan traduit vos donnees en strategie",
      body:
        "Cette page rassemble les propositions de prise en charge, les notes cliniques et la logique therapeutique qui guidera le suivi.",
      placement: "bottom"
    }
  ],
  "/doctors": [
    {
      selector: '[data-guide-id="doctor-directory-list"]',
      title: "Choisissez un medecin pour engager la suite",
      body:
        "Ici, vous pouvez consulter les profils disponibles puis envoyer une demande. Le medecin aura ensuite acces a votre dossier, a vos tests et a votre progression.",
      placement: "top"
    }
  ],
  "/appointments": [
    {
      selector: '[data-guide-id="appointments-main"]',
      title: "Planifiez vos rendez-vous de soutien",
      body:
        "Cette zone sert a reserver une seance avec le medecin, notamment pour un soutien psychique ou une intervention exceptionnelle en cas d'alerte.",
      placement: "top"
    }
  ],
  "/support": [
    {
      selector: '[data-guide-id="support-main"]',
      title: "L'IA 24/7 reste disponible entre les rendez-vous",
      body:
        "Vous pouvez parler ici avec l'assistant de soutien a tout moment. Si l'IA detecte un signal dangereux ou une rechute imminente, elle peut remonter une alerte au medecin.",
      placement: "top"
    }
  ],
  "/communities": [
    {
      selector: '[data-guide-id="communities-main"]',
      title: "Les communautes ajoutent un soutien collectif",
      body:
        "Vous pouvez rejoindre ou creer un espace d'entraide pour partager des experiences, garder la motivation et ne pas porter le sevrage seul.",
      placement: "top"
    }
  ],
  "/profile": [
    {
      selector: '[data-guide-id="profile-header"]',
      title: "Votre profil personnel reste distinct",
      body:
        "Cette page contient vos informations personnelles et demographiques. Les reponses medicales et tabagiques restent dans l'evaluation clinique.",
      placement: "bottom"
    }
  ]
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const PatientGuide = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const routeSteps = ROUTE_GUIDES[location.pathname] || [];
  const storageKey = useMemo(() => {
    const identity = user?.id || user?.email;
    return identity ? `nc-patient-guide:${GUIDE_VERSION}:${identity}` : null;
  }, [user]);

  useEffect(() => {
    if (!isPatient(user) || !storageKey || routeSteps.length === 0) {
      setOpen(false);
      return;
    }

    let parsed = {};
    try {
      parsed = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    } catch (error) {
      parsed = {};
    }

    if (parsed?.seenRoutes?.[location.pathname]) {
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setStepIndex(0);
      setOpen(true);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [location.pathname, routeSteps.length, storageKey, user]);

  useEffect(() => {
    if (!open || routeSteps.length === 0) {
      setTargetRect(null);
      return;
    }

    const currentStep = routeSteps[stepIndex];
    if (!currentStep) {
      setTargetRect(null);
      return;
    }

    const recalculate = () => {
      const element = document.querySelector(currentStep.selector);
      if (!element) {
        setTargetRect(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      if (!rect.width && !rect.height) {
        setTargetRect(null);
        return;
      }
      setTargetRect(rect);
    };

    recalculate();
    const observer = new MutationObserver(recalculate);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener("resize", recalculate);
    window.addEventListener("scroll", recalculate, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recalculate);
      window.removeEventListener("scroll", recalculate, true);
    };
  }, [open, routeSteps, stepIndex]);

  if (!isPatient(user) || !open || routeSteps.length === 0) {
    return null;
  }

  const currentStep = routeSteps[stepIndex];
  if (!currentStep) {
    return null;
  }

  const markRouteSeen = () => {
    if (!storageKey) {
      setOpen(false);
      return;
    }

    let parsed = {};
    try {
      parsed = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    } catch (error) {
      parsed = {};
    }

    const nextState = {
      ...parsed,
      seenRoutes: {
        ...(parsed.seenRoutes || {}),
        [location.pathname]: true
      }
    };
    window.localStorage.setItem(storageKey, JSON.stringify(nextState));
    setOpen(false);
  };

  const goNext = () => {
    if (stepIndex >= routeSteps.length - 1) {
      markRouteSeen();
      return;
    }
    setStepIndex((previous) => previous + 1);
  };

  const bubbleWidth = Math.min(360, window.innerWidth - 32);
  const fallbackRect = {
    top: window.innerHeight * 0.32,
    left: window.innerWidth * 0.5 - 90,
    width: 180,
    height: 64
  };
  const activeRect = targetRect || fallbackRect;
  const placement = currentStep.placement || "bottom";

  let bubbleTop = activeRect.bottom + 18;
  let bubbleLeft = activeRect.left;

  if (placement === "right") {
    bubbleTop = activeRect.top + activeRect.height / 2 - 110;
    bubbleLeft = activeRect.right + 18;
  } else if (placement === "left") {
    bubbleTop = activeRect.top + activeRect.height / 2 - 110;
    bubbleLeft = activeRect.left - bubbleWidth - 18;
  } else if (placement === "top") {
    bubbleTop = activeRect.top - 210;
    bubbleLeft = activeRect.left + activeRect.width / 2 - bubbleWidth / 2;
  } else {
    bubbleTop = activeRect.bottom + 18;
    bubbleLeft = activeRect.left + activeRect.width / 2 - bubbleWidth / 2;
  }

  bubbleTop = clamp(bubbleTop, 16, window.innerHeight - 220);
  bubbleLeft = clamp(bubbleLeft, 16, window.innerWidth - bubbleWidth - 16);

  return (
    <div className="patient-guide-layer" aria-live="polite">
      <div className="patient-guide-dim" />
      <div
        className="patient-guide-spotlight"
        style={{
          top: activeRect.top - 8,
          left: activeRect.left - 8,
          width: activeRect.width + 16,
          height: activeRect.height + 16
        }}
      />

      <div
        className={`patient-guide-cloud guide-arrow-${placement}`}
        style={{
          top: bubbleTop,
          left: bubbleLeft,
          width: bubbleWidth
        }}
      >
        <div className="cloud-puff puff-1" />
        <div className="cloud-puff puff-2" />
        <div className="cloud-puff puff-3" />
        <div className="patient-guide-kicker">
          <span className="d-flex align-items-center gap-2">
            <span className="guide-dot" />
            <span>Guide patient</span>
          </span>
          <span className="guide-step-counter">{stepIndex + 1}/{routeSteps.length}</span>
        </div>
        <h4>{currentStep.title}</h4>
        <p>{currentStep.body}</p>
        <div className="patient-guide-actions">
          <button type="button" className="btn btn-outline-dark" onClick={markRouteSeen}>
            Fermer
          </button>
          <button type="button" className="btn btn-dark" onClick={goNext}>
            {stepIndex >= routeSteps.length - 1 ? "Compris" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientGuide;
