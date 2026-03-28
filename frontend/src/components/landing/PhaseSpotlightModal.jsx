import React, { useEffect } from "react";

const PhaseSpotlightModal = ({ phase, onClose }) => {
  useEffect(() => {
    if (!phase) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, phase]);

  if (!phase) {
    return null;
  }

  return (
    <div className="phase-spotlight-overlay" onClick={onClose} role="presentation">
      <div className="phase-spotlight-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="phase-spotlight-close" onClick={onClose} aria-label="Fermer la phase">
          <i className="bi bi-x-lg" />
        </button>

        <div className="phase-spotlight-badge">{phase.label}</div>
        <h3>{phase.title}</h3>
        <p className="phase-spotlight-summary">{phase.summary}</p>

        <div className="phase-spotlight-block">
          <span className="phase-spotlight-label">Questions couvertes</span>
          <strong>{phase.questionRange}</strong>
        </div>

        <div className="phase-spotlight-block">
          <span className="phase-spotlight-label">Clinical objectives</span>
          <div className="phase-spotlight-goals">
            {phase.goals.map((goal) => (
              <div key={goal} className="phase-spotlight-goal">
                <i className="bi bi-check2-circle" />
                <span>{goal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseSpotlightModal;
