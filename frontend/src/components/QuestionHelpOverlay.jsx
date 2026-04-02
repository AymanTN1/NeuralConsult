import React, { useCallback, useLayoutEffect, useState } from "react";

const CONTROL_SELECTOR = "input[name], select[name], textarea[name]";

const isVisible = (element) =>
  Boolean(element) && (element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0);

const findAnchorHost = (control, container) => {
  let current = control;

  while (current && current !== container) {
    if (typeof current.className === "string") {
      if (current.className.includes("form-check")) {
        return current;
      }
      if (/\bcol(?:-|$)/.test(current.className)) {
        return current;
      }
    }
    current = current.parentElement;
  }

  return control.parentElement;
};

const QuestionHelpOverlay = ({ containerRef, phaseId, onOpenQuestionHelp }) => {
  const [anchors, setAnchors] = useState([]);

  const recalculateAnchors = useCallback(() => {
    const container = containerRef?.current;
    if (!container) {
      setAnchors([]);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const seenFields = new Set();
    const nextAnchors = [];

    container.querySelectorAll(CONTROL_SELECTOR).forEach((control) => {
      if (!isVisible(control) || control.disabled) {
        return;
      }

      const fieldName = control.getAttribute("name");
      if (!fieldName || seenFields.has(fieldName)) {
        return;
      }

      const host = findAnchorHost(control, container);
      if (!host || !isVisible(host)) {
        return;
      }

      seenFields.add(fieldName);
      const hostRect = host.getBoundingClientRect();
      nextAnchors.push({
        fieldName,
        top: hostRect.top - containerRect.top + 10,
        left: hostRect.right - containerRect.left - 42
      });
    });

    setAnchors(nextAnchors);
  }, [containerRef]);

  useLayoutEffect(() => {
    recalculateAnchors();
    const container = containerRef?.current;
    if (!container) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => recalculateAnchors());
    resizeObserver.observe(container);

    window.addEventListener("resize", recalculateAnchors);
    window.addEventListener("scroll", recalculateAnchors, true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", recalculateAnchors);
      window.removeEventListener("scroll", recalculateAnchors, true);
    };
  }, [containerRef, phaseId, recalculateAnchors]);

  if (!anchors.length) {
    return null;
  }

  return (
    <div className="question-help-overlay" aria-hidden="true">
      {anchors.map((anchor) => (
        <button
          key={`${phaseId}-${anchor.fieldName}`}
          type="button"
          className="question-help-anchor"
          style={{ top: anchor.top, left: anchor.left }}
          onClick={() => onOpenQuestionHelp?.(anchor.fieldName)}
          aria-label={`Ouvrir l'aide IA pour ${anchor.fieldName}`}
          title="Aide IA"
        >
          <i className="bi bi-patch-question-fill" />
        </button>
      ))}
    </div>
  );
};

export default QuestionHelpOverlay;
