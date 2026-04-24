import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const matchingCopy = {
  SAME_CITY: "Meme ville",
  SAME_COUNTRY: "Maroc",
  TELECONSULTATION: "Teleconsultation"
};

const moroccoRegions = {
  "Casablanca-Settat": ["Casablanca", "Mohammedia", "El Jadida", "Settat", "Berrechid", "Benslimane", "Sidi Bennour"],
  "Rabat-Sale-Kenitra": ["Rabat", "Sale", "Kenitra", "Temara", "Skhirat", "Sidi Kacem", "Sidi Slimane"],
  "Marrakech-Safi": ["Marrakech", "Safi", "Essaouira", "El Kelâa des Sraghna", "Youssoufia", "Chichaoua"],
  "Fes-Meknes": ["Fes", "Meknes", "Taza", "Ifrane", "Sefrou", "Azrou"],
  Oriental: ["Oujda", "Nador", "Berkane", "Taourirt", "Jerada", "Driouch"],
  "Tanger-Tetouan-Al Hoceima": ["Tanger", "Tetouan", "Al Hoceima", "Larache", "Ksar El Kebir", "Chefchaouen"],
  "Souss-Massa": ["Agadir", "Inezgane", "Taroudant", "Tiznit", "Chtouka Ait Baha"],
  "Beni Mellal-Khenifra": ["Beni Mellal", "Khenifra", "Khouribga", "Azilal", "Fquih Ben Salah"],
  "Draa-Tafilalet": ["Errachidia", "Ouarzazate", "Midelt", "Tinghir", "Zagora"],
  "Laayoune-Sakia El Hamra": ["Laayoune", "Boujdour", "Tarfaya", "Es-Semara"],
  "Guelmim-Oued Noun": ["Guelmim", "Sidi Ifni", "Tan-Tan", "Assa"],
  "Dakhla-Oued Ed-Dahab": ["Dakhla", "Aousserd"]
};

const cityToRegion = Object.entries(moroccoRegions).reduce((acc, [region, cities]) => {
  cities.forEach((city) => {
    acc[city.toLowerCase()] = region;
  });
  return acc;
}, {});

const getRegionFromCity = (city) => {
  if (!city) return "Region non renseignee";
  return cityToRegion[city.toLowerCase()] || "Region non renseignee";
};

