import { useCallback, useEffect, useMemo, useState } from "react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import Button from "../../components/Button";
import { useAdminShell } from "../../context/AdminShellContext";
import * as facultyService from "../../services/facultyService";
import * as degreeService from "../../services/lmsDegreeProgramService";
import * as intakeService from "../../services/intakeService";
import * as subgroupService from "../../services/subgroupService";

const TERM_SEQUENCE = ["Y1S1", "Y1S2", "Y2S1", "Y2S2", "Y3S1", "Y3S2", "Y4S1", "Y4S2"];

const PRIMARY = "#034aa6";
const ASSIGN = "#0f766e";
const VALIDATION = "#0339A6";

function sortSubgroupCodes(a, b) {
  const pa = String(a).split(".").map((x) => parseInt(x, 10) || 0);
  const pb = String(b).split(".").map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return String(a).localeCompare(String(b));
}

function Toast({ message, kind, onDismiss }) {
  if (!message) return null;
  const bg =
    kind === "success"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
      : "border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-100";
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${bg}`}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <span>{message}</span>
        <button type="button" className="text-text/60 hover:text-text" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  );
}

function SubgroupsAdminPage() {
  const { setActiveWindow } = useAdminShell();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast?.message) return undefined;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const [faculties, setFaculties] = useState([]);
  const [facultyCode, setFacultyCode] = useState("");
  const [degrees, setDegrees] = useState([]);
  const [degreeCode, setDegreeCode] = useState("");
  const [intakes, setIntakes] = useState([]);
  const [intakeId, setIntakeId] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("Y1S1");

  const [headcountTotal, setHeadcountTotal] = useState(null);
  const [headcountLoading, setHeadcountLoading] = useState(false);

  const [assignMode, setAssignMode] = useState("GROUP_COUNT");
  const [subgroupCount, setSubgroupCount] = useState(2);
  const [studentsPerSubgroup, setStudentsPerSubgroup] = useState(10);

  const [previewResponse, setPreviewResponse] = useState(null);
  const [previewParams, setPreviewParams] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setActiveWindow("Allocation");
    return () => setActiveWindow("");
  }, [setActiveWindow]);

  useEffect(() => {
    facultyService.listFaculties().then(setFaculties).catch(() => setFaculties([]));
  }, []);

  useEffect(() => {
    if (!facultyCode) {
      setDegrees([]);
      setDegreeCode("");
      return;
    }
    degreeService
      .listDegreePrograms({ faculty: facultyCode, status: "ACTIVE", page: 1, pageSize: 200 })
      .then((data) => setDegrees(data.items || []))
      .catch(() => setDegrees([]));
  }, [facultyCode]);

  useEffect(() => {
    if (!facultyCode || !degreeCode) {
      setIntakes([]);
      setIntakeId("");
      return;
    }
    intakeService
      .listIntakesPaged({
        page: 1,
        pageSize: 100,
        sort: "az",
        status: "ACTIVE",
        facultyCode,
        degreeCode,
      })
      .then((data) => setIntakes(data.items || []))
      .catch(() => setIntakes([]));
  }, [facultyCode, degreeCode]);

  useEffect(() => {
    if (!intakeId) {
      setHeadcountTotal(null);
      return;
    }
    let cancelled = false;
    setHeadcountLoading(true);
    subgroupService
      .subgroupAutoAssign({
        intakeId,
        mode: "GROUP_COUNT",
        subgroupCount: 1,
        apply: false,
        termCode: selectedTerm || undefined,
      })
      .then((data) => {
        if (!cancelled) setHeadcountTotal(data.totalStudents);
      })
      .catch(() => {
        if (!cancelled) setHeadcountTotal(null);
      })
      .finally(() => {
        if (!cancelled) setHeadcountLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [intakeId, selectedTerm]);

  const selectedIntake = useMemo(
    () => intakes.find((i) => i.id === intakeId) || null,
    [intakes, intakeId],
  );

  useEffect(() => {
    if (selectedIntake?.currentTerm) {
      setSelectedTerm(selectedIntake.currentTerm);
    }
  }, [selectedIntake?.id]);

  const clearPreview = useCallback(() => {
    setPreviewResponse(null);
    setPreviewParams(null);
  }, []);

  const validateAllocationInputs = () => {
    if (!facultyCode || !degreeCode || !intakeId) {
      setToast({ message: "Select faculty, degree, and intake.", kind: "error" });
      return false;
    }
    if (assignMode === "GROUP_COUNT") {
      const n = Number.parseInt(String(subgroupCount), 10);
      if (!Number.isFinite(n) || n < 1) {
        setToast({ message: "Subgroup count must be a positive integer.", kind: "error" });
        return false;
      }
    } else {
      const n = Number.parseInt(String(studentsPerSubgroup), 10);
      if (!Number.isFinite(n) || n < 1) {
        setToast({ message: "Students per subgroup must be a positive integer.", kind: "error" });
        return false;
      }
    }
    return true;
  };

  const buildPayload = (apply) => {
    const base = {
      intakeId,
      apply,
      termCode: selectedTerm || undefined,
    };
    if (assignMode === "GROUP_COUNT") {
      return {
        ...base,
        mode: "GROUP_COUNT",
        subgroupCount: Number.parseInt(String(subgroupCount), 10),
      };
    }
    return {
      ...base,
      mode: "STUDENTS_PER_SUBGROUP",
      studentsPerSubgroup: Number.parseInt(String(studentsPerSubgroup), 10),
    };
  };

  const runPreview = async () => {
    if (!validateAllocationInputs()) return;
    setSubmitting(true);
    clearPreview();
    try {
      const payload = buildPayload(false);
      const data = await subgroupService.subgroupAutoAssign(payload);
      setPreviewResponse(data);
      setPreviewParams(payload);
      setToast({
        message: `Preview ready — ${data.totalStudents} student(s), ${data.changedCount} would change.`,
        kind: "success",
      });
    } catch (e) {
      setToast({ message: e.message || "Preview failed.", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const runAssign = async () => {
    if (!previewParams || !previewResponse) {
      setToast({ message: "Run preview first.", kind: "error" });
      return;
    }
    if ((headcountTotal ?? 0) <= 0) {
      setToast({ message: "No active students to assign.", kind: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const data = await subgroupService.subgroupAutoAssign({ ...previewParams, apply: true });
      setPreviewResponse(data);
      setToast({
        message: `Subgroups assigned — ${data.changedCount} updated, ${data.unchangedCount} unchanged.`,
        kind: "success",
      });
      setPreviewParams(null);
    } catch (e) {
      setToast({ message: e.message || "Assign failed.", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const distributionRows = useMemo(() => {
    if (!previewResponse) return [];
    const cur = Object.fromEntries(
      (previewResponse.currentDistribution || []).map((r) => [r.code, r.count]),
    );
    const pre = Object.fromEntries(
      (previewResponse.previewDistribution || []).map((r) => [r.code, r.count]),
    );
    const codes = [...new Set([...Object.keys(cur), ...Object.keys(pre)])].sort(sortSubgroupCodes);
    return codes.map((code) => ({
      code,
      current: cur[code] ?? 0,
      preview: pre[code] ?? 0,
    }));
  }, [previewResponse]);

  const termMatches = !(previewResponse && previewResponse.termMatchesCurrent === false);
  const assignDisabled =
    !previewParams || submitting || (previewResponse?.totalStudents ?? 0) <= 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Toast message={toast?.message} kind={toast?.kind} onDismiss={() => setToast(null)} />

      <AdminPageHeader
        title="Subgroups"
        description="Preview and assign subgroup codes for an intake. Active enrollments for the intake are pooled (weekday and weekend combined)."
      />

      <div
        className="mb-8 rounded-xl border border-border bg-surface p-6 shadow-sm"
        style={{ borderLeftWidth: 4, borderLeftColor: PRIMARY }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Filters</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Faculty</span>
            <select
              className="h-12 rounded-lg border border-border bg-background px-3 text-sm text-text"
              value={facultyCode}
              onChange={(e) => {
                setFacultyCode(e.target.value);
                setDegreeCode("");
                setIntakeId("");
                clearPreview();
              }}
            >
              <option value="">Select faculty</option>
              {faculties.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.code} — {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Degree program</span>
            <select
              className="h-12 rounded-lg border border-border bg-background px-3 text-sm text-text"
              value={degreeCode}
              onChange={(e) => {
                setDegreeCode(e.target.value);
                setIntakeId("");
                clearPreview();
              }}
              disabled={!facultyCode}
            >
              <option value="">Select degree</option>
              {degrees.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Intake</span>
            <select
              className="h-12 rounded-lg border border-border bg-background px-3 text-sm text-text"
              value={intakeId}
              onChange={(e) => {
                setIntakeId(e.target.value);
                clearPreview();
              }}
              disabled={!degreeCode}
            >
              <option value="">Select intake</option>
              {intakes.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name || i.label || i.id}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Semester (term code)</span>
            <select
              className="h-12 rounded-lg border border-border bg-background px-3 text-sm text-text"
              value={selectedTerm}
              onChange={(e) => {
                setSelectedTerm(e.target.value);
                clearPreview();
              }}
              disabled={!intakeId}
            >
              {TERM_SEQUENCE.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-4 text-sm" style={{ color: VALIDATION }}>
          {headcountLoading && intakeId ? "Loading headcount…" : null}
          {!headcountLoading && intakeId ? (
            <>
              Active students in intake pool: <strong>{headcountTotal ?? "—"}</strong>
            </>
          ) : null}
          {!intakeId ? <span className="text-text/60">Select an intake to load headcount.</span> : null}
        </p>
      </div>

      <div
        className="mb-8 rounded-xl border border-border bg-surface p-6 shadow-sm"
        style={{ borderLeftWidth: 4, borderLeftColor: PRIMARY }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Allocation</p>
        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="amode"
              checked={assignMode === "GROUP_COUNT"}
              onChange={() => {
                setAssignMode("GROUP_COUNT");
                clearPreview();
              }}
            />
            Split by subgroup count
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="amode"
              checked={assignMode === "STUDENTS_PER_SUBGROUP"}
              onChange={() => {
                setAssignMode("STUDENTS_PER_SUBGROUP");
                clearPreview();
              }}
            />
            Split by students per subgroup
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Subgroup count</span>
            <input
              type="number"
              min={1}
              className="h-12 rounded-lg border border-border bg-background px-3 text-sm text-text disabled:opacity-50"
              value={subgroupCount}
              disabled={assignMode !== "GROUP_COUNT"}
              onChange={(e) => {
                setSubgroupCount(e.target.value);
                clearPreview();
              }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Students per subgroup</span>
            <input
              type="number"
              min={1}
              className="h-12 rounded-lg border border-border bg-background px-3 text-sm text-text disabled:opacity-50"
              value={studentsPerSubgroup}
              disabled={assignMode !== "STUDENTS_PER_SUBGROUP"}
              onChange={(e) => {
                setStudentsPerSubgroup(e.target.value);
                clearPreview();
              }}
            />
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={runPreview}
            disabled={submitting}
            className="min-w-[8rem] rounded-lg px-4 py-2.5 text-white"
            style={{ backgroundColor: PRIMARY }}
          >
            Preview
          </Button>
          <Button
            type="button"
            onClick={runAssign}
            disabled={assignDisabled}
            className="min-w-[10rem] rounded-lg px-4 py-2.5 text-white"
            style={{ backgroundColor: ASSIGN }}
          >
            Assign subgroups
          </Button>
        </div>
      </div>

      {previewResponse ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {!termMatches ? (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-900 dark:text-amber-100">
                Selected semester does not match intake current term
              </span>
            ) : null}
            {previewResponse.applied ? (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-900 dark:text-emerald-100">
                Applied to database
              </span>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total students", value: previewResponse.totalStudents },
              { label: "Subgroups (planned)", value: previewResponse.totalSubgroups },
              { label: "Would change / changed", value: previewResponse.changedCount },
              { label: "Unchanged", value: previewResponse.unchangedCount },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">{c.label}</p>
                <p className="mt-1 text-2xl font-semibold text-heading">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-tint/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                    Subgroup
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                    Current count
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                    Preview count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {distributionRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-text/60">
                      No distribution rows (no students or no subgroups planned).
                    </td>
                  </tr>
                ) : (
                  distributionRows.map((row) => (
                    <tr key={row.code}>
                      <td className="px-4 py-2 font-medium text-heading">{row.code}</td>
                      <td className="px-4 py-2">{row.current}</td>
                      <td className="px-4 py-2">{row.preview}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SubgroupsAdminPage;
