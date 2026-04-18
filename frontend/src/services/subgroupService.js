import api, { createServiceError } from "./api";

/**
 * @param {object} payload — intakeId, mode (GROUP_COUNT | STUDENTS_PER_SUBGROUP), subgroupCount?, studentsPerSubgroup?, termCode?, apply?
 */
export async function subgroupAutoAssign(payload) {
  try {
    const { data } = await api.post("/subgroups/auto-assign", payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Subgroup allocation failed.");
  }
}
