export const hasRole = (user, role) => Array.isArray(user?.roles) && user.roles.includes(role);

export const isDoctor = (user) => hasRole(user, "ROLE_DOCTOR");

export const isAdmin = (user) => hasRole(user, "ROLE_ADMIN");

export const isPatient = (user) => {
  if (!Array.isArray(user?.roles) || user.roles.length === 0) {
    return true;
  }
  return user.roles.includes("ROLE_PATIENT");
};
