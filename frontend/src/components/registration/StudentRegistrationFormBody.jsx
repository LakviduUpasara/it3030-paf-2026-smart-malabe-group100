import {
  ENROLL_STATUSES,
  PROFILE_STATUSES,
  STREAMS,
} from "./studentConstants";

const fieldInput =
  "h-11 w-full min-w-0 rounded-2xl border border-border bg-card px-3 text-sm";

/**
 * Exact same fields as Admin → Users → Students → New student / Edit.
 * @param {{ form: object, setForm: function, faculties: array, degrees: array, intakes: array, subgroupOptions: array, loadingSubgroups: boolean, signupPrimaryEmail?: string }} props
 */
function StudentRegistrationFormBody({
  form,
  setForm,
  faculties,
  degrees,
  intakes,
  subgroupOptions,
  loadingSubgroups,
  signupPrimaryEmail,
}) {
  const isSignup = Boolean(signupPrimaryEmail);
  return (
    <div className={`flex flex-col gap-4 ${isSignup ? "" : "mt-4"}`}>
      {signupPrimaryEmail ? (
        <div className="rounded-2xl border border-border bg-tint/30 p-4 shadow-inner">
          <p className="text-xs font-semibold text-text/70">Primary email (account)</p>
          <input
            className={`${fieldInput} mt-2 truncate opacity-90`}
            readOnly
            type="email"
            value={signupPrimaryEmail}
            title={signupPrimaryEmail}
          />
          <p className="mt-3 border-t border-border/60 pt-3 text-xs leading-relaxed text-text/60">
            From step 1 — matches the email you used to create your account or sign in with Google / Apple.
          </p>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">First name *</span>
          <input
            className={fieldInput}
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">Last name *</span>
          <input
            className={fieldInput}
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text/70">NIC number *</span>
        <input
          className={fieldInput}
          value={form.nicNumber}
          onChange={(e) => setForm((f) => ({ ...f, nicNumber: e.target.value }))}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">Phone</span>
          <input
            className={fieldInput}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">Optional email</span>
          <input
            className={fieldInput}
            type="email"
            value={form.optionalEmail}
            onChange={(e) => setForm((f) => ({ ...f, optionalEmail: e.target.value }))}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text/70">Profile status</span>
        <select
          className={fieldInput}
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          {PROFILE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <hr className="my-1 border-border" />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text/70">Faculty *</span>
        <select
          className={fieldInput}
          value={form.facultyId}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              facultyId: e.target.value,
              degreeProgramId: "",
              intakeId: "",
              subgroup: "",
            }))
          }
        >
          <option value="">Select faculty</option>
          {faculties.map((x) => (
            <option key={x.code} value={x.code}>
              {x.code} — {x.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text/70">Degree program *</span>
        <select
          className={fieldInput}
          value={form.degreeProgramId}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              degreeProgramId: e.target.value,
              intakeId: "",
              subgroup: "",
            }))
          }
          disabled={!form.facultyId}
        >
          <option value="">Select degree</option>
          {degrees.map((d) => (
            <option key={d.code} value={d.code}>
              {d.code} — {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text/70">Intake *</span>
        <select
          className={fieldInput}
          value={form.intakeId}
          onChange={(e) => setForm((f) => ({ ...f, intakeId: e.target.value, subgroup: "" }))}
          disabled={!form.degreeProgramId}
        >
          <option value="">Select intake</option>
          {intakes.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name || i.label || i.id}
              {i.studentIdPrefix ? ` (${i.studentIdPrefix})` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text/70">Stream *</span>
        <select
          className={fieldInput}
          value={form.stream}
          onChange={(e) => setForm((f) => ({ ...f, stream: e.target.value, subgroup: "" }))}
        >
          {STREAMS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text/70">Subgroup (optional)</span>
        <span className="mt-0.5 text-[0.7rem] leading-snug text-text/50">
          Pick an existing cohort label for this intake, or leave as none.
        </span>
        <select
          className={fieldInput}
          value={form.subgroup}
          onChange={(e) => setForm((f) => ({ ...f, subgroup: e.target.value }))}
          disabled={!form.intakeId || loadingSubgroups}
        >
          <option value="">— None —</option>
          {subgroupOptions.map((sg) => (
            <option key={sg.code} value={sg.code}>
              {sg.code} ({sg.count})
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text/70">Enrollment status</span>
        <select
          className={fieldInput}
          value={form.enrollmentStatus}
          onChange={(e) => setForm((f) => ({ ...f, enrollmentStatus: e.target.value }))}
        >
          {ENROLL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default StudentRegistrationFormBody;
