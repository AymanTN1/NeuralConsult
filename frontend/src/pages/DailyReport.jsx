import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const todayISO = () => new Date().toISOString().slice(0, 10);

const DailyReport = () => {
  const { refetch } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    reportDate: todayISO(),
    cigarettesSmoked: "",
    cravingsIntensity: "",
    moodScore: "",
    stressScore: "",
    usedNrt: false,
    relapseEvent: false,
    notes: ""
  });
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const loadReports = async () => {
    const { data } = await api.get("/api/daily-reports");
    setReports(data || []);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const toNumber = (value) => (value === "" || value === null ? null : Number(value));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const payload = {
      ...form,
      cigarettesSmoked: toNumber(form.cigarettesSmoked),
      cravingsIntensity: toNumber(form.cravingsIntensity),
      moodScore: toNumber(form.moodScore),
      stressScore: toNumber(form.stressScore)
    };
    await api.post("/api/daily-reports", payload);
    await refetch();
    setMessage(editingId ? "Journal mis a jour." : "Journal enregistre. Le parcours initial est complet.");
    setEditingId(null);
    setForm((prev) => ({ ...prev, reportDate: todayISO() }));
    await loadReports();
    navigate("/dashboard");
  };

  const handleEdit = (report) => {
    setEditingId(report.id);
    setForm({
      reportDate: report.reportDate,
      cigarettesSmoked: report.cigarettesSmoked ?? "",
      cravingsIntensity: report.cravingsIntensity ?? "",
      moodScore: report.moodScore ?? "",
      stressScore: report.stressScore ?? "",
      usedNrt: !!report.usedNrt,
      relapseEvent: !!report.relapseEvent,
      notes: report.notes || ""
    });
  };

  const handleDelete = async (id) => {
    await api.delete(`/api/daily-reports/${id}`);
    await loadReports();
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({
      reportDate: todayISO(),
      cigarettesSmoked: "",
      cravingsIntensity: "",
      moodScore: "",
      stressScore: "",
      usedNrt: false,
      relapseEvent: false,
      notes: ""
    });
  };

  return (
    <div className="container py-4 app-shell">
      <div className="d-flex justify-content-between align-items-center mb-4" data-guide-id="journal-header">
        <div>
          <div className="hero-kicker">Suivi Quotidien de Santé</div>
          <h2 className="fw-bold mb-0">Journal de Bord du Sevrage</h2>
        </div>
        <span className="nc-badge-pill bg-primary-subtle text-primary border border-primary-subtle">
          <i className="bi bi-calendar-check me-1" />
          7 derniers jours
        </span>
      </div>
      {message && <div className="alert alert-success rounded-4 shadow-sm border-0">{message}</div>}
      <form onSubmit={handleSubmit} className="nc-glass-card p-4 mb-4" data-guide-id="journal-form">
        <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-pencil-square text-primary" />
          {editingId ? "Modifier l'entrée sélectionnée" : "Nouvelle saisie d'aujourd'hui"}
        </h5>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold">Date</label>
            <input className="form-control rounded-3" type="date" name="reportDate" value={form.reportDate} onChange={handleChange} />
          </div>
          <div className="col-6 col-md-4">
            <label className="form-label fw-semibold">Cigarettes fumées</label>
            <input className="form-control rounded-3" type="number" placeholder="0" name="cigarettesSmoked" value={form.cigarettesSmoked} onChange={handleChange} />
          </div>
          <div className="col-6 col-md-4">
            <label className="form-label fw-semibold">Envies de fumer (0-10)</label>
            <input className="form-control rounded-3" type="number" name="cravingsIntensity" value={form.cravingsIntensity} onChange={handleChange} min="0" max="10" />
          </div>
          <div className="col-6 col-md-4">
            <label className="form-label fw-semibold">Humeur générale (0-10)</label>
            <input className="form-control rounded-3" type="number" name="moodScore" value={form.moodScore} onChange={handleChange} min="0" max="10" />
          </div>
          <div className="col-6 col-md-4">
            <label className="form-label fw-semibold">Niveau de stress (0-10)</label>
            <input className="form-control rounded-3" type="number" name="stressScore" value={form.stressScore} onChange={handleChange} min="0" max="10" />
          </div>
          <div className="col-12 col-md-4 d-flex align-items-center gap-3 pt-md-4">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="usedNrtCheck" name="usedNrt" checked={!!form.usedNrt} onChange={handleChange} />
              <label className="form-check-label fw-semibold" htmlFor="usedNrtCheck">Substituts TSN utilisés</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="relapseCheck" name="relapseEvent" checked={!!form.relapseEvent} onChange={handleChange} />
              <label className="form-check-label fw-semibold text-danger" htmlFor="relapseCheck">Épisode de rechute</label>
            </div>
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold">Notes & ressentis</label>
            <textarea className="form-control rounded-3" rows="3" placeholder="Événements marquants, déclencheurs évités, pensées positives..." name="notes" value={form.notes} onChange={handleChange} />
          </div>
        </div>
        <div className="d-flex gap-2 mt-4">
          <button className="btn btn-emerald-gradient px-4">{editingId ? "Mettre à jour" : "Enregistrer mon Journal"}</button>
          {editingId && (
            <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={handleCancel}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="nc-glass-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Historique des entrées</h5>
        </div>
        {reports.length === 0 && <div className="text-muted py-3">Aucun journal pour le moment. Remplissez votre première entrée ci-dessus !</div>}
        {reports.length > 0 && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Cigarettes</th>
                  <th>Envies</th>
                    <th>Humeur</th>
                    <th>Stress</th>
                    <th>NRT</th>
                    <th>Rechute</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.reportDate}</td>
                      <td>{report.cigarettesSmoked ?? "-"}</td>
                      <td>{report.cravingsIntensity ?? "-"}</td>
                      <td>{report.moodScore ?? "-"}</td>
                      <td>{report.stressScore ?? "-"}</td>
                      <td>{report.usedNrt ? "Oui" : "Non"}</td>
                      <td>{report.relapseEvent ? "Oui" : "Non"}</td>
                      <td className="text-end table-actions">
                        <i className="bi bi-pencil-square me-3" onClick={() => handleEdit(report)} />
                        <i className="bi bi-trash" onClick={() => handleDelete(report.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
};

export default DailyReport;
