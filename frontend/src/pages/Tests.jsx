import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Tests = () => {
  const { refetch, user } = useAuth();
  const navigate = useNavigate();
  const [fagerstromResult, setFagerstromResult] = useState(null);
  const [hadResult, setHadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fagerstromHistory, setFagerstromHistory] = useState([]);
  const [hadHistory, setHadHistory] = useState([]);
  const [editingFagerId, setEditingFagerId] = useState(null);
  const [editingHadId, setEditingHadId] = useState(null);

  const [fagerstromForm, setFagerstromForm] = useState({
    timeToFirstCigarette: "WITHIN_5_MIN",
    difficultToRefrain: false,
    mostDifficultCigarette: "FIRST_IN_MORNING",
    cigarettesPerDay: "TEN_OR_LESS",
    smokeMoreInMorning: false,
    smokeWhenIll: false
  });

  const [hadForm, setHadForm] = useState({
    q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0,
    q8: 0, q9: 0, q10: 0, q11: 0, q12: 0, q13: 0, q14: 0
  });

  const hadQuestions = [
    {
      key: "q1",
      label: "Je me sens tendu(e) ou enerve(e)",
      options: [
        { value: 3, label: "La plupart du temps" },
        { value: 2, label: "Souvent" },
        { value: 1, label: "De temps en temps" },
        { value: 0, label: "Jamais" }
      ]
    },
    {
      key: "q2",
      label: "Je prends plaisir aux memes choses qu'autrefois",
      options: [
        { value: 0, label: "Oui, tout autant" },
        { value: 1, label: "Pas autant" },
        { value: 2, label: "Un peu seulement" },
        { value: 3, label: "Presque plus" }
      ]
    },
    {
      key: "q3",
      label: "J'ai une sensation de peur comme si quelque chose d'horrible allait m'arriver",
      options: [
        { value: 3, label: "Oui, tres nettement" },
        { value: 2, label: "Oui, mais ce n'est pas trop grave" },
        { value: 1, label: "Un peu, mais cela ne m'inquiete pas" },
        { value: 0, label: "Pas du tout" }
      ]
    },
    {
      key: "q4",
      label: "Je ris facilement et vois le bon cote des choses",
      options: [
        { value: 0, label: "Autant que par le passe" },
        { value: 1, label: "Plus autant qu'avant" },
        { value: 2, label: "Vraiment moins qu'avant" },
        { value: 3, label: "Plus du tout" }
      ]
    },
    {
      key: "q5",
      label: "Je me fais du souci",
      options: [
        { value: 3, label: "Tres souvent" },
        { value: 2, label: "Assez souvent" },
        { value: 1, label: "Occasionnellement" },
        { value: 0, label: "Tres occasionnellement" }
      ]
    },
    {
      key: "q6",
      label: "Je suis de bonne humeur",
      options: [
        { value: 3, label: "Jamais" },
        { value: 2, label: "Rarement" },
        { value: 1, label: "Assez souvent" },
        { value: 0, label: "La plupart du temps" }
      ]
    },
    {
      key: "q7",
      label: "Je peux rester tranquillement assis(e) a ne rien faire et me sentir decontracte(e)",
      options: [
        { value: 0, label: "Oui, quoi qu'il arrive" },
        { value: 1, label: "Oui, en general" },
        { value: 2, label: "Rarement" },
        { value: 3, label: "Jamais" }
      ]
    },
    {
      key: "q8",
      label: "J'ai l'impression de fonctionner au ralenti",
      options: [
        { value: 3, label: "Presque toujours" },
        { value: 2, label: "Tres souvent" },
        { value: 1, label: "Parfois" },
        { value: 0, label: "Jamais" }
      ]
    },
    {
      key: "q9",
      label: "J'eprouve des sensations de peur et j'ai l'estomac noue",
      options: [
        { value: 0, label: "Jamais" },
        { value: 1, label: "Parfois" },
        { value: 2, label: "Assez souvent" },
        { value: 3, label: "Tres souvent" }
      ]
    },
    {
      key: "q10",
      label: "Je ne m'interesse plus a mon apparence",
      options: [
        { value: 3, label: "Plus du tout" },
        { value: 2, label: "Je n'y accorde pas autant d'attention que je devrais" },
        { value: 1, label: "Il se peut que je n'y fasse plus autant attention" },
        { value: 0, label: "J'y prete autant d'attention que par le passe" }
      ]
    },
    {
      key: "q11",
      label: "J'ai la bougeotte et n'arrive pas a tenir en place",
      options: [
        { value: 3, label: "Oui, c'est tout a fait le cas" },
        { value: 2, label: "Un peu" },
        { value: 1, label: "Pas tellement" },
        { value: 0, label: "Pas du tout" }
      ]
    },
    {
      key: "q12",
      label: "Je me rejouis d'avance a l'idee de faire certaines choses",
      options: [
        { value: 0, label: "Autant qu'avant" },
        { value: 1, label: "Un peu moins qu'avant" },
        { value: 2, label: "Bien moins qu'avant" },
        { value: 3, label: "Presque jamais" }
      ]
    },
    {
      key: "q13",
      label: "J'eprouve des sensations soudaines de panique",
      options: [
        { value: 3, label: "Vraiment tres souvent" },
        { value: 2, label: "Assez souvent" },
        { value: 1, label: "Pas tres souvent" },
        { value: 0, label: "Jamais" }
      ]
    },
    {
      key: "q14",
      label: "Je peux prendre plaisir a un bon livre ou a une bonne emission de radio ou de television",
      options: [
        { value: 0, label: "Souvent" },
        { value: 1, label: "Parfois" },
        { value: 2, label: "Rarement" },
        { value: 3, label: "Tres rarement" }
      ]
    }
  ];

  const loadHistory = async () => {
    const [fagerResp, hadResp] = await Promise.all([
      api.get("/api/tests/fagerstrom"),
      api.get("/api/tests/had")
    ]);
    setFagerstromHistory(fagerResp.data || []);
    setHadHistory(hadResp.data || []);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFagerstromChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFagerstromForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleHadChange = (e) => {
    const { name, value } = e.target;
    setHadForm((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const submitFagerstrom = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = editingFagerId
        ? await api.put(`/api/tests/fagerstrom/${editingFagerId}`, fagerstromForm)
        : await api.post("/api/tests/fagerstrom", fagerstromForm);
      setFagerstromResult(response.data);
      await refetch();
      await loadHistory();
      setEditingFagerId(null);
    } catch (err) {
      const apiError = err?.response?.data?.message || err?.response?.data?.error;
      setError(apiError || "Impossible d'enregistrer le test de Fagerstrom.");
    } finally {
      setLoading(false);
    }
  };

  const submitHad = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = editingHadId
        ? await api.put(`/api/tests/had/${editingHadId}`, hadForm)
        : await api.post("/api/tests/had", hadForm);
      setHadResult(response.data);
      const me = await refetch();
      await loadHistory();
      setEditingHadId(null);
      if (me?.profile?.testsComplete && !me?.profile?.journalComplete) {
        navigate("/journal");
      }
    } catch (err) {
      const apiError = err?.response?.data?.message || err?.response?.data?.error;
      setError(apiError || "Impossible d'enregistrer l'echelle HAD.");
    } finally {
      setLoading(false);
    }
  };

  const editFagerstrom = (item) => {
    setEditingFagerId(item.id);
    setFagerstromForm({
      timeToFirstCigarette: item.timeToFirstCigarette,
      difficultToRefrain: item.difficultToRefrain,
      mostDifficultCigarette: item.mostDifficultCigarette,
      cigarettesPerDay: item.cigarettesPerDay,
      smokeMoreInMorning: item.smokeMoreInMorning,
      smokeWhenIll: item.smokeWhenIll
    });
  };

  const editHad = (item) => {
    setEditingHadId(item.id);
    setHadForm({
      q1: item.q1, q2: item.q2, q3: item.q3, q4: item.q4, q5: item.q5, q6: item.q6, q7: item.q7,
      q8: item.q8, q9: item.q9, q10: item.q10, q11: item.q11, q12: item.q12, q13: item.q13, q14: item.q14
    });
  };

  const deleteFagerstrom = async (id) => {
    await api.delete(`/api/tests/fagerstrom/${id}`);
    await loadHistory();
  };

  const deleteHad = async (id) => {
    await api.delete(`/api/tests/had/${id}`);
    await loadHistory();
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  const formatHadInterpretation = (value) => {
    if (value === "CERTAIN_SYMPTOMATOLOGY") return "Symptomatologie certaine";
    if (value === "BORDERLINE") return "Douteux";
    if (value === "NORMAL") return "Normal";
    return value || "-";
  };

  const formatSex = (value) => {
    if (value === "FEMALE") return "Femme";
    if (value === "MALE") return "Homme";
    if (value === "OTHER") return "Autre";
    return "Non renseigne";
  };

  const profile = user?.profile;

  return (
    <div className="container py-4 app-shell">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="hero-kicker">Évaluations Médicales Recommandées</div>
          <h2 className="fw-bold mb-0">Bilans Cliniques Fagerström & HAD</h2>
        </div>
        <span className="nc-badge-pill bg-info-subtle text-info border border-info-subtle">
          <i className="bi bi-shield-check me-1" />
          Normes HAS & INPES
        </span>
      </div>

      {error && <div className="alert alert-danger rounded-4 shadow-sm border-0 mb-4">{error}</div>}

      <div className="nc-glass-card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-lungs-fill text-primary" />
            Test de Dépendance Nicotinique (Fagerström)
          </h5>
          {editingFagerId && <span className="badge bg-warning text-dark">Mode Édition</span>}
        </div>
        <form onSubmit={submitFagerstrom}>
          <div className="nc-test-question">
            <span className="nc-test-q-label">1. Délai avant la 1ère cigarette après le réveil</span>
            <div className="nc-choice-grid">
              {[
                { value: "WITHIN_5_MIN", label: "Moins de 5 minutes" },
                { value: "MIN_6_TO_30", label: "6 à 30 minutes" },
                { value: "MIN_31_TO_60", label: "31 à 60 minutes" },
                { value: "AFTER_60", label: "Plus de 60 minutes" }
              ].map(opt => (
                <div 
                  key={opt.value} 
                  className={`nc-choice-card ${fagerstromForm.timeToFirstCigarette === opt.value ? 'is-selected' : ''}`}
                  onClick={() => setFagerstromForm(p => ({ ...p, timeToFirstCigarette: opt.value }))}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          <div className="nc-test-question">
            <span className="nc-test-q-label">2. Cigarette la plus difficile à abandonner</span>
            <div className="nc-choice-grid">
              {[
                { value: "FIRST_IN_MORNING", label: "La première de la journée" },
                { value: "ANY_OTHER", label: "Une autre" }
              ].map(opt => (
                <div 
                  key={opt.value} 
                  className={`nc-choice-card ${fagerstromForm.mostDifficultCigarette === opt.value ? 'is-selected' : ''}`}
                  onClick={() => setFagerstromForm(p => ({ ...p, mostDifficultCigarette: opt.value }))}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          <div className="nc-test-question">
            <span className="nc-test-q-label">3. Nombre de cigarettes par jour</span>
            <div className="nc-choice-grid">
              {[
                { value: "TEN_OR_LESS", label: "10 ou moins" },
                { value: "ELEVEN_TO_TWENTY", label: "11 à 20" },
                { value: "TWENTY_ONE_TO_THIRTY", label: "21 à 30" },
                { value: "THIRTY_ONE_OR_MORE", label: "31 ou plus" }
              ].map(opt => (
                <div 
                  key={opt.value} 
                  className={`nc-choice-card ${fagerstromForm.cigarettesPerDay === opt.value ? 'is-selected' : ''}`}
                  onClick={() => setFagerstromForm(p => ({ ...p, cigarettesPerDay: opt.value }))}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          <div className="nc-test-question">
            <span className="nc-test-q-label mb-3">4. Comportements additionnels</span>
            <div className="d-flex flex-column gap-2">
              <div 
                className="nc-switch-card" 
                onClick={() => setFagerstromForm(p => ({ ...p, difficultToRefrain: !p.difficultToRefrain }))}
              >
                <span className="nc-switch-label">Difficile de ne pas fumer dans les lieux interdits</span>
                <div className="form-check form-switch m-0">
                  <input className="form-check-input" type="checkbox" checked={fagerstromForm.difficultToRefrain} readOnly />
                </div>
              </div>
              <div 
                className="nc-switch-card" 
                onClick={() => setFagerstromForm(p => ({ ...p, smokeMoreInMorning: !p.smokeMoreInMorning }))}
              >
                <span className="nc-switch-label">Fumez plus durant les premières heures</span>
                <div className="form-check form-switch m-0">
                  <input className="form-check-input" type="checkbox" checked={fagerstromForm.smokeMoreInMorning} readOnly />
                </div>
              </div>
              <div 
                className="nc-switch-card" 
                onClick={() => setFagerstromForm(p => ({ ...p, smokeWhenIll: !p.smokeWhenIll }))}
              >
                <span className="nc-switch-label">Fumez même malade ou alité</span>
                <div className="form-check form-switch m-0">
                  <input className="form-check-input" type="checkbox" checked={fagerstromForm.smokeWhenIll} readOnly />
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 justify-content-end">
            {editingFagerId && (
              <button
                type="button"
                className="btn btn-outline-secondary fw-semibold rounded-pill px-4"
                onClick={() => {
                  setEditingFagerId(null);
                  setFagerstromForm({
                    timeToFirstCigarette: "WITHIN_5_MIN",
                    difficultToRefrain: false,
                    mostDifficultCigarette: "FIRST_IN_MORNING",
                    cigarettesPerDay: "TEN_OR_LESS",
                    smokeMoreInMorning: false,
                    smokeWhenIll: false
                  });
                }}
              >
                Annuler
              </button>
            )}
            <button className="btn btn-primary fw-semibold rounded-pill px-4 d-flex align-items-center gap-2" disabled={loading}>
              <i className="bi bi-magic" />
              {editingFagerId ? "Mettre à jour le Bilan" : "Calculer le Bilan Fagerström"}
            </button>
          </div>
        </form>
          {fagerstromResult && (
            <div className="alert alert-success mt-4 d-flex align-items-center gap-3 rounded-4 border-0 shadow-sm">
              <i className="bi bi-check-circle-fill fs-3 text-success"></i>
              <div>
                <strong className="d-block mb-1">Score: {fagerstromResult.totalScore}/10</strong>
                <span className="mb-0 text-dark">Niveau: {fagerstromResult.dependenceLevel}</span>
              </div>
            </div>
          )}
        </div>

      <div className="nc-glass-card p-4 mb-4">
        <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-clock-history text-secondary" />
          Historique Fagerström
        </h5>
        <div className="nc-history-list">
          {fagerstromHistory.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">Aucun historique d'évaluation Fagerström.</p>
          ) : (
            fagerstromHistory.map((item) => (
              <div key={item.id} className="nc-history-card">
                <div className="nc-history-meta">
                  <span className="nc-history-date">{formatDate(item.createdAt)}</span>
                  <strong className="text-dark">Score: {item.totalScore}/10</strong>
                </div>
                <div className="nc-history-scores">
                  <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-medium">{item.dependenceLevel}</span>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary rounded-circle" style={{ width: "32px", height: "32px", padding: 0 }} onClick={() => editFagerstrom(item)}>
                      <i className="bi bi-pencil-square" />
                    </button>
                    <button className="btn btn-sm btn-outline-danger rounded-circle" style={{ width: "32px", height: "32px", padding: 0 }} onClick={() => deleteFagerstrom(item.id)}>
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="nc-glass-card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-heart-pulse-fill text-primary" />
            Échelle Hospitalière d'Anxiété et de Dépression (HAD)
          </h5>
          {editingHadId && <span className="badge bg-warning text-dark">Mode Édition</span>}
        </div>
        
        <form onSubmit={submitHad}>
          {hadQuestions.map((question, index) => (
            <div className="nc-test-question" key={question.key}>
              <span className="nc-test-q-label">{index + 1}. {question.label}</span>
              <div className="nc-likert-scale">
                {question.options.map((option) => (
                  <div
                    key={`${question.key}-${option.value}`}
                    className={`nc-likert-option ${hadForm[question.key] === option.value ? 'is-selected' : ''}`}
                    onClick={() => setHadForm(p => ({ ...p, [question.key]: option.value }))}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="d-flex gap-2 justify-content-end mt-4">
            {editingHadId && (
              <button
                type="button"
                className="btn btn-outline-secondary fw-semibold rounded-pill px-4"
                onClick={() => {
                  setEditingHadId(null);
                  setHadForm({
                    q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0,
                    q8: 0, q9: 0, q10: 0, q11: 0, q12: 0, q13: 0, q14: 0
                  });
                }}
              >
                Annuler
              </button>
            )}
            <button className="btn btn-primary fw-semibold rounded-pill px-4 d-flex align-items-center gap-2" disabled={loading}>
              <i className="bi bi-magic" />
              {editingHadId ? "Mettre à jour le Bilan" : "Calculer le Bilan HAD"}
            </button>
          </div>
        </form>
        
        {hadResult && (
          <div className="alert alert-success mt-4 d-flex align-items-center gap-3 rounded-4 border-0 shadow-sm">
            <i className="bi bi-check-circle-fill fs-3 text-success"></i>
            <div>
              <strong className="d-block mb-1">Anxiété : {hadResult.anxietyScore} ({formatHadInterpretation(hadResult.anxietyInterpretation)})</strong>
              <span className="mb-0 text-dark">Dépression : {hadResult.depressionScore} ({formatHadInterpretation(hadResult.depressionInterpretation)})</span>
            </div>
          </div>
        )}
      </div>

      <div className="nc-glass-card p-4">
        <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-clock-history text-secondary" />
          Historique HAD
        </h5>
        <div className="nc-history-list">
          {hadHistory.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">Aucun historique d'évaluation HAD.</p>
          ) : (
            hadHistory.map((item) => (
              <div key={item.id} className="nc-history-card">
                <div className="nc-history-meta">
                  <span className="nc-history-date">{formatDate(item.createdAt)}</span>
                  <strong className="text-dark">A : {item.anxietyScore} | D : {item.depressionScore}</strong>
                </div>
                <div className="nc-history-scores">
                  <div className="d-flex flex-column flex-sm-row gap-2">
                    <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-medium">Anxiété : {formatHadInterpretation(item.anxietyInterpretation)}</span>
                    <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-medium">Dépression : {formatHadInterpretation(item.depressionInterpretation)}</span>
                  </div>
                  <div className="d-flex gap-2 ms-2">
                    <button className="btn btn-sm btn-outline-secondary rounded-circle" style={{ width: "32px", height: "32px", padding: 0 }} onClick={() => editHad(item)}>
                      <i className="bi bi-pencil-square" />
                    </button>
                    <button className="btn btn-sm btn-outline-danger rounded-circle" style={{ width: "32px", height: "32px", padding: 0 }} onClick={() => deleteHad(item.id)}>
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Tests;
