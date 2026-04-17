/** Shared with Admin → Users → Students and public sign-up. */
export const PROFILE_STATUSES = ["ACTIVE", "INACTIVE"];
export const STREAMS = ["WEEKDAY", "WEEKEND"];
export const ENROLL_STATUSES = ["ACTIVE", "INACTIVE"];

export function emptyStudentForm() {
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
