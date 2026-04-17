/** Mirrors admin console registration shapes (Students, Staff, Admins). */

export const PROFILE_STATUSES = ["ACTIVE", "INACTIVE"];
export const STREAMS = ["WEEKDAY", "WEEKEND"];
export const ENROLL_STATUSES = ["ACTIVE", "INACTIVE"];
export const STAFF_STATUSES = ["ACTIVE", "INACTIVE"];

export function suggestUsernameFromEmail(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return "";
  }
  const local = email
    .slice(0, email.indexOf("@"))
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  return local || "user";
}

export function splitName(fullName) {
  const t = (fullName || "").trim();
  if (!t) {
    return { firstName: "", lastName: "" };
  }
  const sp = t.indexOf(" ");
  if (sp === -1) {
    return { firstName: t, lastName: "" };
  }
  return { firstName: t.slice(0, sp), lastName: t.slice(sp + 1).trim() };
}

export function emptyStudentDraft() {
  return {
    firstName: "",
    lastName: "",
    nicNumber: "",
    phone: "",
    optionalEmail: "",
    status: "ACTIVE",
    facultyId: "",
    degreeProgramId: "",
    intakeId: "",
    stream: "WEEKDAY",
    subgroup: "",
    enrollmentStatus: "ACTIVE",
  };
}

export function emptyStaffDraft() {
  return {
    fullName: "",
    optionalEmail: "",
    phone: "",
    nicStaffId: "",
    status: "ACTIVE",
    facultyIds: [],
    degreeProgramIds: [],
    moduleIds: [],
  };
}

export function emptyConsoleDraft(role) {
  return {
    fullName: "",
    username: "",
    phone: "",
    role: role || "USER",
    status: "ACTIVE",
  };
}

export function buildInitialDraft(requestedRole, accountFullName, accountEmail) {
  const r = requestedRole || "USER";
  if (r === "STUDENT") {
    const { firstName, lastName } = splitName(accountFullName);
    return { kind: "STUDENT", ...emptyStudentDraft(), firstName, lastName };
  }
  if (r === "LECTURER" || r === "LAB_ASSISTANT") {
    return {
      kind: "STAFF",
      variant: r === "LAB_ASSISTANT" ? "LAB_ASSISTANT" : "LECTURER",
      ...emptyStaffDraft(),
      fullName: (accountFullName || "").trim(),
    };
  }
  return {
    kind: "CONSOLE",
    ...emptyConsoleDraft(r),
    fullName: (accountFullName || "").trim(),
    username: suggestUsernameFromEmail(accountEmail),
    role: r,
  };
}

export function validateRegistrationDraft(requestedRole, draft) {
  if (!draft || typeof draft !== "object") {
    return "Complete the registration form.";
  }
  if (requestedRole === "STUDENT" && draft.kind === "STUDENT") {
    if (!draft.firstName?.trim() || !draft.lastName?.trim()) {
      return "Enter first and last name.";
    }
    if (!draft.nicNumber?.trim()) {
      return "NIC number is required.";
    }
    if (!draft.phone?.trim()) {
      return "Phone number is required.";
    }
    if (!draft.facultyId?.trim() || !draft.degreeProgramId?.trim() || !draft.intakeId?.trim()) {
      return "Select faculty, degree program, and intake.";
    }
    return "";
  }
  if ((requestedRole === "LECTURER" || requestedRole === "LAB_ASSISTANT") && draft.kind === "STAFF") {
    if (!draft.fullName?.trim()) {
      return "Full name is required.";
    }
    if (!draft.phone?.trim()) {
      return "Phone is required.";
    }
    if (!draft.facultyIds?.length) {
      return "Select at least one faculty.";
    }
    if (!draft.degreeProgramIds?.length) {
      return "Select at least one degree program.";
    }
    return "";
  }
  if (
    ["USER", "MANAGER", "TECHNICIAN", "ADMIN"].includes(requestedRole) &&
    draft.kind === "CONSOLE"
  ) {
    if (!draft.fullName?.trim()) {
      return "Full name is required.";
    }
    if (!draft.username?.trim()) {
      return "Username is required.";
    }
    if (!draft.phone?.trim()) {
      return "Phone is required.";
    }
    return "";
  }
  return "Complete the registration form for the selected role.";
}

/**
 * Maps draft + account email into API primitives (matches admin directory expectations).
 */
export function deriveRegisterPayloadPrimitives(requestedRole, draft, accountEmail) {
  const profileJson = JSON.stringify({
    requestedRole,
    kind: draft.kind,
    draft,
    primaryEmail: (accountEmail || "").trim().toLowerCase(),
  });

  if (requestedRole === "STUDENT" && draft.kind === "STUDENT") {
    return {
      campusId: draft.nicNumber.trim(),
      phoneNumber: draft.phone.trim(),
      supplementaryProfile: "",
      department: draft.facultyId ? `Faculty ${draft.facultyId}` : "",
      applicationProfileJson: profileJson,
    };
  }
  if (
    (requestedRole === "LECTURER" || requestedRole === "LAB_ASSISTANT") &&
    draft.kind === "STAFF"
  ) {
    return {
      campusId: draft.nicStaffId?.trim() || draft.fullName.trim().slice(0, 32),
      phoneNumber: draft.phone.trim(),
      supplementaryProfile: "",
      department: draft.facultyIds?.length ? `Faculties: ${draft.facultyIds.join(", ")}` : "",
      applicationProfileJson: profileJson,
    };
  }
  if (draft.kind === "CONSOLE") {
    return {
      campusId: draft.username.trim(),
      phoneNumber: draft.phone.trim(),
      supplementaryProfile: "",
      department: `Requested role: ${draft.role}`,
      applicationProfileJson: profileJson,
    };
  }
  return {
    campusId: "PENDING",
    phoneNumber: "—",
    supplementaryProfile: "",
    department: "",
    applicationProfileJson: profileJson,
  };
}
