import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Tests = () => {
  const { refetch } = useAuth();
  const [fagerstromResult, setFagerstromResult] = useState(null);
  const [hadResult, setHadResult] = useState(null);
  const [loading, setLoading] = useState(false);
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
    const response = editingFagerId
      ? await api.put(`/api/tests/fagerstrom/${editingFagerId}`, fagerstromForm)
      : await api.post("/api/tests/fagerstrom", fagerstromForm);
    setFagerstromResult(response.data);
    await refetch();
    await loadHistory();
    setEditingFagerId(null);
    setLoading(false);
  };

  const submitHad = async (e) => {
    e.preventDefault();
    setLoading(true);
    const response = editingHadId
      ? await api.put(`/api/tests/had/${editingHadId}`, hadForm)
      : await api.post("/api/tests/had", hadForm);
    setHadResult(response.data);
    await refetch();
    await loadHistory();
    setEditingHadId(null);
    setLoading(false);
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

  return (
    <div className="container py-4 app-shell">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold mb-0">Tests cliniques</h2>
        <span className="badge text-bg-light">INPES 2007</span>
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
                <option value="WITHIN_5_MIN">Moins de 5 min (3)</option>
                <option value="MIN_6_TO_30">6 a 30 min (2)</option>
                <option value="MIN_31_TO_60">31 a 60 min (1)</option>
                <option value="AFTER_60">Apres 60 min (0)</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Cigarette la plus difficile a abandonner</label>
              <select className="form-select" name="mostDifficultCigarette" value={fagerstromForm.mostDifficultCigarette} onChange={handleFagerstromChange}>
                <option value="FIRST_IN_MORNING">La premiere de la journee (1)</option>
                <option value="ANY_OTHER">Une autre (0)</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Nombre de cigarettes par jour</label>
              <select className="form-select" name="cigarettesPerDay" value={fagerstromForm.cigarettesPerDay} onChange={handleFagerstromChange}>
                <option value="TEN_OR_LESS">10 ou moins (0)</option>
                <option value="ELEVEN_TO_TWENTY">11 a 20 (1)</option>
                <option value="TWENTY_ONE_TO_THIRTY">21 a 30 (2)</option>
                <option value="THIRTY_ONE_OR_MORE">31 ou plus (3)</option>
              </select>
            </div>
            <div className="col-12 form-check">
              <input className="form-check-input" type="checkbox" name="difficultToRefrain" checked={fagerstromForm.difficultToRefrain} onChange={handleFagerstromChange} />
              <label className="form-check-label">Difficile de ne pas fumer dans les lieux interdits (1)</label>
            </div>
            <div className="col-12 form-check">
              <input className="form-check-input" type="checkbox" name="smokeMoreInMorning" checked={fagerstromForm.smokeMoreInMorning} onChange={handleFagerstromChange} />
              <label className="form-check-label">Fumez plus durant les premieres heures (1)</label>
            </div>
            <div className="col-12 form-check">
              <input className="form-check-input" type="checkbox" name="smokeWhenIll" checked={fagerstromForm.smokeWhenIll} onChange={handleFagerstromChange} />
              <label className="form-check-label">Fumez meme malade (1)</label>
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
            {Object.keys(hadForm).map((key) => (
              <div className="col-6 col-md-3" key={key}>
                <label className="form-label">{key.toUpperCase()}</label>
                <select className="form-select" name={key} value={hadForm[key]} onChange={handleHadChange}>
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
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
              Anxiete: {hadResult.anxietyScore} ({hadResult.anxietyInterpretation}) | Depression: {hadResult.depressionScore} ({hadResult.depressionInterpretation})
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
                    <td>{item.anxietyScore} ({item.anxietyInterpretation})</td>
                    <td>{item.depressionScore} ({item.depressionInterpretation})</td>
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
