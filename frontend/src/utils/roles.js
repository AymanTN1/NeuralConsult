const normalizeRole = (role) => {
  if (typeof role === "string") return role.trim().toUpperCase();
  if (role && typeof role === "object" && role.authority) return role.authority.trim().toUpperCase();
  return String(role || "").trim().toUpperCase();
};

export const hasRole = (user, role) => {
  const roles = user?.roles;
  if (!Array.isArray(roles)) return false;
  
  const expected = normalizeRole(role);
  return roles.some((item) => normalizeRole(item) === expected);
};

export const isDoctor = (user) => hasRole(user, "ROLE_DOCTOR") || hasRole(user, "DOCTOR");
export const isAdmin = (user) => hasRole(user, "ROLE_ADMIN") || hasRole(user, "ADMIN");

export const isPatient = (user) => {
  if (!user) return false;
  
  // If user is explicitly admin or doctor, they are NOT a patient
  if (isAdmin(user) || isDoctor(user)) {
    return false;
  }

  const roles = user?.roles;
  
  // If no roles at all, we should probably wait or treat as unknown, 
  // but for safety in this app, we'll check for explicit patient roles.
  // If the user has NO roles and is NOT a doctor/admin, they might be a new patient.
  if (!Array.isArray(roles) || roles.length === 0) {
    // If we have a user but no roles, it's safer to return false until roles are loaded
    // unless we want to allow access to default patient routes.
    // However, the issue is doctors being seen as patients.
    return false; 
  }

  // Explicit check for patient roles
  return hasRole(user, "ROLE_PATIENT") || 
         hasRole(user, "PATIENT");
};
