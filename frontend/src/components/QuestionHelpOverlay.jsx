import React, { useCallback, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

const CONTROL_SELECTOR = "input[name], select[name], textarea[name]";

const findAnchorHost = (control, container) => {
  let current = control;
  while (current && current !== container) {
    if (typeof current.className === "string") {
      if (current.className.includes("form-check")) return current;
      if (/\bcol(?:-|$)/.test(current.className)) return current;
    }
    current = current.parentElement;
  }
  return control.parentElement;
};

const findQuestionLabel = (host) => {
  if (!host) return null;
  return host.querySelector(".form-check-label") || host.querySelector(".form-label");
};

const QuestionHelpOverlay = ({ containerRef, phaseId, onOpenQuestionHelp }) => {
  const [anchors, setAnchors] = useState([]);

  const recalculateAnchors = useCallback(() => {
    const container = containerRef?.current;
    if (!container) {
      setAnchors([]);
      return;
    }
    const seenFields = new Set();
    const nextAnchors = [];

    container.querySelectorAll(CONTROL_SELECTOR).forEach((control) => {
      const fieldName = control.getAttribute("name");
      if (!fieldName || seenFields.has(fieldName)) return;

      const host = findAnchorHost(control, container);
      const label = findQuestionLabel(host);
      if (!label) return;

      seenFields.add(fieldName);
      nextAnchors.push({ fieldName, label });
    });

    setAnchors(nextAnchors);
  }, [containerRef]);

  useLayoutEffect(() => {
    recalculateAnchors();
    const container = containerRef?.current;
    if (!container) return;

    const observer = new MutationObserver(() => recalculateAnchors());
    observer.observe(container, { childList: true, subtree: true });
    window.addEventListener("resize", recalculateAnchors);
    
    // Safety sync after a short delay for modal animations
    const timer = setTimeout(recalculateAnchors, 500);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recalculateAnchors);
      clearTimeout(timer);
    };
  }, [containerRef, phaseId, recalculateAnchors]);

  return anchors.map((anchor) =>
    createPortal(
      <button
        key={`${phaseId}-${anchor.fieldName}`}
        type="button"
        className="question-help-inline-btn"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onOpenQuestionHelp?.(anchor.fieldName);
        }}
        aria-label={`Aide IA pour ${anchor.fieldName}`}
        title="Aide IA"
      >
        <i className="bi bi-patch-question-fill" />
      </button>,
      anchor.label
    )
  );
};

export default QuestionHelpOverlay;
