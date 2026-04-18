import api, { createServiceError } from "./api";

function toParams(query) {
  const p = new URLSearchParams();
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      p.set(k, String(v));
    }
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** --- Lecturers --- */
export async function createLecturer(payload) {
  try {
    const { data } = await api.post("/lecturers", payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to create lecturer.");
  }
}

export async function updateLecturer(id, payload) {
  try {
    const { data } = await api.put(`/lecturers/${encodeURIComponent(id)}`, payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to update lecturer.");
  }
}

export async function deleteLecturer(id) {
  try {
    await api.delete(`/lecturers/${encodeURIComponent(id)}`);
  } catch (e) {
    throw createServiceError(e, "Unable to delete lecturer.");
  }
}

export async function listLecturers(query) {
  try {
    const { data } = await api.get(`/lecturers${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load lecturers.");
  }
}

/** --- Lab assistants --- */
export async function createLabAssistant(payload) {
  try {
    const { data } = await api.post("/lab-assistants", payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to create lab assistant.");
  }
}

export async function updateLabAssistant(id, payload) {
  try {
    const { data } = await api.put(`/lab-assistants/${encodeURIComponent(id)}`, payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to update lab assistant.");
  }
}

export async function deleteLabAssistant(id) {
  try {
    await api.delete(`/lab-assistants/${encodeURIComponent(id)}`);
  } catch (e) {
    throw createServiceError(e, "Unable to delete lab assistant.");
  }
}

export async function listLabAssistants(query) {
  try {
    const { data } = await api.get(`/lab-assistants${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load lab assistants.");
  }
}

/** --- Console admins (User rows) --- */
export async function createAdmin(payload) {
  try {
    const { data } = await api.post("/admins", payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to create admin.");
  }
}

export async function listAdmins(query) {
  try {
    const { data } = await api.get(`/admins${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load admins.");
  }
}

export async function getAdmin(id) {
  try {
    const { data } = await api.get(`/admins/${encodeURIComponent(id)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load account.");
  }
}

export async function updateAdmin(id, payload) {
  try {
    const { data } = await api.put(`/admins/${encodeURIComponent(id)}`, payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to update account.");
  }
}

export async function deleteAdmin(id) {
  try {
    await api.delete(`/admins/${encodeURIComponent(id)}`);
  } catch (e) {
    throw createServiceError(e, "Unable to delete account.");
  }
}

/** --- Students --- */
export async function createStudent(payload) {
  try {
    const { data } = await api.post("/students", payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to create student.");
  }
}

export async function updateStudent(id, payload) {
  try {
    const { data } = await api.put(`/students/${encodeURIComponent(id)}`, payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to update student.");
  }
}

export async function deleteStudent(id) {
  try {
    await api.delete(`/students/${encodeURIComponent(id)}`);
  } catch (e) {
    throw createServiceError(e, "Unable to delete student.");
  }
}

export async function listStudents(query) {
  try {
    const { data } = await api.get(`/students${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load students.");
  }
}

/** --- Intakes (for cascading selects — compact list) --- */
export async function listIntakes(query) {
  try {
    const { data } = await api.get(`/intakes/dropdown${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load intakes.");
  }
}

/** --- Subgroup picker --- */
export async function listIntakeSubgroups(intakeId, query) {
  try {
    const { data } = await api.get(`/intakes/${encodeURIComponent(intakeId)}/subgroups${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load subgroups.");
  }
}
