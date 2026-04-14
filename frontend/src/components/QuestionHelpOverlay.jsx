import React, { useCallback, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

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

const findQuestionLabel = (host) => {
  if (!host) {
    return null;
  }

  const formCheckLabel = host.querySelector(".form-check-label");
  if (formCheckLabel && isVisible(formCheckLabel)) {
    return formCheckLabel;
  }

  const formLabel = host.querySelector(".form-label");
  if (formLabel && isVisible(formLabel)) {
    return formLabel;
  }

  return null;
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

      const label = findQuestionLabel(host);
      if (!label) {
        return;
      }

      seenFields.add(fieldName);
      host.classList.add("question-help-host");
      nextAnchors.push({
        fieldName,
        host,
        label
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

  return anchors.map((anchor) =>
    createPortal(
      <button
        key={`${phaseId}-${anchor.fieldName}`}
        type="button"
        className={`question-help-inline-btn ${anchor.label?.classList?.contains("form-check-label") ? "is-checkbox" : ""}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onOpenQuestionHelp?.(anchor.fieldName);
        }}
        aria-label={`Ouvrir l'aide IA pour ${anchor.fieldName}`}
        title="Aide IA"
      >
        <i className="bi bi-patch-question-fill" />
      </button>,
      anchor.host
    )
  );
};

export default QuestionHelpOverlay;
