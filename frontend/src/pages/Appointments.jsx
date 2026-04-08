import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { isDoctor } from "../utils/roles";

const statusCopy = {
  REQUESTED: "Demande envoyee",
  CONFIRMED: "Confirme",
  REFUSED: "Refuse",
  CANCELLED: "Annule",
  COMPLETED: "Termine"
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const Appointments = () => {
  const { user } = useAuth();
  const doctorMode = isDoctor(user);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState({});
  const [form, setForm] = useState({
    doctorProfileId: "",
    startsAt: "",
    reason: "",
    triggeredByAiAlert: false
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      if (doctorMode) {
        const { data } = await api.get("/api/appointments/doctor");
        setAppointments(data || []);
      } else {
        const [appointmentsResp, doctorsResp] = await Promise.all([
          api.get("/api/appointments/patient"),
          api.get("/api/doctors")
        ]);
        setAppointments(appointmentsResp.data || []);
        setDoctors(doctorsResp.data || []);
        setForm((previous) => ({
          ...previous,
          doctorProfileId: previous.doctorProfileId || doctorsResp.data?.[0]?.id || ""
        }));
      }
    } catch (error) {
      setAppointments([]);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [doctorMode]);

  const requestAppointment = async (event) => {
    event.preventDefault();
    setMessage(null);
    try {
      await api.post("/api/appointments", form);
      setMessage({ type: "success", text: "Demande de rendez-vous envoyee au medecin." });
      setForm((previous) => ({ ...previous, startsAt: "", reason: "", triggeredByAiAlert: false }));
      await load();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible de reserver ce creneau." });
    }
  };

  const doctorDecision = async (appointmentId, action) => {
    setMessage(null);
    try {
      await api.post(`/api/appointments/${appointmentId}/${action}`, {
        doctorNote: doctorNotes[appointmentId] || null
      });
      setMessage({ type: "success", text: "Rendez-vous mis a jour." });
      await load();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible de mettre a jour le rendez-vous." });
    }
  };

  const cancelAppointment = async (appointmentId) => {
    setMessage(null);
    try {
      await api.post(`/api/appointments/${appointmentId}/cancel`);
      setMessage({ type: "success", text: "Rendez-vous annule." });
      await load();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible d'annuler le rendez-vous." });
    }
  };

  return (
    <div className="container py-4 app-shell">
      <div className="profile-page-header">
        <div>
          <div className="hero-kicker">Rendez-vous clinique</div>
          <h2 className="fw-bold mb-1">{doctorMode ? "Gestion des seances et du planning" : "Planifier un soutien psychique avec le medecin"}</h2>
          <p className="muted-text mb-0">
            {doctorMode
              ? "Le medecin confirme, refuse ou marque les seances comme terminees. Un rythme de 20 minutes permet jusqu'a 3 patients par heure."
              : "Le patient peut demander un rendez-vous sur la plateforme pour un soutien psychique structure, regulier ou exceptionnel."}
          </p>
        </div>
      </div>

      {message && <div className={`alert mt-3 ${message.type === "error" ? "alert-danger" : "alert-success"}`}>{message.text}</div>}

      {!doctorMode && (
        <section className="card form-card mt-4">
          <div className="section-title-sm">Nouvelle demande</div>
          <p className="muted-text mt-2">Choisis un medecin, un creneau de 20 minutes et une raison clinique ou psychologique.</p>
          <form className="row g-3 mt-1" onSubmit={requestAppointment}>
            <div className="col-12 col-md-6">
              <label className="form-label">Medecin</label>
              <select className="form-select" value={form.doctorProfileId} onChange={(event) => setForm((previous) => ({ ...previous, doctorProfileId: event.target.value }))}>
                <option value="">Selectionner</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>{doctor.fullName} · {doctor.specialty || "Tabacologie"}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Debut du rendez-vous</label>
              <input className="form-control" type="datetime-local" value={form.startsAt} onChange={(event) => setForm((previous) => ({ ...previous, startsAt: event.target.value }))} />
            </div>
            <div className="col-12 form-check">
              <input id="triggeredByAiAlert" className="form-check-input" type="checkbox" checked={form.triggeredByAiAlert} onChange={(event) => setForm((previous) => ({ ...previous, triggeredByAiAlert: event.target.checked }))} />
              <label className="form-check-label" htmlFor="triggeredByAiAlert">Demande declenchee apres un echange avec l'IA 24/7</label>
            </div>
            <div className="col-12">
              <label className="form-label">Motif du rendez-vous</label>
              <textarea className="form-control" rows="3" value={form.reason} onChange={(event) => setForm((previous) => ({ ...previous, reason: event.target.value }))} placeholder="Exemple: hausse du stress, envie de rechuter, besoin d'un soutien psychologique, seance de suivi..." />
            </div>
            <div className="col-12 d-flex justify-content-end">
              <button className="btn btn-dark" type="submit">Demander le rendez-vous</button>
            </div>
          </form>
        </section>
      )}

      <section className="card form-card mt-4">
        <div className="section-title-sm">{doctorMode ? "Planning medecin" : "Mes rendez-vous"}</div>
        {loading ? (
          <p className="muted-text mb-0 mt-3">Chargement des rendez-vous...</p>
        ) : appointments.length === 0 ? (
          <p className="muted-text mb-0 mt-3">Aucun rendez-vous pour le moment.</p>
        ) : (
          <div className="doctor-request-stack mt-3">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="doctor-request-card">
                <div className="doctor-request-card-head">
                  <div>
                    <strong>{doctorMode ? appointment.patientName : appointment.doctorName}</strong>
                    <p className="mb-0 muted-text">{formatDateTime(appointment.startsAt)} · {appointment.durationMinutes} min</p>
                  </div>
                  <span className={`doctor-status-chip status-${String(appointment.status || "REQUESTED").toLowerCase()}`}>{statusCopy[appointment.status] || appointment.status}</span>
                </div>
                <p className="muted-text">{appointment.reason || "Aucun motif specifie."}</p>
                {doctorMode ? (
                  <>
                    <textarea className="form-control" rows="2" placeholder="Note de seance ou message au patient" value={doctorNotes[appointment.id] || appointment.doctorNote || ""} onChange={(event) => setDoctorNotes((previous) => ({ ...previous, [appointment.id]: event.target.value }))} />
                    <div className="doctor-card-actions">
                      <button type="button" className="btn btn-dark" onClick={() => doctorDecision(appointment.id, "confirm")}>Confirmer</button>
                      <button type="button" className="btn btn-outline-dark" onClick={() => doctorDecision(appointment.id, "refuse")}>Refuser</button>
                      <button type="button" className="btn btn-outline-dark" onClick={() => doctorDecision(appointment.id, "complete")}>Marquer termine</button>
                    </div>
                  </>
                ) : (
                  <div className="doctor-card-actions">
                    {appointment.triggeredByAiAlert && <span className="doctor-status-chip status-pending">Declenche par IA</span>}
                    {(appointment.status === "REQUESTED" || appointment.status === "CONFIRMED") && (
                      <button type="button" className="btn btn-outline-dark" onClick={() => cancelAppointment(appointment.id)}>Annuler</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Appointments;
