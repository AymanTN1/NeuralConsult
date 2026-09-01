import React, { useEffect, useState } from "react";
import api from "../services/api";

const buildConversationHistory = (messages) =>
  messages
    .filter((message) => message.role === "assistant" || message.role === "user")
    .map((message) => ({
      role: message.role,
      content: message.content
    }));

const buildAssistantText = (data) => {
  const lines = [];
  if (data.explanation) {
    lines.push(data.explanation);
  }
  if (Array.isArray(data.clarifyingQuestions) && data.clarifyingQuestions.length) {
    lines.push(data.clarifyingQuestions.map((question, index) => `${index + 1}. ${question}`).join("\n"));
  }
  if (data.suggestedChoiceLabel) {
    lines.push(`Pour l'instant, l'option la plus proche me semble etre : ${data.suggestedChoiceLabel}.`);
  }
  if (data.suggestionReason) {
    lines.push(data.suggestionReason);
  }
  return lines.join("\n");
};

const QuestionAssistantModal = ({
  open,
  onClose,
  questionMeta,
  currentValue,
  patientFacts,
  onApplySuggestion
}) => {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const officialChoices = questionMeta?.officialChoices || [];

  const askAssistant = async (patientMessage = "", existingMessages = [], silentUserMessage = false) => {
    if (!questionMeta) return;

    const trimmedMessage = patientMessage ? patientMessage.trim() : "";
    const baseMessages = existingMessages.length ? existingMessages : messages;
    const userMessage =
      trimmedMessage && !silentUserMessage
        ? {
            id: `user-${Date.now()}`,
            role: "user",
            kind: "chat",
            content: trimmedMessage
          }
        : null;

    const nextMessages = userMessage ? [...baseMessages, userMessage] : baseMessages;
    if (userMessage) {
      setMessages(nextMessages);
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post("/api/ai-assistant/assist", {
        phaseId: questionMeta.phaseId,
        phaseLabel: questionMeta.phaseLabel,
        questionId: questionMeta.questionId,
        questionLabel: questionMeta.questionLabel,
        questionContext: questionMeta.questionContext,
        patientMessage: silentUserMessage ? null : (trimmedMessage || null),
        currentAnswer: currentValue,
        officialChoices,
        patientFacts: patientFacts || {},
        conversationHistory: buildConversationHistory(nextMessages)
      });

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        kind: "analysis",
        content: buildAssistantText(data),
        explanation: data.explanation,
        clarifyingQuestions: data.clarifyingQuestions || [],
        suggestedChoiceValue: data.suggestedChoiceValue,
        suggestedChoiceLabel: data.suggestedChoiceLabel,
        suggestionReason: data.suggestionReason,
        safetyNote: data.safetyNote,
        engine: data.engine,
        engineWarning: data.engineWarning,
        references: data.references || []
      };

      setMessages([...nextMessages, assistantMessage]);
      setDraft("");
    } catch (err) {
      const apiError = err?.response?.data?.message || err?.response?.data?.error;
      setError(apiError || "Impossible d'obtenir l'aide IA pour cette question.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !questionMeta) {
      return;
    }

    setMessages([]);
    setDraft("");
    setError(null);
    askAssistant("", [], true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, questionMeta?.questionId]);

  if (!open || !questionMeta) return null;

  const latestSuggestion = [...messages]
    .reverse()
    .find((message) => message.role === "assistant" && message.suggestedChoiceValue);

  return (
    <div className="question-assistant-backdrop" onClick={onClose}>
      <div className="question-assistant-modal" onClick={(event) => event.stopPropagation()}>
        <div className="question-assistant-head">
          <div>
            <div className="hero-kicker">Aide IA contextuelle</div>
            <h4>{questionMeta.questionLabel}</h4>
            {messages.length === 0 && (
              <p className="muted-text mb-0">
                Ici, l&apos;IA ne remplit pas la case a ta place. Elle clarifie la question et t&apos;aide a approcher la
                meilleure reponse.
              </p>
            )}
          </div>
          <button type="button" className="btn btn-outline-dark btn-sm" onClick={onClose}>
            Fermer
          </button>
        </div>

        <details className="question-assistant-choice-bank">
          <summary>Voir les choix officiels du dossier</summary>
          <div className="question-assistant-choice-list mt-3">
            {officialChoices.length ? (
              officialChoices.map((choice) => (
                <button
                  key={`${questionMeta.questionId}-${choice.value}`}
                  type="button"
                  className="question-assistant-choice-chip is-clickable"
                  onClick={() =>
                    setDraft(
                      `Je pense que le choix le plus proche est \"${choice.label}\". Peux-tu le verifier avec moi en me posant les bonnes questions ?`
                    )
                  }
                >
                  {choice.label}
                </button>
              ))
            ) : (
              <span className="question-assistant-choice-chip">Cette question attend surtout une reponse libre ou factuelle.</span>
            )}
          </div>
        </details>

        <div className="question-assistant-chat">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`question-assistant-bubble ${message.role === "user" ? "is-user" : "is-assistant"}`}
            >
              <div className="question-assistant-bubble-role">
                {message.role === "user" ? "Patient" : "IA clinique"}
              </div>
              <div className="question-assistant-bubble-text">
                {message.kind === "analysis" ? (
                  <>
                    <p style={{ whiteSpace: "pre-line" }}>{message.content}</p>

                    {message.suggestedChoiceValue && (
                      <div className="question-assistant-inline-actions">
                        <button
                          type="button"
                          className="btn btn-outline-dark btn-sm"
                          onClick={() => onApplySuggestion?.(message.suggestedChoiceValue, message.suggestedChoiceLabel)}
                        >
                          Appliquer "{message.suggestedChoiceLabel}"
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="mb-0" style={{ whiteSpace: "pre-line" }}>
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="question-assistant-bubble is-assistant is-loading">
              <div className="question-assistant-bubble-role">IA clinique</div>
              <div className="question-assistant-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

        <div className="question-assistant-composer">
          <div className="muted-text small mb-2">
            Reponds avec tes mots. L&apos;IA va s&apos;appuyer sur cette question precise, sur les choix officiels et sur tes
            reponses pour se rapprocher de la meilleure option.
          </div>
          <textarea
            className="form-control"
            rows="3"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Exemple : En ce moment je veux surtout arreter totalement, mais je ne sais pas si je vais y arriver ce mois-ci..."
          />
          <div className="question-assistant-actions">
            {latestSuggestion?.suggestedChoiceValue && (
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={() =>
                  onApplySuggestion?.(latestSuggestion.suggestedChoiceValue, latestSuggestion.suggestedChoiceLabel)
                }
              >
                Valider la suggestion
              </button>
            )}
            <button
              type="button"
              className="btn btn-dark"
              disabled={loading || !draft.trim()}
              onClick={() => askAssistant(draft)}
            >
              {loading ? "Analyse..." : "Continuer la discussion"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionAssistantModal;