const DoctorDirectory = () => {
  const [doctors, setDoctors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignedDoctor, setAssignedDoctor] = useState(null);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    const [doctorsResp, requestsResp, associationResp] = await Promise.allSettled([
      api.get("/api/doctors"),
      api.get("/api/doctors/requests/patient"),
      api.get("/api/doctors/association/patient")
    ]);

    if (doctorsResp.status === "fulfilled") {
      setDoctors(doctorsResp.value.data || []);
    } else {
      setDoctors([]);
      setError("Impossible de charger l'annuaire medecin.");
    }

    if (requestsResp.status === "fulfilled") {
      setRequests(requestsResp.value.data || []);
    } else {
      setRequests([]);
    }

    if (associationResp.status === "fulfilled") {
      setAssignedDoctor(associationResp.value.data || null);
    } else {
      setAssignedDoctor(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const latestRequestByDoctor = useMemo(() => {
    const map = new Map();
    requests.forEach((request) => {
      if (!map.has(request.doctorProfileId)) {
        map.set(request.doctorProfileId, request);
      }
    });
    return map;
  }, [requests]);

  const regionOptions = useMemo(() => Object.keys(moroccoRegions), []);

  const cityOptions = useMemo(() => {
    if (selectedRegion === "all") {
      return [...new Set(doctors.map((doctor) => doctor.city).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    }
    return moroccoRegions[selectedRegion] || [];
  }, [doctors, selectedRegion]);

  const visibleDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const doctorRegion = getRegionFromCity(doctor.city);
      const matchesRegion = selectedRegion === "all" || doctorRegion === selectedRegion;
      const matchesCity = selectedCity === "all" || doctor.city === selectedCity;
      return matchesRegion && matchesCity;
    });
  }, [doctors, selectedRegion, selectedCity]);

  const sendRequest = async (doctorProfileId) => {
    setFeedback(null);
    try {
      await api.post("/api/doctors/requests", {
        doctorProfileId,
        patientMessage: messages[doctorProfileId] || null
      });
      setFeedback({ type: "success", text: "Votre demande a ete envoyee au medecin." });
      await load();
    } catch (err) {
      const apiError = err?.response?.data?.message || err?.response?.data?.error;
      setFeedback({
        type: "error",
        text: apiError || "Impossible d'envoyer la demande au medecin."
      });
    }
  };

  return (
    <div className="container py-4 app-shell">
      <div className="profile-page-header" data-guide-id="doctor-directory-header">
        <div>
          <div className="hero-kicker">Alliance medecin-patient</div>
          <h2 className="fw-bold mb-1">{assignedDoctor ? "Medecin deja associe" : "Trouver un medecin tabacologue rapidement"}</h2>
          <p className="muted-text mb-0">
            {assignedDoctor
              ? "Ton dossier est deja rattache a un medecin. L'annuaire se masque pour garder une navigation simple et eviter les demandes en doublon."
              : "Tous les medecins affiches ici sont consideres comme disponibles au Maroc. Tu peux filtrer par region ou ville pour retrouver plus vite un medecin proche."}
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`alert mt-3 ${feedback.type === "error" ? "alert-danger" : "alert-success"}`}>
          {feedback.text}
        </div>
      )}

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {assignedDoctor ? (
        <section className="card form-card mt-4" data-guide-id="doctor-directory-list">
          <div className="section-title-sm">Mon medecin referent</div>
          <div className="doctor-card mt-3">
            <div className="doctor-card-head">
              <div>
                <div className="section-title-sm">{assignedDoctor.doctorName}</div>
                <p className="muted-text mb-0">{assignedDoctor.specialty || "Tabacologie / suivi clinique"}</p>
              </div>
              <span className="doctor-status-chip status-accepted">Associe depuis {assignedDoctor.assignedAt ? new Date(assignedDoctor.assignedAt).toLocaleDateString("fr-FR") : "aujourd'hui"}</span>
            </div>
            <div className="doctor-card-grid">
              <div>
                <span className="profile-data-label">Ville</span>
                <strong>{assignedDoctor.city || "Non renseignee"}</strong>
              </div>
              <div>
                <span className="profile-data-label">Pays</span>
                <strong>{assignedDoctor.countryCode || "MA"}</strong>
              </div>
              <div>
                <span className="profile-data-label">Teleconsultation</span>
                <strong>{assignedDoctor.acceptsTeleconsultation ? "Oui" : "Non"}</strong>
              </div>
              <div>
                <span className="profile-data-label">Experience</span>
                <strong>{assignedDoctor.yearsExperience ?? "Non renseignee"} ans</strong>
              </div>
            </div>
            <p className="muted-text mb-0">Les nouvelles demandes medecin sont bloquees tant que cette association reste active. Les rendez-vous se prennent uniquement avec ce praticien.</p>
          </div>
        </section>
      ) : (
        <section className="card form-card mt-4" data-guide-id="doctor-directory-list">
          <div className="section-title-sm">Filtres de recherche</div>
          <div className="doctor-filter-grid mt-3">
            <div>
              <label className="form-label">Region</label>
              <select
                className="form-select"
                value={selectedRegion}
                onChange={(event) => {
                  setSelectedRegion(event.target.value);
                  setSelectedCity("all");
                }}
              >
                <option value="all">Toutes les regions</option>
                {regionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Ville</label>
              <select className="form-select" value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)}>
                <option value="all">Toutes les villes</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      <section className="card form-card mt-4">
        <div className="section-title-sm">Demandes deja envoyees</div>
        {requests.length === 0 ? (
          <p className="muted-text mb-0">Aucune demande pour le moment.</p>
        ) : (
          <div className="doctor-request-stack">
            {requests.map((request) => (
              <div key={request.id} className="doctor-request-card">
                <div>
                  <strong>{request.doctorName}</strong>
                  <p className="mb-0">
                    Statut: <span className={`doctor-status-chip status-${request.status?.toLowerCase()}`}>{request.status}</span>
                    {" · "}
                    Matching: {matchingCopy[request.matchingMode] || request.matchingMode}
                  </p>
                </div>
                <div className="muted-text">{request.doctorResponseNote || "En attente de reponse."}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {!assignedDoctor && (
        <section className="doctor-grid mt-4">
          {loading ? (
            <div className="muted-text">Chargement de l'annuaire medecin...</div>
          ) : visibleDoctors.length === 0 ? (
            <div className="muted-text">Aucun medecin ne correspond a ce filtre actuellement.</div>
          ) : (
            visibleDoctors.map((doctor) => {
              const existingRequest = latestRequestByDoctor.get(doctor.id);
              const region = getRegionFromCity(doctor.city);

              return (
                <article key={doctor.id} className="card form-card doctor-card">
                  <div className="doctor-card-head">
                    <div>
                      <div className="section-title-sm">{doctor.fullName}</div>
                      <p className="muted-text mb-0">{doctor.specialty || "Tabacologie / suivi clinique"}</p>
                    </div>
                    <span className="doctor-match-chip">
                      {matchingCopy[doctor.matchingMode] || "Disponible"}
                      {doctor.matchingScore ? ` · ${doctor.matchingScore}` : ""}
                    </span>
                  </div>

                  <div className="doctor-card-grid">
                    <div>
                      <span className="profile-data-label">Region</span>
                      <strong>{region}</strong>
                    </div>
                    <div>
                      <span className="profile-data-label">Ville</span>
                      <strong>{doctor.city || "Non renseignee"}</strong>
                    </div>
                    <div>
                      <span className="profile-data-label">Teleconsultation</span>
                      <strong>{doctor.acceptsTeleconsultation ? "Oui" : "Non"}</strong>
                    </div>
                    <div>
                      <span className="profile-data-label">Score de suivi</span>
                      <strong>{doctor.successScore ?? "A definir"}</strong>
                    </div>
                  </div>

                  <p className="muted-text">{doctor.bio || "Profil medecin en cours de completion."}</p>

                  <label className="form-label">Message optionnel au medecin</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={messages[doctor.id] || ""}
                    onChange={(event) =>
                      setMessages((previous) => ({ ...previous, [doctor.id]: event.target.value }))
                    }
                    placeholder="Explique ton contexte ou ce que tu attends du medecin."
                  />

                  <div className="doctor-card-actions">
                    <button
                      type="button"
                      className="btn btn-dark"
                      onClick={() => sendRequest(doctor.id)}
                      disabled={existingRequest?.status === "PENDING" || existingRequest?.status === "ACCEPTED"}
                    >
                      {existingRequest?.status === "PENDING"
                        ? "Demande envoyee"
                        : existingRequest?.status === "ACCEPTED"
                          ? "Medecin associe"
                          : "Envoyer la demande"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}
    </div>
  );
};

export default DoctorDirectory;
