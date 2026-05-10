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
  // If user is admin or doctor, they are NOT a patient
  if (isAdmin(user) || isDoctor(user)) {
    return false;
  }

  const roles = user?.roles;
  // If no roles, default to patient (to avoid blocking new users, but protected by logic above)
  if (!Array.isArray(roles) || roles.length === 0) {
    return true;
  }

  // Explicit check for patient roles
  return hasRole(user, "ROLE_PATIENT") || 
         hasRole(user, "PATIENT") || 
         hasRole(user, "ROLE_USER") || 
         hasRole(user, "USER");
};
