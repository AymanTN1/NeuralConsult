import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { isDoctor } from "../utils/roles";

const statusCopy = {
  REQUESTED: "En attente",
  CONFIRMED: "Confirme",
  REFUSED: "Refuse",
  CANCELLED: "Annule",
  COMPLETED: "Termine"
};

const weekdayOptions = [
  { value: "MONDAY", label: "Lundi" },
  { value: "TUESDAY", label: "Mardi" },
  { value: "WEDNESDAY", label: "Mercredi" },
  { value: "THURSDAY", label: "Jeudi" },
  { value: "FRIDAY", label: "Vendredi" },
  { value: "SATURDAY", label: "Samedi" },
  { value: "SUNDAY", label: "Dimanche" }
];

const weekDayShort = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const toJsDate = (value) => {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (typeof value === "string" && /^\\d{4}-\\d{2}-\\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = toJsDate(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatDate = (value) => {
  const date = toJsDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  });
};

const formatTime = (value) => {
  if (!value) return "";
  const date = toJsDate(value);
  if (Number.isNaN(date.getTime())) {
    if (typeof value === "string" && value.includes(":")) {
      return value.slice(0, 5);
    }
    return value;
  }
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const toDateTimeLocalValue = (value) => {
  if (!value) return "";
  const date = toJsDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toDateKey = (value) => {
  const date = toJsDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addMonths = (date, count) => new Date(date.getFullYear(), date.getMonth() + count, 1);
const sameMonth = (left, right) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();

const startOfWeek = (date) => {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfWeek = (date) => {
  const copy = startOfWeek(date);
  copy.setDate(copy.getDate() + 6);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const buildCalendarGrid = (monthDate) => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const firstGridDate = new Date(monthStart);
  const startDay = (firstGridDate.getDay() + 6) % 7;
  firstGridDate.setDate(firstGridDate.getDate() - startDay);

  const days = [];
  for (let index = 0; index < 42; index += 1) {
    const current = new Date(firstGridDate);
    current.setDate(firstGridDate.getDate() + index);
    days.push(current);
  }
  return { monthStart, monthEnd, days };
};

const Appointments = () => {
  const { user } = useAuth();
  const doctorMode = isDoctor(user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [assignedDoctor, setAssignedDoctor] = useState(null);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState({});
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
  const [form, setForm] = useState({
    doctorProfileId: "",
    startsAt: "",
    reason: "",
    triggeredByAiAlert: false
  });
  const [availabilityForm, setAvailabilityForm] = useState({
    id: "",
    dayOfWeek: "MONDAY",
    startTime: "09:00",
    endTime: "12:00",
    active: true
  });
  const [urgentForm, setUrgentForm] = useState({
    patientProfileId: "",
    startsAt: "",
    reason: "",
    triggeredByAiAlert: true
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [savingUrgent, setSavingUrgent] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [savingAppointmentUpdate, setSavingAppointmentUpdate] = useState(false);

  const activeAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status !== "CANCELLED" && appointment.status !== "REFUSED"),
    [appointments]
  );

  const slotsByDate = useMemo(() => {
    return availableSlots.reduce((accumulator, slot) => {
      const key = toDateKey(slot.startsAt);
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(slot);
      return accumulator;
    }, {});
  }, [availableSlots]);

  const availableMonths = useMemo(() => {
    const months = availableSlots.map((slot) => {
      const date = new Date(slot.startsAt);
      return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    });
    if (months.length === 0) {
      return [startOfMonth(new Date()).getTime()];
    }
    return [...new Set(months)].sort((left, right) => left - right);
  }, [availableSlots]);

  const selectedDateSlots = useMemo(() => {
    if (!selectedDateKey) return [];
    return slotsByDate[selectedDateKey] || [];
  }, [selectedDateKey, slotsByDate]);

  const doctorAppointmentGroups = useMemo(() => ({
    requested: appointments.filter((appointment) => appointment.status === "REQUESTED"),
    confirmed: appointments.filter((appointment) => appointment.status === "CONFIRMED"),
    completed: appointments.filter((appointment) => appointment.status === "COMPLETED"),
    archived: appointments.filter((appointment) => appointment.status === "REFUSED" || appointment.status === "CANCELLED")
  }), [appointments]);

const hasReachedMonthlyLimit = (dateValue) => {
    const target = toJsDate(dateValue);
    return activeAppointments.filter((appointment) => {
      const date = new Date(appointment.startsAt);
      return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
    }).length >= 4;
  };

const hasReachedWeeklyLimit = (dateValue) => {
    const weekStart = startOfWeek(toJsDate(dateValue));
    const weekEnd = endOfWeek(toJsDate(dateValue));
    return activeAppointments.filter((appointment) => {
      const date = new Date(appointment.startsAt);
      return date >= weekStart && date <= weekEnd;
    }).length >= 1;
  };

  const isDateSelectable = (dateValue) => {
    const key = toDateKey(dateValue);
    const daySlots = slotsByDate[key] || [];
    if (daySlots.length === 0) return false;
    if (hasReachedMonthlyLimit(dateValue)) return false;
    if (hasReachedWeeklyLimit(dateValue)) return false;
    return true;
  };

  const load = async () => {
    setLoading(true);
    if (doctorMode) {
      const [appointmentsResp, availabilityResp, patientsResp] = await Promise.allSettled([
        api.get("/api/appointments/doctor"),
        api.get("/api/appointments/availability/doctor"),
        api.get("/api/doctors/patients")
      ]);

      const nextAppointments = appointmentsResp.status === "fulfilled" ? appointmentsResp.value.data || [] : [];
      const nextAvailabilities = availabilityResp.status === "fulfilled" ? availabilityResp.value.data || [] : [];
      const nextPatients = patientsResp.status === "fulfilled" ? patientsResp.value.data || [] : [];

      setAppointments(nextAppointments);
      setAvailabilities(nextAvailabilities);
      setAssignedPatients(nextPatients);
      setUrgentForm((previous) => {
        const currentStillExists = nextPatients.some((patient) => patient.patientProfileId === previous.patientProfileId);
        return {
          ...previous,
          patientProfileId: currentStillExists ? previous.patientProfileId : nextPatients[0]?.patientProfileId || ""
        };
      });
      setLoading(false);
      return;
    }

    let nextAppointments = [];
    let association = null;

    try {
      const appointmentsResp = await api.get("/api/appointments/patient");
      nextAppointments = appointmentsResp.data || [];
      setAppointments(nextAppointments);
    } catch (error) {
      setAppointments([]);
    }

    try {
      const associationResp = await api.get("/api/doctors/association/patient");
      association = associationResp.data || null;
      setAssignedDoctor(association);
      setForm((previous) => ({
        ...previous,
        doctorProfileId: association?.doctorProfileId || "",
        startsAt: association?.doctorProfileId ? previous.startsAt : ""
      }));
    } catch (error) {
      association = null;
      setAssignedDoctor(null);
      setForm((previous) => ({
        ...previous,
        doctorProfileId: "",
        startsAt: ""
      }));
    }

    if (!association?.doctorProfileId) {
      setAvailableSlots([]);
      setSelectedDateKey("");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/api/appointments/availability/patient");
      const slots = data || [];
      const localSlotsByDate = slots.reduce((accumulator, slot) => {
        const key = toDateKey(slot.startsAt);
        if (!accumulator[key]) {
          accumulator[key] = [];
        }
        accumulator[key].push(slot);
        return accumulator;
      }, {});

      const localHasReachedMonthlyLimit = (dateValue) => {
        const target = new Date(dateValue);
        return nextAppointments
          .filter((appointment) => appointment.status !== "CANCELLED" && appointment.status !== "REFUSED")
          .filter((appointment) => {
            const date = new Date(appointment.startsAt);
            return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
          }).length >= 4;
      };

      const localHasReachedWeeklyLimit = (dateValue) => {
        const weekStart = startOfWeek(new Date(dateValue));
        const weekEnd = endOfWeek(new Date(dateValue));
        return nextAppointments
          .filter((appointment) => appointment.status !== "CANCELLED" && appointment.status !== "REFUSED")
          .filter((appointment) => {
            const date = new Date(appointment.startsAt);
            return date >= weekStart && date <= weekEnd;
          }).length >= 1;
      };

      setAvailableSlots(slots);
      const firstSelectableSlot = slots.find((slot) => {
        const key = toDateKey(slot.startsAt);
        return (localSlotsByDate[key] || []).length > 0
          && !localHasReachedMonthlyLimit(slot.startsAt)
          && !localHasReachedWeeklyLimit(slot.startsAt);
      });
      setSelectedDateKey((previous) => {
        if (previous && (localSlotsByDate[previous]?.length || 0) > 0) {
          return previous;
        }
        return firstSelectableSlot ? toDateKey(firstSelectableSlot.startsAt) : "";
      });
      setForm((previous) => {
        const exists = slots.some((slot) => slot.startsAt === previous.startsAt);
        return exists ? previous : { ...previous, startsAt: "" };
      });
      if (slots.length > 0) {
        const firstMonth = toJsDate(slots[0].startsAt);
        setVisibleMonth(startOfMonth(firstMonth));
      }
    } catch (error) {
      setAvailableSlots([]);
      setSelectedDateKey("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [doctorMode]);

  useEffect(() => {
    if (!doctorMode) {
      return;
    }
    const urgentPatient = searchParams.get("urgentPatient");
    if (!urgentPatient || assignedPatients.length === 0) {
      return;
    }
    const patientExists = assignedPatients.some((patient) => patient.patientProfileId === urgentPatient);
    if (!patientExists) {
      return;
    }
    setUrgentForm((previous) => ({
      ...previous,
      patientProfileId: urgentPatient
    }));
    setMessage({
      type: "success",
      text: "Patient preselectionne depuis une alerte IA. Choisis maintenant l'horaire de la consultation urgente."
    });
    const next = new URLSearchParams(searchParams);
    next.delete("urgentPatient");
    setSearchParams(next, { replace: true });
  }, [doctorMode, assignedPatients, searchParams, setSearchParams]);

  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(() => setMessage(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (!selectedDateKey) return;
    if (!isDateSelectable(selectedDateKey)) {
      setSelectedDateKey("");
      setForm((previous) => ({ ...previous, startsAt: "" }));
    }
  }, [appointments, availableSlots]);

  const requestAppointment = async (event) => {
    event.preventDefault();
    setMessage(null);
    try {
      await api.post("/api/appointments", {
        ...form,
        doctorProfileId: assignedDoctor?.doctorProfileId || form.doctorProfileId
      });
      setMessage({ type: "success", text: "Demande de rendez-vous envoyee au medecin." });
      setForm((previous) => ({
        ...previous,
        startsAt: "",
        reason: "",
        triggeredByAiAlert: false
      }));
      await load();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible de reserver ce creneau." });
    }
  };

  const saveAvailability = async (event) => {
    event.preventDefault();
    setMessage(null);
    setSavingAvailability(true);
    try {
      await api.post("/api/appointments/availability/doctor", availabilityForm);
      setMessage({
        type: "success",
        text: availabilityForm.id
          ? "Disponibilite modifiee. Les patients verront la nouvelle plage."
          : "Disponibilite ajoutee. Les patients verront maintenant ces creneaux."
      });
      setAvailabilityForm({
        id: "",
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "12:00",
        active: true
      });
      await load();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible d'enregistrer cette disponibilite." });
    } finally {
      setSavingAvailability(false);
    }
  };

  const editAvailability = (availability) => {
    setAvailabilityForm({
      id: availability.id,
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime?.slice(0, 5) || "09:00",
      endTime: availability.endTime?.slice(0, 5) || "12:00",
      active: availability.active
    });
    setMessage({
      type: "success",
      text: "Mode modification actif. Ajuste la plage puis enregistre pour mettre a jour ce creneau."
    });
  };

  const resetAvailabilityForm = () => {
    setAvailabilityForm({
      id: "",
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "12:00",
      active: true
    });
  };

  const createUrgentAppointment = async (event) => {
    event.preventDefault();
    setMessage(null);
    setSavingUrgent(true);
    try {
      await api.post("/api/appointments/doctor/urgent", urgentForm);
      setMessage({ type: "success", text: "Consultation urgente creee. Elle apparait maintenant dans le planning et chez le patient." });
      setUrgentForm((previous) => ({
        ...previous,
        startsAt: "",
        reason: "",
        triggeredByAiAlert: true
      }));
      await load();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible de creer la consultation urgente." });
    } finally {
      setSavingUrgent(false);
    }
  };

  const beginAppointmentEdit = (appointment) => {
    setEditingAppointment({
      id: appointment.id,
      startsAt: toDateTimeLocalValue(appointment.startsAt),
      reason: appointment.reason || "",
      doctorNote: appointment.doctorNote || ""
    });
    setMessage({
      type: "success",
      text: "Mode modification actif. Ajuste le rendez-vous puis enregistre."
    });
  };

  const cancelAppointmentEdit = () => {
    setEditingAppointment(null);
  };

  const saveAppointmentUpdate = async (role) => {
    if (!editingAppointment?.id) {
      return;
    }
    setMessage(null);
    setSavingAppointmentUpdate(true);
    try {
      await api.post(`/api/appointments/${editingAppointment.id}/${role === "doctor" ? "doctor-update" : "patient-update"}`, {
        startsAt: editingAppointment.startsAt || null,
        reason: editingAppointment.reason,
        doctorNote: role === "doctor" ? editingAppointment.doctorNote : null
      });
      setEditingAppointment(null);
      setMessage({ type: "success", text: "Rendez-vous modifie avec succes." });
      await load();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible de modifier ce rendez-vous." });
    } finally {
      setSavingAppointmentUpdate(false);
    }
  };

  const removeAvailability = async (availabilityId) => {
    const confirmed = window.confirm("Etes-vous sur de vouloir supprimer cette disponibilite ?");
    if (!confirmed) {
      return;
    }
    setMessage(null);
    try {
      await api.post(`/api/appointments/availability/doctor/${availabilityId}/delete`);
      setMessage({ type: "success", text: "Disponibilite supprimee." });
      if (availabilityForm.id === availabilityId) {
        resetAvailabilityForm();
      }
      await load();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible de supprimer cette disponibilite." });
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

  const cancelAppointmentAsDoctor = async (appointmentId) => {
    const confirmed = window.confirm("Etes-vous sur de vouloir annuler ce rendez-vous cote medecin ?");
    if (!confirmed) {
      return;
    }
    setMessage(null);
    try {
      await api.post(`/api/appointments/${appointmentId}/cancel-doctor`);
      setMessage({ type: "success", text: "Rendez-vous annule cote medecin." });
      await load();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible d'annuler ce rendez-vous." });
    }
  };

  const cancelAppointment = async (appointmentId) => {
    const confirmed = window.confirm("Etes-vous sur de vouloir annuler ce rendez-vous ?");
    if (!confirmed) {
      return;
    }
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

  const { monthStart, days } = buildCalendarGrid(visibleMonth);
  const canGoPreviousMonth = availableMonths.some((timestamp) => timestamp < monthStart.getTime());
  const canGoNextMonth = availableMonths.some((timestamp) => timestamp > monthStart.getTime());

  const renderDoctorAppointmentTable = (title, items, emptyText) => (
    <section className="card form-card mt-4">
      <div className="section-title-sm">{title}</div>
      {items.length === 0 ? (
        <p className="muted-text mb-0 mt-3">{emptyText}</p>
      ) : (
        <div className="doctor-table-shell mt-3">
          <table className="table table-borderless align-middle doctor-table appointment-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Motif</th>
                <th>Etat</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    <strong>{appointment.patientName}</strong>
                    <div className="doctor-table-subcopy">{appointment.durationMinutes} min</div>
                  </td>
                  <td>{formatDateTime(appointment.startsAt)}</td>
                  <td>
                    <div className="appointment-cell-copy">{appointment.reason || "Aucun motif specifie."}</div>
                    {editingAppointment?.id === appointment.id ? (
                      <div className="mt-3 d-grid gap-2">
                        <input
                          className="form-control form-control-sm"
                          type="datetime-local"
                          step={300}
                          value={editingAppointment.startsAt}
                          onChange={(event) => setEditingAppointment((previous) => ({ ...previous, startsAt: event.target.value }))}
                        />
                        <textarea
                          className="form-control form-control-sm"
                          rows="2"
                          placeholder="Motif du rendez-vous"
                          value={editingAppointment.reason}
                          onChange={(event) => setEditingAppointment((previous) => ({ ...previous, reason: event.target.value }))}
                        />
                      </div>
                    ) : null}
                    <textarea
                      className="form-control form-control-sm mt-2"
                      rows="2"
                      placeholder="Note clinique"
                      value={
                        editingAppointment?.id === appointment.id
                          ? editingAppointment.doctorNote
                          : doctorNotes[appointment.id] || appointment.doctorNote || ""
                      }
                      onChange={(event) => {
                        if (editingAppointment?.id === appointment.id) {
                          setEditingAppointment((previous) => ({ ...previous, doctorNote: event.target.value }));
                          return;
                        }
                        setDoctorNotes((previous) => ({ ...previous, [appointment.id]: event.target.value }));
                      }}
                    />
                  </td>
                  <td>
                    <div className="appointment-status-stack appointment-status-stack-inline">
                      <span className={`doctor-status-chip status-${String(appointment.status || "REQUESTED").toLowerCase()}`}>
                        {statusCopy[appointment.status] || appointment.status}
                      </span>
                      {appointment.triggeredByAiAlert && <span className="doctor-status-chip status-pending">Urgent / IA</span>}
                    </div>
                  </td>
                  <td>
                    <div className="appointment-action-column">
                      {(appointment.status === "REQUESTED" || appointment.status === "CONFIRMED") && editingAppointment?.id !== appointment.id && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => beginAppointmentEdit(appointment)}>Modifier</button>
                      )}
                      {editingAppointment?.id === appointment.id && (
                        <>
                          <button type="button" className="btn btn-success btn-sm" disabled={savingAppointmentUpdate} onClick={() => saveAppointmentUpdate("doctor")}>
                            {savingAppointmentUpdate ? "Enregistrement..." : "Enregistrer"}
                          </button>
                          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={cancelAppointmentEdit}>Fermer</button>
                        </>
                      )}
                      {appointment.status === "REQUESTED" && editingAppointment?.id !== appointment.id && (
                        <>
                          <button type="button" className="btn btn-success btn-sm" onClick={() => doctorDecision(appointment.id, "confirm")}>Confirmer</button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => doctorDecision(appointment.id, "refuse")}>Refuser</button>
                        </>
                      )}
                      {appointment.status === "CONFIRMED" && editingAppointment?.id !== appointment.id && (
                        <>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => doctorDecision(appointment.id, "complete")}>Marquer termine</button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => cancelAppointmentAsDoctor(appointment.id)}>Annuler</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const renderPatientAppointmentTable = () => (
    <section className="card form-card mt-4">
      <div className="section-title-sm">Mes rendez-vous</div>
      {loading ? (
        <p className="muted-text mb-0 mt-3">Chargement des rendez-vous...</p>
      ) : appointments.length === 0 ? (
        <p className="muted-text mb-0 mt-3">Aucun rendez-vous pour le moment.</p>
      ) : (
        <div className="doctor-table-shell mt-3">
          <table className="table table-borderless align-middle doctor-table appointment-table">
            <thead>
              <tr>
                <th>Medecin</th>
                <th>Date</th>
                <th>Motif</th>
                <th>Etat</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    <strong>{appointment.doctorName}</strong>
                    <div className="doctor-table-subcopy">{appointment.durationMinutes} min</div>
                  </td>
                  <td>{formatDateTime(appointment.startsAt)}</td>
                  <td>
                    <div className="appointment-cell-copy">{appointment.reason || "Aucun motif specifie."}</div>
                    {editingAppointment?.id === appointment.id ? (
                      <div className="mt-3 d-grid gap-2">
                        <input
                          className="form-control form-control-sm"
                          type="datetime-local"
                          step={300}
                          value={editingAppointment.startsAt}
                          onChange={(event) => setEditingAppointment((previous) => ({ ...previous, startsAt: event.target.value }))}
                        />
                        <textarea
                          className="form-control form-control-sm"
                          rows="2"
                          placeholder="Motif du rendez-vous"
                          value={editingAppointment.reason}
                          onChange={(event) => setEditingAppointment((previous) => ({ ...previous, reason: event.target.value }))}
                        />
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div className="appointment-status-stack appointment-status-stack-inline">
                      <span className={`doctor-status-chip status-${String(appointment.status || "REQUESTED").toLowerCase()}`}>
                        {statusCopy[appointment.status] || appointment.status}
                      </span>
                      {appointment.triggeredByAiAlert && <span className="doctor-status-chip status-pending">Urgent / IA</span>}
                    </div>
                  </td>
                  <td>
                    <div className="appointment-action-column appointment-action-column-right">
                      {(appointment.status === "REQUESTED" || appointment.status === "CONFIRMED") && editingAppointment?.id !== appointment.id && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => beginAppointmentEdit(appointment)}>Modifier</button>
                      )}
                      {editingAppointment?.id === appointment.id && (
                        <>
                          <button type="button" className="btn btn-success btn-sm" disabled={savingAppointmentUpdate} onClick={() => saveAppointmentUpdate("patient")}>
                            {savingAppointmentUpdate ? "Enregistrement..." : "Enregistrer"}
                          </button>
                          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={cancelAppointmentEdit}>Fermer</button>
                        </>
                      )}
                      {(appointment.status === "REQUESTED" || appointment.status === "CONFIRMED") && editingAppointment?.id !== appointment.id && (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => cancelAppointment(appointment.id)}>Annuler</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  return (
    <div className="container py-4 app-shell" data-guide-id="appointments-main">
      <div className="profile-page-header" data-guide-id="appointments-header">
        <div>
          <div className="hero-kicker">Rendez-vous clinique</div>
          <h2 className="fw-bold mb-1">{doctorMode ? "Gestion des seances et disponibilites" : "Planifier un soutien psychique avec le medecin"}</h2>
          <p className="muted-text mb-0">
            {doctorMode
              ? "Le medecin ouvre ses jours et ses horaires de teleconsultation, confirme les demandes et peut creer une consultation urgente si l'IA 24/7 remonte un risque."
              : "Le patient choisit un jour depuis le calendrier, puis un creneau de 20 minutes ouvert par son medecin associe. Limite: 4 seances par mois et 1 par semaine."}
          </p>
        </div>
      </div>

      {message && (
        <div className={`floating-feedback-toast ${message.type === "error" ? "is-error" : "is-success"}`}>
          <div>
            <strong>{message.type === "error" ? "Action non terminee" : "Action confirmee"}</strong>
            <p className="mb-0">{message.text}</p>
          </div>
          <button type="button" className="btn btn-link btn-sm" onClick={() => setMessage(null)}>Fermer</button>
        </div>
      )}

      {doctorMode ? (
        <>
          <section className="card form-card mt-4">
            <div className="section-title-sm">Disponibilites de teleconsultation</div>
            <p className="muted-text mt-2">Definis ici les jours et les horaires que tes patients verront dans leur page de reservation. Chaque plage est ensuite decoupee automatiquement en seances de 20 minutes.</p>
            <form className="row g-3 mt-1" onSubmit={saveAvailability}>
              <div className="col-12 col-md-4">
                <label className="form-label">Jour</label>
                <select
                  className="form-select"
                  value={availabilityForm.dayOfWeek}
                  onChange={(event) => setAvailabilityForm((previous) => ({ ...previous, dayOfWeek: event.target.value }))}
                >
                  {weekdayOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label">Heure de debut</label>
                <input
                  className="form-control"
                  type="time"
                  step={300}
                  value={availabilityForm.startTime}
                  onChange={(event) => setAvailabilityForm((previous) => ({ ...previous, startTime: event.target.value }))}
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label">Heure de fin</label>
                <input
                  className="form-control"
                  type="time"
                  step={300}
                  value={availabilityForm.endTime}
                  onChange={(event) => setAvailabilityForm((previous) => ({ ...previous, endTime: event.target.value }))}
                />
              </div>
              <div className="col-12 col-md-2 d-flex align-items-end gap-2">
                <button className="btn btn-success w-100" type="submit" disabled={savingAvailability}>
                  {savingAvailability ? "Enregistrement..." : availabilityForm.id ? "Modifier" : "Ajouter"}
                </button>
                {availabilityForm.id ? (
                  <button className="btn btn-outline-secondary w-100" type="button" onClick={resetAvailabilityForm}>Annuler</button>
                ) : null}
              </div>
            </form>

            <div className="doctor-table-shell mt-4">
              {availabilities.length === 0 ? (
                <div className="doctor-dossier-empty-state">
                  <p className="mb-0">Aucune disponibilite definie pour le moment. Ajoute au moins une plage pour debloquer la reservation cote patient.</p>
                </div>
              ) : (
                <table className="table table-borderless align-middle doctor-table appointment-table">
                  <thead>
                    <tr>
                      <th>Jour</th>
                      <th>Debut</th>
                      <th>Fin</th>
                      <th>Etat</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availabilities.map((availability) => (
                      <tr key={availability.id}>
                        <td><strong>{weekdayOptions.find((option) => option.value === availability.dayOfWeek)?.label || availability.dayOfWeek}</strong></td>
                        <td>{formatTime(`2000-01-01T${availability.startTime}`)}</td>
                        <td>{formatTime(`2000-01-01T${availability.endTime}`)}</td>
                        <td>
                          <span className={`doctor-status-chip ${availability.active ? "status-confirmed" : "status-cancelled"}`}>
                            {availability.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="appointment-action-column appointment-action-column-right">
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => editAvailability(availability)}>Modifier</button>
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeAvailability(availability.id)}>Supprimer</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="card form-card mt-4">
            <div className="section-title-sm">Consultation urgente</div>
            <p className="muted-text mt-2">Si une alerte IA remonte un besoin prioritaire, tu peux creer manuellement une consultation urgente meme hors plages normales. Elle apparaitra immediatement dans le planning et chez le patient.</p>
            <form className="row g-3 mt-1" onSubmit={createUrgentAppointment}>
              <div className="col-12 col-md-4">
                <label className="form-label">Patient associe</label>
                <select
                  className="form-select"
                  value={urgentForm.patientProfileId}
                  onChange={(event) => setUrgentForm((previous) => ({ ...previous, patientProfileId: event.target.value }))}
                >
                  {assignedPatients.length === 0 ? <option value="">Aucun patient associe</option> : null}
                  {assignedPatients.map((patient) => (
                    <option key={patient.patientProfileId} value={patient.patientProfileId}>{patient.patientName}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label">Date et heure</label>
                <input
                  className="form-control"
                  type="datetime-local"
                  step={300}
                  value={urgentForm.startsAt}
                  onChange={(event) => setUrgentForm((previous) => ({ ...previous, startsAt: event.target.value }))}
                />
              </div>
              <div className="col-12 col-md-4 d-flex align-items-end">
                <div className="form-check mb-2">
                  <input
                    id="urgentTriggeredByAiAlert"
                    className="form-check-input"
                    type="checkbox"
                    checked={urgentForm.triggeredByAiAlert}
                    onChange={(event) => setUrgentForm((previous) => ({ ...previous, triggeredByAiAlert: event.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="urgentTriggeredByAiAlert">Liee a une alerte IA 24/7</label>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label">Motif clinique</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={urgentForm.reason}
                  onChange={(event) => setUrgentForm((previous) => ({ ...previous, reason: event.target.value }))}
                  placeholder="Exemple: rechute imminente, crise anxieuse, risque important detecte dans la conversation IA..."
                />
              </div>
              <div className="col-12 d-flex justify-content-end">
                <button className="btn btn-success" type="submit" disabled={!urgentForm.patientProfileId || !urgentForm.startsAt || savingUrgent}>
                  {savingUrgent ? "Creation..." : "Creer la consultation urgente"}
                </button>
              </div>
            </form>
          </section>
        </>
      ) : (
        <section className="card form-card mt-4">
          <div className="section-title-sm">Nouvelle demande</div>
          {!assignedDoctor ? (
            <div className="doctor-dossier-empty-state mt-3">
              <p className="mb-0">Tu pourras reserver un rendez-vous des qu'un medecin aura accepte ton dossier. Pour l'instant, la prise de rendez-vous reste volontairement limitee a ton medecin associe.</p>
            </div>
          ) : (
            <>
              <p className="muted-text mt-2">Choisis d'abord un jour dans le calendrier. Les jours sans disponibilite, ou deja bloques par tes quotas hebdomadaires/mensuels, restent grises et non selectionnables.</p>
              <div className="doctor-overview-card mt-3">
                <span className="profile-data-label">Medecin associe</span>
                <strong>{assignedDoctor.doctorName}</strong>
                <p className="mb-0 muted-text">{assignedDoctor.specialty || "Tabacologie"} · {assignedDoctor.city || "Ville non renseignee"}</p>
              </div>
              <form className="row g-3 mt-1" onSubmit={requestAppointment}>
                <div className="col-12 col-xl-7">
                  <div className="appointment-calendar-card">
                    <div className="appointment-calendar-head">
                      <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => setVisibleMonth((previous) => addMonths(previous, -1))} disabled={!canGoPreviousMonth}>
                        Mois precedent
                      </button>
                      <strong>{visibleMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</strong>
                      <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => setVisibleMonth((previous) => addMonths(previous, 1))} disabled={!canGoNextMonth}>
                        Mois suivant
                      </button>
                    </div>
                    <div className="appointment-calendar-grid appointment-calendar-weekdays">
                      {weekDayShort.map((day) => <span key={day}>{day}</span>)}
                    </div>
                    <div className="appointment-calendar-grid">
                      {days.map((day) => {
                        const key = toDateKey(day);
                        const inCurrentMonth = sameMonth(day, visibleMonth);
                        const selectable = isDateSelectable(day);
                        const hasSlots = (slotsByDate[key] || []).length > 0;
                        return (
                          <button
                            key={key}
                            type="button"
                            className={`appointment-calendar-day ${inCurrentMonth ? "current-month" : "other-month"} ${hasSlots ? "has-slots" : "no-slots"} ${selectable ? "selectable" : "blocked"} ${selectedDateKey === key ? "selected" : ""}`}
                            disabled={!selectable}
                            onClick={() => {
                              setSelectedDateKey(key);
                              setForm((previous) => ({ ...previous, startsAt: "" }));
                            }}
                          >
                            <span>{day.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="col-12 col-xl-5">
                  <div className="appointment-slot-panel">
                    <div className="section-title-sm">Creneaux du jour</div>
                    {!selectedDateKey ? (
                      <p className="muted-text mt-3 mb-0">Choisis un jour disponible pour afficher les seances de 20 minutes.</p>
                    ) : selectedDateSlots.length === 0 ? (
                      <p className="muted-text mt-3 mb-0">Aucun creneau libre sur cette date.</p>
                    ) : (
                      <>
                        <p className="muted-text mt-2">{formatDate(selectedDateKey)}</p>
                        <div className="availability-slot-list mt-3">
                          {selectedDateSlots.map((slot) => (
                            <button
                              key={slot.startsAt}
                              type="button"
                              className={`availability-slot-btn ${form.startsAt === slot.startsAt ? "selected" : ""}`}
                              onClick={() => setForm((previous) => ({ ...previous, startsAt: slot.startsAt }))}
                            >
                              {formatTime(slot.startsAt)} - {formatTime(slot.endsAt)}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="col-12 form-check">
                  <input
                    id="triggeredByAiAlert"
                    className="form-check-input"
                    type="checkbox"
                    checked={form.triggeredByAiAlert}
                    onChange={(event) => setForm((previous) => ({ ...previous, triggeredByAiAlert: event.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="triggeredByAiAlert">Demande declenchee apres un echange avec l'IA 24/7</label>
                </div>
                <div className="col-12">
                  <label className="form-label">Motif du rendez-vous</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={form.reason}
                    onChange={(event) => setForm((previous) => ({ ...previous, reason: event.target.value }))}
                    placeholder="Exemple: hausse du stress, envie de rechuter, besoin d'un soutien psychologique, seance de suivi..."
                  />
                </div>
                <div className="col-12 d-flex justify-content-end">
                  <button className="btn btn-success" type="submit" disabled={!form.startsAt}>
                    Demander le rendez-vous
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      )}

      {doctorMode ? (
        <>
          {renderDoctorAppointmentTable("Demandes en attente", doctorAppointmentGroups.requested, "Aucune demande de rendez-vous en attente.")}
          {renderDoctorAppointmentTable("Consultations confirmees", doctorAppointmentGroups.confirmed, "Aucune consultation confirmee pour le moment.")}
          {renderDoctorAppointmentTable("Consultations terminees", doctorAppointmentGroups.completed, "Aucune consultation terminee pour le moment.")}
          {renderDoctorAppointmentTable("Consultations refusees ou annulees", doctorAppointmentGroups.archived, "Aucune consultation refusee ou annulee pour le moment.")}
        </>
      ) : renderPatientAppointmentTable()}
    </div>
  );
};

export default Appointments;
