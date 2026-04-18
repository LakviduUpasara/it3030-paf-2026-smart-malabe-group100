import { useCallback, useEffect, useMemo, useState } from "react";
import * as facultyService from "../../services/facultyService";
import * as degreeService from "../../services/lmsDegreeProgramService";
import * as catalogModuleService from "../../services/catalogModuleService";
import { STAFF_STATUSES } from "../../signup/registrationUtils";
import SignupStudentRegistrationBlock from "./SignupStudentRegistrationBlock";

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-tint px-2.5 py-1 text-xs font-semibold text-heading">
      {children}
    </span>
  );
}

function inpCls() {
  return "h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm text-text";
}

/**
 * Routes to the same registration UIs as the admin console (shared student body; staff/console inline for now).
 */
function SignupRegistrationFields({ requestedRole, draft, onDraftChange, primaryEmail }) {
  const [faculties, setFaculties] = useState([]);
  const [staffDegrees, setStaffDegrees] = useState([]);
  const [staffModules, setStaffModules] = useState([]);

  useEffect(() => {
    facultyService.listFaculties().then(setFaculties).catch(() => setFaculties([]));
  }, []);

  const loadStaffDegrees = useCallback(async (facultyIds) => {
    const codes = facultyIds || [];
    if (!codes.length) {
      setStaffDegrees([]);
      return;
    }
    try {
      const results = await Promise.all(
        codes.map((fc) => degreeService.listDegreePrograms({ faculty: fc, page: 1, pageSize: 200 })),
      );
      const map = new Map();
      results.forEach((res) => {
        (res.items || []).forEach((d) => map.set(d.code, d));
      });
      setStaffDegrees(Array.from(map.values()));
    } catch {
      setStaffDegrees([]);
    }
  }, []);

  const loadStaffModules = useCallback(async (facultyIds, degreeProgramIds) => {
    const codes = facultyIds || [];
    if (!codes.length) {
      setStaffModules([]);
      return;
    }
    try {
      const results = await Promise.all(
        codes.map((fc) =>
          catalogModuleService.listCatalogModules({ facultyCode: fc, page: 1, pageSize: 500 })
        ),
      );
      const map = new Map();
      results.forEach((res) => {
        (res.items || []).forEach((m) => map.set(m.code, m));
      });
      let merged = Array.from(map.values());
      const degSel = degreeProgramIds || [];
      if (degSel.length) {
        merged = merged.filter((m) =>
          (m.applicableDegrees || []).some((c) => degSel.includes(c))
        );
      }
      setStaffModules(merged);
    } catch {
      setStaffModules([]);
    }
  }, []);

  useEffect(() => {
    if (draft?.kind === "STAFF") {
      loadStaffDegrees(draft.facultyIds);
    }
  }, [draft?.kind, draft?.facultyIds, loadStaffDegrees]);

  useEffect(() => {
    if (draft?.kind === "STAFF") {
      loadStaffModules(draft.facultyIds, draft.degreeProgramIds);
    }
  }, [draft?.kind, draft?.facultyIds, draft?.degreeProgramIds, loadStaffModules]);

  const staffCounts = useMemo(() => {
    if (draft?.kind !== "STAFF") {
      return { faculties: 0, degrees: 0, modules: 0 };
    }
    return {
      faculties: draft.facultyIds?.length || 0,
      degrees: draft.degreeProgramIds?.length || 0,
      modules: draft.moduleIds?.length || 0,
    };
  }, [draft]);

  const toggleStaffFaculty = (code) => {
    onDraftChange((d) => {
      if (d.kind !== "STAFF") return d;
      const set = new Set(d.facultyIds || []);
      if (set.has(code)) set.delete(code);
      else set.add(code);
      return {
        ...d,
        facultyIds: Array.from(set),
        degreeProgramIds: [],
        moduleIds: [],
      };
    });
  };

  const toggleStaffDegree = (code) => {
    onDraftChange((d) => {
      if (d.kind !== "STAFF") return d;
      const set = new Set(d.degreeProgramIds || []);
      if (set.has(code)) set.delete(code);
      else set.add(code);
      return { ...d, degreeProgramIds: Array.from(set), moduleIds: [] };
    });
  };

  const toggleStaffModule = (code) => {
    onDraftChange((d) => {
      if (d.kind !== "STAFF") return d;
      const set = new Set(d.moduleIds || []);
      if (set.has(code)) set.delete(code);
      else set.add(code);
      return { ...d, moduleIds: Array.from(set) };
    });
  };

  if (!draft) {
    return null;
  }

  if (requestedRole === "STUDENT" && draft.kind === "STUDENT") {
    return (
      <div className="flex flex-col gap-4 text-left">
        <SignupStudentRegistrationBlock draft={draft} onDraftChange={onDraftChange} primaryEmail={primaryEmail} />
      </div>
    );
  }

  if ((requestedRole === "LECTURER" || requestedRole === "LAB_ASSISTANT") && draft.kind === "STAFF") {
    return (
      <div className="flex flex-col gap-4 text-left">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">Primary email (login)</span>
          <input className={`${inpCls()} opacity-80`} readOnly type="email" value={primaryEmail || ""} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">Full name *</span>
          <input
            className={inpCls()}
            autoComplete="name"
            value={draft.fullName}
            onChange={(e) => onDraftChange((d) => (d.kind === "STAFF" ? { ...d, fullName: e.target.value } : d))}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">Optional email</span>
          <input
            className={inpCls()}
            type="email"
            value={draft.optionalEmail}
            onChange={(e) =>
              onDraftChange((d) => (d.kind === "STAFF" ? { ...d, optionalEmail: e.target.value } : d))
            }
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text/70">Phone *</span>
            <input
              className={inpCls()}
              value={draft.phone}
              onChange={(e) => onDraftChange((d) => (d.kind === "STAFF" ? { ...d, phone: e.target.value } : d))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text/70">NIC / Staff ID</span>
            <input
              className={inpCls()}
              value={draft.nicStaffId}
              onChange={(e) =>
                onDraftChange((d) => (d.kind === "STAFF" ? { ...d, nicStaffId: e.target.value } : d))
              }
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">Status</span>
          <select
            className={inpCls()}
            value={draft.status}
            onChange={(e) => onDraftChange((d) => (d.kind === "STAFF" ? { ...d, status: e.target.value } : d))}
          >
            {STAFF_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <h3 className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-text/55">Teaching scope</h3>
        <div className="flex flex-wrap gap-2">
          <Chip>Faculties: {staffCounts.faculties}</Chip>
          <Chip>Degrees: {staffCounts.degrees}</Chip>
          <Chip>Modules: {staffCounts.modules}</Chip>
        </div>
        <div className="max-h-40 overflow-y-auto rounded-2xl border border-border p-3">
          <p className="mb-2 text-xs font-semibold text-text/70">Faculties</p>
          <div className="flex flex-col gap-2">
            {faculties.map((f) => (
              <label key={f.code} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={(draft.facultyIds || []).includes(f.code)}
                  onChange={() => toggleStaffFaculty(f.code)}
                />
                <span>
                  {f.code} — {f.name}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto rounded-2xl border border-border p-3">
          <p className="mb-2 text-xs font-semibold text-text/70">Degree programs</p>
          {!(draft.facultyIds || []).length ? (
            <p className="text-xs text-text/60">Select at least one faculty.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {staffDegrees.map((d) => (
                <label key={d.code} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(draft.degreeProgramIds || []).includes(d.code)}
                    onChange={() => toggleStaffDegree(d.code)}
                  />
                  <span>
                    {d.code} — {d.name}{" "}
                    <span className="text-text/50">({d.facultyCode})</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-border p-3">
          <p className="mb-2 text-xs font-semibold text-text/70">Modules</p>
          {!(draft.facultyIds || []).length ? (
            <p className="text-xs text-text/60">Select faculties to load modules.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {staffModules.map((m) => (
                <label key={m.code} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(draft.moduleIds || []).includes(m.code)}
                    onChange={() => toggleStaffModule(m.code)}
                  />
                  <span>
                    {m.code} — {m.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (["USER", "MANAGER", "TECHNICIAN", "ADMIN"].includes(requestedRole) && draft.kind === "CONSOLE") {
    return (
      <div className="flex flex-col gap-4 text-left">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">Email *</span>
          <input className={`${inpCls()} opacity-80`} readOnly type="email" value={primaryEmail || ""} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">Full name *</span>
          <input
            className={inpCls()}
            value={draft.fullName}
            onChange={(e) => onDraftChange((d) => (d.kind === "CONSOLE" ? { ...d, fullName: e.target.value } : d))}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">Username *</span>
          <input
            className={inpCls()}
            autoComplete="username"
            value={draft.username}
            onChange={(e) => onDraftChange((d) => (d.kind === "CONSOLE" ? { ...d, username: e.target.value } : d))}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">Phone *</span>
          <input
            className={inpCls()}
            value={draft.phone}
            onChange={(e) => onDraftChange((d) => (d.kind === "CONSOLE" ? { ...d, phone: e.target.value } : d))}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">Requested role</span>
          <input className={`${inpCls()} opacity-80`} readOnly value={requestedRole.replaceAll("_", " ")} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text/70">Status</span>
          <select
            className={inpCls()}
            value={draft.status}
            onChange={(e) => onDraftChange((d) => (d.kind === "CONSOLE" ? { ...d, status: e.target.value } : d))}
          >
            {STAFF_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  return <p className="text-sm text-text/70">Choose a campus role above to open the registration fields.</p>;
}

export default SignupRegistrationFields;
