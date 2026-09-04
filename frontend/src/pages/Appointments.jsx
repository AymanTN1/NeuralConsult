import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { isDoctor } from "../utils/roles";
import ConsultationReportForm from "../components/ConsultationReportForm";
import LungLoader from "../components/LungLoader";
import Modal from "react-bootstrap/Modal";
import { DEMO_DOCTOR_PATIENTS, getDemoDoctorAvailabilities } from "../services/demoMockService";

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

const todayDateValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

const formatAvailabilityDate = (value) => {
  if (!value) return "-";
  const date = toJsDate(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const getAvailabilityDayLabel = (availability) => {
  if (!availability) return "-";
  if (availability.dayOfWeek) {
    const match = weekdayOptions.find(
      (option) => option.value.toUpperCase() === String(availability.dayOfWeek).toUpperCase()
    );
    if (match) return match.label;
  }
  if (availability.availableDate) {
    const date = toJsDate(availability.availableDate);
    if (!Number.isNaN(date.getTime())) {
      const name = date.toLocaleDateString("fr-FR", { weekday: "long" });
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  }
  return "-";
};

const renderTimeRange = (startTime, endTime) => {
  if (!startTime && !endTime) return "-";
  const cleanStart = typeof startTime === "string" ? startTime.slice(0, 5) : "";
  const cleanEnd = typeof endTime === "string" ? endTime.slice(0, 5) : "";
  if (cleanStart && cleanEnd) return `${cleanStart} - ${cleanEnd}`;
  return cleanStart || cleanEnd || "-";
};

const formatTime = (value) => {
  if (!value || typeof value !== "string" || value.includes("undefined")) return "";
  const date = toJsDate(value);
  if (Number.isNaN(date.getTime())) {
    if (value.includes(":")) {
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

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  "linear-gradient(135deg, #059669 0%, #047857 100%)",
  "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
  "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
  "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
  "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)"
];

const getAvatarGradient = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const getPatientInitials = (name = "") => {
  if (!name) return "PT";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getRelativeTimeBadge = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const diffHours = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60));
  const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffHours >= 0 && diffHours <= 3) {
    return <span className="badge bg-danger text-white px-2 py-0.5" style={{ fontSize: "0.72rem" }}>Dans {diffHours}h</span>;
  }
  if (diffDays === 0) {
    return <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5" style={{ fontSize: "0.72rem" }}>{"Aujourd'hui"}</span>;
  }
  if (diffDays === 1) {
    return <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5" style={{ fontSize: "0.72rem" }}>Demain</span>;
  }
  if (diffDays > 1 && diffDays <= 7) {
    return <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-0.5" style={{ fontSize: "0.72rem" }}>Dans {diffDays}j</span>;
  }
  if (diffDays === -1) {
    return <span className="badge bg-secondary-subtle text-secondary px-2 py-0.5" style={{ fontSize: "0.72rem" }}>Hier</span>;
  }
  if (diffDays < -1) {
    return <span className="badge bg-secondary-subtle text-secondary px-2 py-0.5" style={{ fontSize: "0.72rem" }}>Il y a {Math.abs(diffDays)}j</span>;
  }
  return null;
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
    availableDate: todayDateValue(),
    startTime: "09:00",
    endTime: "12:00",
    bufferMinutes: 10,
    slotDurationMinutes: 20,
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
  const [reportingAppointmentId, setReportingAppointmentId] = useState(null);
  const [savingAppointmentUpdate, setSavingAppointmentUpdate] = useState(false);
  const [activeDoctorTab, setActiveDoctorTab] = useState("consultations"); // "consultations" | "availabilities" | "urgent"
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "REQUESTED" | "CONFIRMED" | "COMPLETED" | "ARCHIVED"
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyUrgentFilter, setOnlyUrgentFilter] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState(null);

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

  const openMeeting = (appointment) => {
    if (!appointment?.meetingJoinUrl) {
      setMessage({
        type: "error",
        text: "Le lien visio n'est pas encore actif. Il est envoye automatiquement environ 10 minutes avant le rendez-vous."
      });
      return;
    }
    window.open(appointment.meetingJoinUrl, "_blank", "noopener,noreferrer");
  };

  const doctorAppointmentGroups = useMemo(() => ({
    requested: appointments.filter((appointment) => appointment.status === "REQUESTED"),
    confirmed: appointments.filter((appointment) => appointment.status === "CONFIRMED"),
    completed: appointments.filter((appointment) => appointment.status === "COMPLETED"),
    archived: appointments.filter((appointment) => appointment.status === "REFUSED" || appointment.status === "CANCELLED")
  }), [appointments]);

  const filteredDoctorAppointments = useMemo(() => {
    return appointments.filter((app) => {
      if (statusFilter === "REQUESTED" && app.status !== "REQUESTED") return false;
      if (statusFilter === "CONFIRMED" && app.status !== "CONFIRMED") return false;
      if (statusFilter === "COMPLETED" && app.status !== "COMPLETED") return false;
      if (statusFilter === "ARCHIVED" && app.status !== "REFUSED" && app.status !== "CANCELLED") return false;

      if (onlyUrgentFilter && !app.triggeredByAiAlert) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const pName = (app.patientName || "").toLowerCase();
        const reason = (app.reason || "").toLowerCase();
        const note = (app.doctorNote || "").toLowerCase();
        const dStr = (formatDateTime(app.startsAt) || "").toLowerCase();
        if (!pName.includes(q) && !reason.includes(q) && !note.includes(q) && !dStr.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [appointments, statusFilter, onlyUrgentFilter, searchTerm]);

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
      const rawAvailabilities = availabilityResp.status === "fulfilled" ? availabilityResp.value.data || [] : [];
      const validAvailabilities = Array.isArray(rawAvailabilities)
        ? rawAvailabilities.filter((a) => a && typeof a === "object" && (a.startTime || a.availableDate) && !a.startsAt)
        : [];
      const nextAvailabilities = (rawAvailabilities.length > 0 && validAvailabilities.length === 0)
        ? getDemoDoctorAvailabilities()
        : validAvailabilities;
      const rawPatients = patientsResp.status === "fulfilled" ? patientsResp.value.data || [] : [];
      const nextPatients = rawPatients.length > 0
        ? rawPatients.map((p, idx) => {
            const fallback = DEMO_DOCTOR_PATIENTS[idx % DEMO_DOCTOR_PATIENTS.length];
            return {
              ...fallback,
              ...p,
              patientProfileId: p.patientProfileId || fallback.patientProfileId,
              fullName: (p.fullName && p.fullName !== "-" && p.fullName !== "Non renseigne")
                ? p.fullName
                : (fallback.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || fallback.fullName),
              city: (p.city && p.city !== "Non renseigne") ? p.city : fallback.city
            };
          })
        : DEMO_DOCTOR_PATIENTS;

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

  const calculateSlotPreview = (startTime, endTime, slotDuration = 20, buffer = 10) => {
    if (!startTime || !endTime) return { count: 0, slots: [] };
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const step = Number(slotDuration) + Number(buffer);

    let cur = startMinutes;
    const slots = [];
    while (cur + Number(slotDuration) <= endMinutes) {
      const sH = String(Math.floor(cur / 60)).padStart(2, "0");
      const sM = String(cur % 60).padStart(2, "0");
      const eH = String(Math.floor((cur + Number(slotDuration)) / 60)).padStart(2, "0");
      const eM = String((cur + Number(slotDuration)) % 60).padStart(2, "0");
      slots.push(`${sH}:${sM} - ${eH}:${eM}`);
      cur += step;
    }
    return { count: slots.length, slots };
  };

  const saveAvailability = async (event) => {
    event.preventDefault();
    setMessage(null);
    setSavingAvailability(true);
    try {
      const response = await api.post("/api/appointments/availability/doctor", availabilityForm);
      const savedAvailability = response.data;

      // Mise à jour immédiate du state local pour affichage instantané sans recharger la page
      if (savedAvailability && savedAvailability.id) {
        setAvailabilities((prev) => {
          const index = prev.findIndex((a) => a.id === savedAvailability.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = savedAvailability;
            return next;
          }
          return [savedAvailability, ...prev];
        });
      }

      setMessage({
        type: "success",
        text: availabilityForm.id
          ? "Disponibilité modifiée avec succès. Les créneaux ont été recalculés."
          : "Disponibilité ajoutée avec succès. Elle apparaît immédiatement dans votre planning."
      });
      resetAvailabilityForm();
      await load();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible d'enregistrer cette disponibilité." });
    } finally {
      setSavingAvailability(false);
    }
  };

  const editAvailability = (availability) => {
    setAvailabilityForm({
      id: availability.id,
      availableDate: availability.availableDate || todayDateValue(),
      startTime: availability.startTime?.slice(0, 5) || "09:00",
      endTime: availability.endTime?.slice(0, 5) || "12:00",
      bufferMinutes: availability.bufferMinutes !== undefined ? availability.bufferMinutes : 10,
      slotDurationMinutes: availability.slotDurationMinutes || 20,
      active: availability.active
    });
    setMessage({
      type: "success",
      text: "Mode modification actif. Ajuste la plage ou la pause inter-séances puis enregistre."
    });
  };

  const resetAvailabilityForm = () => {
    setAvailabilityForm({
      id: "",
      availableDate: todayDateValue(),
      startTime: "09:00",
      endTime: "12:00",
      bufferMinutes: 10,
      slotDurationMinutes: 20,
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
      setAvailabilities((prev) => prev.filter((a) => a.id !== availabilityId));
      setMessage({ type: "success", text: "Disponibilité supprimée avec succès." });
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
    const mappedStatus = {
      confirm: "CONFIRMED",
      refuse: "REFUSED",
      complete: "COMPLETED",
      "cancel-doctor": "CANCELLED"
    }[action] || "CONFIRMED";

    setAppointments((prev) =>
      prev.map((app) =>
        app.id === appointmentId
          ? { ...app, status: mappedStatus, doctorNote: doctorNotes[appointmentId] || app.doctorNote }
          : app
      )
    );

    try {
      await api.post(`/api/appointments/${appointmentId}/${action}`, {
        doctorNote: doctorNotes[appointmentId] || null
      });
      setMessage({ type: "success", text: "Rendez-vous mis a jour." });
      await load();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: apiError ? "error" : "info", text: apiError || "Rendez-vous mis a jour." });
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

  const renderDoctorAppointmentsView = () => (
    <div className="mt-3">
      {/* Search & Filters Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 p-3 rounded-3 bg-white border shadow-sm">
        {/* Status Filter Buttons */}
        <div className="nc-status-filter-bar">
          <button
            type="button"
            className={`nc-status-filter-btn ${statusFilter === "ALL" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            Toutes <span className="badge bg-secondary-subtle text-secondary rounded-pill">{appointments.length}</span>
          </button>
          <button
            type="button"
            className={`nc-status-filter-btn ${statusFilter === "REQUESTED" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("REQUESTED")}
          >
            <i className="bi bi-hourglass-split text-warning" />
            En attente <span className="badge bg-warning-subtle text-warning rounded-pill">{doctorAppointmentGroups.requested.length}</span>
          </button>
          <button
            type="button"
            className={`nc-status-filter-btn ${statusFilter === "CONFIRMED" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("CONFIRMED")}
          >
            <i className="bi bi-check-circle-fill text-success" />
            Confirmées <span className="badge bg-success-subtle text-success rounded-pill">{doctorAppointmentGroups.confirmed.length}</span>
          </button>
          <button
            type="button"
            className={`nc-status-filter-btn ${statusFilter === "COMPLETED" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("COMPLETED")}
          >
            <i className="bi bi-check2-all text-info" />
            Terminées <span className="badge bg-info-subtle text-info rounded-pill">{doctorAppointmentGroups.completed.length}</span>
          </button>
          <button
            type="button"
            className={`nc-status-filter-btn ${statusFilter === "ARCHIVED" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("ARCHIVED")}
          >
            <i className="bi bi-archive-fill text-muted" />
            Historique / Annulées <span className="badge bg-light text-muted rounded-pill border">{doctorAppointmentGroups.archived.length}</span>
          </button>
        </div>

        {/* Search input & Urgent filter */}
        <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0" style={{ minWidth: "280px" }}>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-search text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Rechercher un patient, motif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchTerm("")}>
                <i className="bi bi-x" />
              </button>
            )}
          </div>
          <button
            type="button"
            className={`btn btn-sm ${onlyUrgentFilter ? "btn-danger" : "btn-outline-danger"}`}
            style={{ whiteSpace: "nowrap" }}
            onClick={() => setOnlyUrgentFilter((prev) => !prev)}
            title="Afficher uniquement les consultations déclenchées par une alerte IA"
          >
            <i className="bi bi-lightning-charge-fill me-1" />
            Urgences IA
          </button>
        </div>
      </div>

      {/* Consultations Table */}
      {filteredDoctorAppointments.length === 0 ? (
        <div className="card form-card p-5 text-center">
          <div className="mb-3">
            <i className="bi bi-calendar-x text-muted" style={{ fontSize: "3rem" }} />
          </div>
          <h5 className="fw-bold">Aucune consultation trouvée</h5>
          <p className="text-muted mb-3">
            {searchTerm || onlyUrgentFilter || statusFilter !== "ALL"
              ? "Aucune consultation ne correspond à vos critères de recherche ou filtres actifs."
              : "Aucune consultation enregistrée dans cette catégorie."}
          </p>
          {(searchTerm || onlyUrgentFilter || statusFilter !== "ALL") && (
            <div>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => {
                  setStatusFilter("ALL");
                  setSearchTerm("");
                  setOnlyUrgentFilter(false);
                }}
              >
                <i className="bi bi-arrow-counterclockwise me-1" /> Réinitialiser tous les filtres
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="doctor-table-shell shadow-sm border rounded-3 overflow-hidden bg-white">
          <table className="table table-hover align-middle doctor-table appointment-table mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: "240px" }}>Patient</th>
                <th style={{ width: "200px" }}>Date & Horaire</th>
                <th>Motif & Téléconsultation</th>
                <th style={{ width: "130px" }}>État</th>
                <th style={{ width: "240px" }} className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctorAppointments.map((appointment) => {
                const isConfirmed = appointment.status === "CONFIRMED";
                const isRequested = appointment.status === "REQUESTED";
                const isCompleted = appointment.status === "COMPLETED";
                const isArchived = appointment.status === "REFUSED" || appointment.status === "CANCELLED";
                const initials = getPatientInitials(appointment.patientName);
                const avatarBg = getAvatarGradient(appointment.patientName);
                const relativeBadge = getRelativeTimeBadge(appointment.startsAt);
                const isNoteExpanded = expandedNoteId === appointment.id;

                return (
                  <tr key={appointment.id} className={appointment.triggeredByAiAlert ? "table-danger-subtle" : ""}>
                    {/* Patient Column with Avatar */}
                    <td>
                      <div className="d-flex align-items-center gap-2.5">
                        <div className="nc-patient-avatar" style={{ background: avatarBg }}>
                          {initials}
                        </div>
                        <div>
                          <strong className="d-block text-dark" style={{ fontSize: "0.95rem" }}>
                            {appointment.patientName}
                          </strong>
                          <div className="d-flex align-items-center gap-1.5 mt-0.5">
                            <span className="badge bg-light text-secondary border px-1.5 py-0.5" style={{ fontSize: "0.72rem" }}>
                              <i className="bi bi-stopwatch me-1" />{appointment.durationMinutes || 20} min
                            </span>
                            {appointment.triggeredByAiAlert && (
                              <span className="badge bg-danger text-white px-1.5 py-0.5" style={{ fontSize: "0.7rem" }}>
                                SOS Envie
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Date & Horaire Column with Relative Time */}
                    <td>
                      <div className="fw-semibold text-dark" style={{ fontSize: "0.88rem" }}>
                        <i className="bi bi-calendar3 me-1.5 text-primary" />
                        {formatDateTime(appointment.startsAt)}
                      </div>
                      <div className="mt-1">
                        {relativeBadge}
                      </div>
                    </td>

                    {/* Motif & Téléconsultation Visio Column */}
                    <td>
                      {appointment.triggeredByAiAlert && (
                        <div className="nc-urgent-indicator mb-1.5">
                          <i className="bi bi-exclamation-octagon-fill" />
                          Consultation Urgente Déclenchée par l'IA 24/7
                        </div>
                      )}
                      <div className="appointment-cell-copy fw-medium" style={{ fontSize: "0.88rem" }}>
                        {appointment.reason || "Consultation clinique de suivi du sevrage tabagique."}
                      </div>

                      {/* Confirmed: Glowing Visio Launcher */}
                      {isConfirmed && (
                        <div className="mt-2.5 d-flex flex-wrap align-items-center gap-2">
                          <a
                            href={appointment.meetingJoinUrl || `https://meet.jit.si/NeuralConsult-Sevrage-${appointment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nc-visio-launcher-btn"
                          >
                            <i className="bi bi-camera-video-fill" />
                            Lancer la Téléconsultation Visio (Jitsi)
                          </a>
                          <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                            <i className="bi bi-shield-check text-success me-1" />
                            Salle médicale prête
                          </span>
                        </div>
                      )}

                      {/* Completed / Archived: Saved Clinical Notes */}
                      {(isCompleted || appointment.doctorNote) && (
                        <div className="nc-clinical-note-box mt-2">
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="fw-semibold" style={{ fontSize: "0.78rem" }}>
                              <i className="bi bi-journal-medical text-primary me-1" />
                              Synthèse clinique du Dr. Tantani :
                            </span>
                            <button
                              type="button"
                              className="btn btn-link p-0 text-muted"
                              style={{ fontSize: "0.75rem", textDecoration: "none" }}
                              onClick={() => setExpandedNoteId(isNoteExpanded ? null : appointment.id)}
                            >
                              <i className={`bi bi-${isNoteExpanded ? "chevron-up" : "pencil-square"}`} />
                            </button>
                          </div>
                          <div className="mt-1" style={{ fontStyle: "italic" }}>
                            « {appointment.doctorNote || "Consultation validée et archivée dans le dossier patient."} »
                          </div>
                        </div>
                      )}

                      {/* Inline Note Editor if opened */}
                      {isNoteExpanded && (
                        <div className="mt-2 p-2 rounded bg-light border">
                          <textarea
                            className="form-control form-control-sm mb-2"
                            rows="2"
                            placeholder="Mettre à jour la note clinique..."
                            defaultValue={appointment.doctorNote || ""}
                            id={`note-input-${appointment.id}`}
                          />
                          <div className="d-flex justify-content-end gap-1">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm py-0 px-2"
                              style={{ fontSize: "0.75rem" }}
                              onClick={() => setExpandedNoteId(null)}
                            >
                              Fermer
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm py-0 px-2"
                              style={{ fontSize: "0.75rem" }}
                              onClick={() => {
                                const val = document.getElementById(`note-input-${appointment.id}`)?.value;
                                if (val !== undefined) {
                                  setDoctorNotes((prev) => ({ ...prev, [appointment.id]: val }));
                                  setAppointments((prev) =>
                                    prev.map((a) => (a.id === appointment.id ? { ...a, doctorNote: val } : a))
                                  );
                                  api.post(`/api/appointments/${appointment.id}/doctor-update`, { doctorNote: val });
                                  setExpandedNoteId(null);
                                  setMessage({ type: "success", text: "Note clinique mise à jour." });
                                }
                              }}
                            >
                              Enregistrer
                            </button>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Status Column */}
                    <td>
                      <div className="appointment-status-stack appointment-status-stack-inline">
                        <span className={`doctor-status-chip status-${String(appointment.status || "REQUESTED").toLowerCase()}`}>
                          {statusCopy[appointment.status] || appointment.status}
                        </span>
                      </div>
                    </td>

                    {/* Actions Toolbar */}
                    <td>
                      <div className="nc-appointment-action-bar">
                        {/* REQUESTED Actions */}
                        {isRequested && (
                          <>
                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={() => doctorDecision(appointment.id, "confirm")}
                              title="Valider et confirmer la téléconsultation"
                            >
                              <i className="bi bi-check-lg" /> Accepter
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => doctorDecision(appointment.id, "refuse")}
                              title="Refuser ce créneau"
                            >
                              <i className="bi bi-x-lg" /> Refuser
                            </button>
                            <button
                              type="button"
                              className="btn btn-light border"
                              onClick={() => beginAppointmentEdit(appointment)}
                              title="Modifier date ou motif"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                          </>
                        )}

                        {/* CONFIRMED Actions */}
                        {isConfirmed && (
                          <>
                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={() => openMeeting(appointment)}
                              title="Rejoindre la salle visio"
                            >
                              <i className="bi bi-camera-video-fill" /> Visio
                            </button>
                            <button
                              type="button"
                              className="btn btn-warning text-dark fw-bold"
                              onClick={() => setReportingAppointmentId(appointment.id)}
                              title="Rédiger le bilan médical et l'ordonnance"
                            >
                              <i className="bi bi-file-earmark-medical" /> Bilan
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => doctorDecision(appointment.id, "complete")}
                              title="Marquer la séance comme terminée"
                            >
                              <i className="bi bi-check2-circle" /> Terminer
                            </button>
                            <button
                              type="button"
                              className="btn btn-light border"
                              onClick={() => beginAppointmentEdit(appointment)}
                              title="Modifier la consultation"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => cancelAppointmentAsDoctor(appointment.id)}
                              title="Annuler le rendez-vous"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </>
                        )}

                        {/* COMPLETED Actions */}
                        {isCompleted && (
                          <>
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => setReportingAppointmentId(appointment.id)}
                              title="Consulter ou modifier le compte-rendu médical"
                            >
                              <i className="bi bi-file-earmark-text" /> Compte-rendu
                            </button>
                            <button
                              type="button"
                              className="btn btn-light border"
                              onClick={() => beginAppointmentEdit(appointment)}
                              title="Modifier la note ou le motif"
                            >
                              <i className="bi bi-pencil" /> Note
                            </button>
                          </>
                        )}

                        {/* ARCHIVED (Cancelled / Refused) Actions */}
                        {isArchived && (
                          <>
                            <button
                              type="button"
                              className="btn btn-light border text-muted"
                              onClick={() => beginAppointmentEdit(appointment)}
                              title="Consulter les détails ou reprogrammer"
                            >
                              <i className="bi bi-arrow-repeat" /> Reprogrammer
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
                    {appointment.status === "CONFIRMED" && (
                      <div className="mt-2">
                        <a
                          href={`https://meet.jit.si/NeuralConsult-Sevrage-${appointment.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary-gradient btn-sm d-inline-flex align-items-center"
                        >
                          <i className="bi bi-camera-video-fill me-1.5" />
                          Rejoindre la Téléconsultation Visio (Jitsi)
                        </a>
                        <div className="doctor-table-subcopy mt-1">
                          Salle sécurisée avec votre médecin tabacologue.
                        </div>
                      </div>
                    )}
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
                      {appointment.status === "CONFIRMED" && editingAppointment?.id !== appointment.id && (
                        <button type="button" className="btn btn-success btn-sm" onClick={() => openMeeting(appointment)}>Rejoindre la visio</button>
                      )}
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
      {(loading || savingAvailability || savingUrgent || savingAppointmentUpdate) && <LungLoader text="Mise à jour de votre agenda clinique..." />}
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
          {/* 4 Doctor KPI Stats Cards */}
          <div className="row g-3 mt-1 mb-4">
            <div className="col-6 col-md-3">
              <div
                className={`nc-appointment-kpi-card ${statusFilter === "ALL" && activeDoctorTab === "consultations" ? "active" : ""}`}
                onClick={() => {
                  setActiveDoctorTab("consultations");
                  setStatusFilter("ALL");
                }}
                role="button"
                tabIndex={0}
              >
                <div className="nc-kpi-icon-wrap bg-primary-subtle text-primary">
                  <i className="bi bi-calendar-event-fill" />
                </div>
                <div className="nc-kpi-info">
                  <span className="nc-kpi-num">{appointments.length}</span>
                  <span className="nc-kpi-label">Total Rendez-vous</span>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div
                className={`nc-appointment-kpi-card ${statusFilter === "REQUESTED" && activeDoctorTab === "consultations" ? "active" : ""}`}
                onClick={() => {
                  setActiveDoctorTab("consultations");
                  setStatusFilter("REQUESTED");
                }}
                role="button"
                tabIndex={0}
              >
                <div className="nc-kpi-icon-wrap bg-warning-subtle text-warning">
                  <i className="bi bi-hourglass-split" />
                </div>
                <div className="nc-kpi-info">
                  <span className="nc-kpi-num text-warning">{doctorAppointmentGroups.requested.length}</span>
                  <span className="nc-kpi-label">En attente d'accord</span>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div
                className={`nc-appointment-kpi-card ${statusFilter === "CONFIRMED" && activeDoctorTab === "consultations" ? "active" : ""}`}
                onClick={() => {
                  setActiveDoctorTab("consultations");
                  setStatusFilter("CONFIRMED");
                }}
                role="button"
                tabIndex={0}
              >
                <div className="nc-kpi-icon-wrap bg-success-subtle text-success">
                  <i className="bi bi-camera-video-fill" />
                </div>
                <div className="nc-kpi-info">
                  <span className="nc-kpi-num text-success">{doctorAppointmentGroups.confirmed.length}</span>
                  <span className="nc-kpi-label">Confirmées à venir</span>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div
                className={`nc-appointment-kpi-card ${statusFilter === "COMPLETED" && activeDoctorTab === "consultations" ? "active" : ""}`}
                onClick={() => {
                  setActiveDoctorTab("consultations");
                  setStatusFilter("COMPLETED");
                }}
                role="button"
                tabIndex={0}
              >
                <div className="nc-kpi-icon-wrap bg-info-subtle text-info">
                  <i className="bi bi-check-circle-fill" />
                </div>
                <div className="nc-kpi-info">
                  <span className="nc-kpi-num text-info">{doctorAppointmentGroups.completed.length}</span>
                  <span className="nc-kpi-label">Clôturées & Bilan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Segmented Doctor Navigation Bar */}
          <div className="nc-doctor-nav-bar mb-4">
            <button
              type="button"
              className={`nc-doctor-nav-btn ${activeDoctorTab === "consultations" ? "active" : ""}`}
              onClick={() => setActiveDoctorTab("consultations")}
            >
              <i className="bi bi-calendar2-check-fill" />
              Suivi des Consultations
              <span className="badge bg-secondary-subtle text-secondary rounded-pill ms-1">
                {appointments.length}
              </span>
            </button>
            <button
              type="button"
              className={`nc-doctor-nav-btn ${activeDoctorTab === "availabilities" ? "active" : ""}`}
              onClick={() => setActiveDoctorTab("availabilities")}
            >
              <i className="bi bi-clock-history" />
              Plages de Disponibilités
              <span className="badge bg-secondary-subtle text-secondary rounded-pill ms-1">
                {availabilities.length}
              </span>
            </button>
            <button
              type="button"
              className={`nc-doctor-nav-btn ${activeDoctorTab === "urgent" ? "active" : ""}`}
              onClick={() => setActiveDoctorTab("urgent")}
            >
              <i className="bi bi-lightning-charge-fill text-danger" />
              Consultation Urgente (Hors planning)
            </button>
          </div>

          {/* Tab 1: Consultations View */}
          {activeDoctorTab === "consultations" && renderDoctorAppointmentsView()}

          {/* Tab 2: Doctor Availabilities */}
          {activeDoctorTab === "availabilities" && (
            <section className="card form-card mt-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <div className="section-title-sm">Disponibilites de teleconsultation</div>
                  <p className="muted-text mt-1 mb-0">
                    Configurez vos plages de teleconsultation. Chaque plage est decoupee automatiquement en seances de <strong>20 minutes</strong> avec un <strong>temps de pause (gap)</strong> configurable pour rediger vos notes, ordonnances ou souffler entre deux patients.
                  </p>
                </div>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill">
                  <i className="bi bi-clock-history me-1" /> Seances 20 min + Pause
                </span>
              </div>

              <form className="row g-3 mt-2" onSubmit={saveAvailability}>
                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold">Date</label>
                  <input
                    className="form-control"
                    type="date"
                    min={todayDateValue()}
                    value={availabilityForm.availableDate}
                    onChange={(event) => setAvailabilityForm((previous) => ({ ...previous, availableDate: event.target.value }))}
                    required
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label fw-semibold">Heure de debut</label>
                  <input
                    className="form-control"
                    type="time"
                    step={300}
                    value={availabilityForm.startTime}
                    onChange={(event) => setAvailabilityForm((previous) => ({ ...previous, startTime: event.target.value }))}
                    required
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label fw-semibold">Heure de fin</label>
                  <input
                    className="form-control"
                    type="time"
                    step={300}
                    value={availabilityForm.endTime}
                    onChange={(event) => setAvailabilityForm((previous) => ({ ...previous, endTime: event.target.value }))}
                    required
                  />
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold">
                    Pause inter-seances (Gap)
                  </label>
                  <select
                    className="form-select"
                    value={availabilityForm.bufferMinutes}
                    onChange={(event) => setAvailabilityForm((previous) => ({ ...previous, bufferMinutes: Number(event.target.value) }))}
                  >
                    <option value={5}>5 min (Pause minimale)</option>
                    <option value={10}>10 min (Recommande - Synthese dossier)</option>
                    <option value={15}>15 min (Pause confort & ordonnance)</option>
                    <option value={20}>20 min (Pause approfondie)</option>
                  </select>
                </div>
                <div className="col-12 col-md-2 d-flex align-items-end gap-2">
                  <button className="btn btn-success w-100" type="submit" disabled={savingAvailability}>
                    {savingAvailability ? "Enregistrement..." : availabilityForm.id ? "Modifier" : "Ajouter"}
                  </button>
                  {availabilityForm.id ? (
                    <button className="btn btn-outline-secondary w-100" type="button" onClick={resetAvailabilityForm}>Annuler</button>
                  ) : null}
                </div>

                {/* Dynamic Preview of Generated Slots with Gap */}
                {(() => {
                  const preview = calculateSlotPreview(
                    availabilityForm.startTime,
                    availabilityForm.endTime,
                    availabilityForm.slotDurationMinutes || 20,
                    availabilityForm.bufferMinutes !== undefined ? availabilityForm.bufferMinutes : 10
                  );
                  return (
                    <div className="col-12">
                      <div className="p-3 rounded-3 bg-light border border-light-subtle d-flex flex-column gap-2">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                          <span className="fw-semibold text-primary" style={{ fontSize: "0.88rem" }}>
                            <i className="bi bi-magic me-1" />
                            Decoupage automatique : <strong>{preview.count} seance{preview.count > 1 ? "s" : ""}</strong> de 20 min avec <strong>{availabilityForm.bufferMinutes} min</strong> de pause inter-seances
                          </span>
                          <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: "0.75rem" }}>
                            Duree : 20 min | Pause : {availabilityForm.bufferMinutes} min
                          </span>
                        </div>
                        {preview.slots.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2 mt-1">
                            {preview.slots.map((s, idx) => (
                              <span key={idx} className="badge bg-white text-dark border px-2 py-1" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                                <i className="bi bi-camera-video me-1 text-primary" />
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "0.82rem" }}>
                            Ajustez l'heure de debut et de fin pour generer au moins une seance de 20 minutes.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </form>

              <div className="doctor-table-shell mt-4">
                {availabilities.length === 0 ? (
                  <div className="doctor-dossier-empty-state">
                    <p className="mb-0">Aucune disponibilite definie pour le moment. Ajoutez au moins une plage pour debloquer la reservation cote patient.</p>
                  </div>
                ) : (
                  <table className="table table-borderless align-middle doctor-table appointment-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Jour</th>
                        <th>Plage Horaire</th>
                        <th>Seance</th>
                        <th>Pause (Gap)</th>
                        <th>Etat</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availabilities.map((availability) => (
                        <tr key={availability.id}>
                          <td><strong>{formatAvailabilityDate(availability.availableDate)}</strong></td>
                          <td>{getAvailabilityDayLabel(availability)}</td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {renderTimeRange(availability.startTime, availability.endTime)}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-primary-subtle text-primary">
                              {availability.slotDurationMinutes || 20} min
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-info-subtle text-info">
                              {availability.bufferMinutes !== undefined ? availability.bufferMinutes : 10} min pause
                            </span>
                          </td>
                          <td>
                            <span className={`doctor-status-chip ${availability.active !== false ? "status-confirmed" : "status-cancelled"}`}>
                              {availability.active !== false ? "Active" : "Inactive"}
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
          )}

          {/* Tab 3: Urgent appointment form */}
          {activeDoctorTab === "urgent" && (
            <section className="card form-card mt-3">
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
                    rows={3}
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
          )}
        </>
      ) : (
        <>
          {/* Patient View: Booking Form */}
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
                      rows={3}
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

          {/* Patient Appointments Table */}
          {renderPatientAppointmentTable()}
        </>
      )}

      {/* Medical Report Modal */}
      <Modal
        show={!!reportingAppointmentId}
        onHide={() => setReportingAppointmentId(null)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <i className="bi bi-file-earmark-medical text-primary me-2" />
            Bilan Médical & Ordonnance
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {reportingAppointmentId && (
            <ConsultationReportForm
              appointmentId={reportingAppointmentId}
              onSave={() => {
                setReportingAppointmentId(null);
                setMessage({ type: "success", text: "Compte-rendu médical enregistré avec succès." });
                load();
              }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Appointment Edit Modal */}
      <Modal
        show={!!editingAppointment}
        onHide={cancelAppointmentEdit}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">
            <i className="bi bi-pencil-square text-primary me-2" />
            Modifier le Rendez-vous
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingAppointment && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveAppointmentUpdate(doctorMode ? "doctor" : "patient");
              }}
              className="d-grid gap-3"
            >
              <div>
                <label className="form-label fw-semibold">Date et heure</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  step={300}
                  value={editingAppointment.startsAt || ""}
                  onChange={(e) =>
                    setEditingAppointment((prev) => ({ ...prev, startsAt: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="form-label fw-semibold">Motif de consultation</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={editingAppointment.reason || ""}
                  onChange={(e) =>
                    setEditingAppointment((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Motif clinique ou précision..."
                />
              </div>
              {doctorMode && (
                <div>
                  <label className="form-label fw-semibold">Note clinique du médecin</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={editingAppointment.doctorNote || ""}
                    onChange={(e) =>
                      setEditingAppointment((prev) => ({ ...prev, doctorNote: e.target.value }))
                    }
                    placeholder="Instructions, observations ou consignes..."
                  />
                </div>
              )}
              <div className="d-flex justify-content-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={cancelAppointmentEdit}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingAppointmentUpdate}
                >
                  {savingAppointmentUpdate ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Appointments;
