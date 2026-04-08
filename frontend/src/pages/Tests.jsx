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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold mb-0">Tests cliniques</h2>
        <span className="badge text-bg-light">INPES 2007</span>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div className="card form-card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h5 className="card-title mb-1">Dossier patient (donnees synchronisees)</h5>
              <p className="muted-text mb-0">Les informations demographiques proviennent du dossier initial.</p>
            </div>
            <Link to="/evaluation" className="btn btn-outline-dark btn-sm">
              Mettre a jour
            </Link>
          </div>
          <div className="row g-3 mt-2">
            <div className="col-12 col-md-6">
              <div className="p-3 border rounded-3 bg-light h-100">
                <div className="text-uppercase small muted-text">Date de naissance</div>
                <div className="fw-semibold">{profile?.dateOfBirth || "Non renseigne"}</div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="p-3 border rounded-3 bg-light h-100">
                <div className="text-uppercase small muted-text">Sexe</div>
                <div className="fw-semibold">{formatSex(profile?.sex)}</div>
              </div>
            </div>
            <div className="col-6">
              <div className="p-3 border rounded-3 bg-light h-100">
                <div className="text-uppercase small muted-text">Taille</div>
                <div className="fw-semibold">{profile?.heightCm ? `${profile.heightCm} cm` : "Non renseigne"}</div>
              </div>
            </div>
            <div className="col-6">
              <div className="p-3 border rounded-3 bg-light h-100">
                <div className="text-uppercase small muted-text">Poids</div>
                <div className="fw-semibold">{profile?.weightKg ? `${profile.weightKg} kg` : "Non renseigne"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card form-card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="card-title mb-0">Test de Fagerstrom</h5>
            {editingFagerId && <span className="badge text-bg-warning">Edition</span>}
          </div>
          <form onSubmit={submitFagerstrom} className="row g-3">
            <div className="col-12">
              <label className="form-label">Temps avant la 1ere cigarette</label>
              <select className="form-select" name="timeToFirstCigarette" value={fagerstromForm.timeToFirstCigarette} onChange={handleFagerstromChange}>
                <option value="WITHIN_5_MIN">Moins de 5 minutes</option>
                <option value="MIN_6_TO_30">6 a 30 minutes</option>
                <option value="MIN_31_TO_60">31 a 60 minutes</option>
                <option value="AFTER_60">Plus de 60 minutes</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Cigarette la plus difficile a abandonner</label>
              <select className="form-select" name="mostDifficultCigarette" value={fagerstromForm.mostDifficultCigarette} onChange={handleFagerstromChange}>
                <option value="FIRST_IN_MORNING">La premiere de la journee</option>
                <option value="ANY_OTHER">Une autre</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Nombre de cigarettes par jour</label>
              <select className="form-select" name="cigarettesPerDay" value={fagerstromForm.cigarettesPerDay} onChange={handleFagerstromChange}>
                <option value="TEN_OR_LESS">10 ou moins</option>
                <option value="ELEVEN_TO_TWENTY">11 a 20</option>
                <option value="TWENTY_ONE_TO_THIRTY">21 a 30</option>
                <option value="THIRTY_ONE_OR_MORE">31 ou plus</option>
              </select>
            </div>
            <div className="col-12 form-check">
              <input className="form-check-input" type="checkbox" name="difficultToRefrain" checked={fagerstromForm.difficultToRefrain} onChange={handleFagerstromChange} />
              <label className="form-check-label">Difficile de ne pas fumer dans les lieux interdits</label>
            </div>
            <div className="col-12 form-check">
              <input className="form-check-input" type="checkbox" name="smokeMoreInMorning" checked={fagerstromForm.smokeMoreInMorning} onChange={handleFagerstromChange} />
              <label className="form-check-label">Fumez plus durant les premieres heures</label>
            </div>
            <div className="col-12 form-check">
              <input className="form-check-input" type="checkbox" name="smokeWhenIll" checked={fagerstromForm.smokeWhenIll} onChange={handleFagerstromChange} />
              <label className="form-check-label">Fumez meme malade</label>
            </div>
            <div className="col-12 d-flex gap-2">
              <button className="btn btn-dark" disabled={loading}>
                {editingFagerId ? "Mettre a jour" : "Calculer"}
              </button>
              {editingFagerId && (
                <button
                  type="button"
                  className="btn btn-outline-dark"
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
            </div>
          </form>
          {fagerstromResult && (
            <div className="alert alert-info mt-3">
              Score: {fagerstromResult.totalScore} | Niveau: {fagerstromResult.dependenceLevel}
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">Historique Fagerstrom</h5>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Niveau</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fagerstromHistory.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>{item.totalScore}</td>
                    <td>{item.dependenceLevel}</td>
                    <td className="text-end table-actions">
                      <i className="bi bi-pencil-square me-3" onClick={() => editFagerstrom(item)} />
                      <i className="bi bi-trash" onClick={() => deleteFagerstrom(item.id)} />
                    </td>
                  </tr>
                ))}
                {fagerstromHistory.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-muted">Aucun test pour le moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card form-card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="card-title mb-0">Echelle HAD</h5>
            {editingHadId && <span className="badge text-bg-warning">Edition</span>}
          </div>
          <form onSubmit={submitHad} className="row g-3">
            {hadQuestions.map((question) => (
              <div className="col-12 col-lg-6" key={question.key}>
                <label className="form-label">{question.label}</label>
                <select className="form-select" name={question.key} value={hadForm[question.key]} onChange={handleHadChange}>
                  {question.options.map((option) => (
                    <option key={`${question.key}-${option.value}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            ))}
            <div className="col-12 d-flex gap-2">
              <button className="btn btn-dark" disabled={loading}>
                {editingHadId ? "Mettre a jour" : "Calculer"}
              </button>
              {editingHadId && (
                <button
                  type="button"
                  className="btn btn-outline-dark"
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
            </div>
          </form>
          {hadResult && (
            <div className="alert alert-info mt-3">
              Anxiete: {hadResult.anxietyScore} ({formatHadInterpretation(hadResult.anxietyInterpretation)}) | Depression: {hadResult.depressionScore} ({formatHadInterpretation(hadResult.depressionInterpretation)})
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Historique HAD</h5>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Anxiete</th>
                  <th>Depression</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hadHistory.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>{item.anxietyScore} ({formatHadInterpretation(item.anxietyInterpretation)})</td>
                    <td>{item.depressionScore} ({formatHadInterpretation(item.depressionInterpretation)})</td>
                    <td className="text-end table-actions">
                      <i className="bi bi-pencil-square me-3" onClick={() => editHad(item)} />
                      <i className="bi bi-trash" onClick={() => deleteHad(item.id)} />
                    </td>
                  </tr>
                ))}
                {hadHistory.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-muted">Aucun test pour le moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tests;
