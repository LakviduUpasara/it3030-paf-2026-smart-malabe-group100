import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Button from "../../components/Button";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useAdminShell } from "../../context/AdminShellContext";
import * as facultyService from "../../services/facultyService";
import * as degreeService from "../../services/lmsDegreeProgramService";
import * as intakeService from "../../services/intakeService";

const TERM_SEQUENCE = ["Y1S1", "Y1S2", "Y2S1", "Y2S2", "Y3S1", "Y3S2", "Y4S1", "Y4S2"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const STATUSES = ["ACTIVE", "INACTIVE", "DRAFT"];
const SORTS = [
  { value: "updated", label: "Updated" },
  { value: "created", label: "Created" },
  { value: "az", label: "Name A–Z" },
  { value: "za", label: "Name Z–A" },
];
const PAGE_SIZES = [10, 25, 50, 100];
const WEEK_OPTIONS = [12, 14, 16, 18];
const NOTIFY_OPTIONS = [1, 3, 7];

function emptyTermRows(defaultWeeks, defaultNotify) {
  return TERM_SEQUENCE.map((termCode) => ({
    termCode,
    startDate: "",
    endDate: "",
    weeks: defaultWeeks,
    notifyBeforeDays: defaultNotify,
    isManuallyCustomized: false,
  }));
}

function statusBadgeClass(st) {
  if (st === "ACTIVE") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100";
  if (st === "DRAFT") return "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100";
  return "border-border bg-tint text-text";
}

function IntakesAdminPage() {
  const { setActiveWindow } = useAdminShell();
  const [faculties, setFaculties] = useState([]);
  const [degreesModal, setDegreesModal] = useState([]);
  const [degreesFilter, setDegreesFilter] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("");
  const [currentTermFilter, setCurrentTermFilter] = useState("");
  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [viewMode, setViewMode] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    name: "",
    stream: "",
    facultyCode: "",
    degreeCode: "",
    intakeYear: new Date().getFullYear(),
    intakeMonth: "June",
    status: "ACTIVE",
    autoJumpEnabled: true,
    autoGenerateFutureTerms: true,
    defaultWeeksPerTerm: 16,
    defaultNotifyBeforeDays: 3,
    termRows: emptyTermRows(16, 3),
  });

  useEffect(() => {
    facultyService.listFaculties().then(setFaculties).catch(() => setFaculties([]));
  }, []);

  const loadDegreesModal = useCallback(async (facultyCode) => {
    if (!facultyCode) {
      setDegreesModal([]);
      return;
    }
    try {
      const data = await degreeService.listDegreePrograms({ faculty: facultyCode, page: 1, pageSize: 200 });
      setDegreesModal(data.items || []);
    } catch {
      setDegreesModal([]);
    }
  }, []);

  useEffect(() => {
    if (form.facultyCode) {
      loadDegreesModal(form.facultyCode);
    } else {
      setDegreesModal([]);
    }
  }, [form.facultyCode, loadDegreesModal]);

  useEffect(() => {
    if (!facultyFilter) {
      setDegreesFilter([]);
      return;
    }
    degreeService
      .listDegreePrograms({ faculty: facultyFilter, page: 1, pageSize: 200 })
      .then((d) => setDegreesFilter(d.items || []))
      .catch(() => setDegreesFilter([]));
  }, [facultyFilter]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = {
        page,
        pageSize,
        sort,
      };
      if (deferredSearch.trim()) q.search = deferredSearch.trim();
      if (statusFilter) q.status = statusFilter;
      if (facultyFilter) q.facultyCode = facultyFilter;
      if (degreeFilter) q.degreeCode = degreeFilter;
      if (currentTermFilter) q.currentTerm = currentTermFilter;
      const data = await intakeService.listIntakesPaged(q);
      setItems(data.items || []);
      setTotal(data.totalCount ?? data.total ?? 0);
    } catch (e) {
      setError(e.message || "Failed to load intakes.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sort, deferredSearch, statusFilter, facultyFilter, degreeFilter, currentTermFilter]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter, facultyFilter, degreeFilter, currentTermFilter, sort, pageSize]);

  const openCreate = () => {
    setEditingId(null);
    setFormError("");
    setForm({
      name: "",
      stream: "",
      facultyCode: faculties[0]?.code || "",
      degreeCode: "",
      intakeYear: new Date().getFullYear(),
      intakeMonth: "June",
      status: "ACTIVE",
      autoJumpEnabled: true,
      autoGenerateFutureTerms: true,
      defaultWeeksPerTerm: 16,
      defaultNotifyBeforeDays: 3,
      termRows: emptyTermRows(16, 3),
    });
    setViewMode("form");
    setActiveWindow("Create");
  };

  const openEdit = async (row) => {
    setFormError("");
    setEditingId(row.id);
    setViewMode("form");
    setActiveWindow("Edit");
    try {
      const d = await intakeService.getIntakeDetail(row.id);
      const rows = TERM_SEQUENCE.map((code) => {
        const t = (d.termSchedules || d.schedules || []).find((x) => x.termCode === code);
        return {
          termCode: code,
          startDate: t?.startDate ? String(t.startDate).slice(0, 10) : "",
          endDate: t?.endDate ? String(t.endDate).slice(0, 10) : "",
          weeks: t?.weeks ?? d.defaultWeeksPerTerm ?? 16,
          notifyBeforeDays: t?.notifyBeforeDays ?? d.defaultNotifyBeforeDays ?? 3,
          isManuallyCustomized: !!t?.isManuallyCustomized,
        };
      });
      setForm({
        name: d.name || "",
        stream: d.stream || "",
        facultyCode: d.facultyCode || "",
        degreeCode: d.degreeCode || "",
        intakeYear: d.intakeYear ?? new Date().getFullYear(),
        intakeMonth: d.intakeMonth || "June",
        status: d.status || "ACTIVE",
        autoJumpEnabled: d.autoJump !== undefined ? d.autoJump : d.autoJumpEnabled ?? true,
        autoGenerateFutureTerms: d.autoGenerateFutureTerms ?? true,
        defaultWeeksPerTerm: d.defaultWeeksPerTerm ?? 16,
        defaultNotifyBeforeDays: d.defaultNotifyBeforeDays ?? 3,
        termRows: rows,
      });
      loadDegreesModal(d.facultyCode);
    } catch (e) {
      setFormError(e.message || "Could not load intake.");
    }
  };

  const cancelForm = () => {
    setViewMode("list");
    setEditingId(null);
    setActiveWindow("");
  };

  const updateTermRow = (idx, patch) => {
    setForm((f) => {
      const termRows = f.termRows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
      return { ...f, termRows };
    });
  };

  const validateClientSchedules = () => {
    for (const r of form.termRows) {
      if (r.startDate && r.endDate) {
        const a = new Date(r.startDate);
        const b = new Date(r.endDate);
        if (b <= a) {
          return "Term end date must be after term start date";
        }
      }
    }
    return "";
  };

  const buildPayload = () => {
    const termSchedules = form.termRows.map((r) => ({
      termCode: r.termCode,
      startDate: r.startDate || null,
      endDate: r.endDate || null,
      weeks: r.weeks,
      notifyBeforeDays: r.notifyBeforeDays,
      isManuallyCustomized: r.isManuallyCustomized,
    }));
    return {
      name: form.name.trim(),
      stream: form.stream.trim() || undefined,
      facultyCode: form.facultyCode.trim(),
      degreeCode: form.degreeCode.trim(),
      intakeYear: Number(form.intakeYear),
      intakeMonth: form.intakeMonth,
      status: form.status,
      autoJumpEnabled: form.autoJumpEnabled,
      autoGenerateFutureTerms: form.autoGenerateFutureTerms,
      autoGenerateTerms: form.autoGenerateFutureTerms,
      defaultWeeksPerTerm: form.defaultWeeksPerTerm,
      defaultNotifyBeforeDays: form.defaultNotifyBeforeDays,
      termSchedules,
    };
  };

  const submit = async () => {
    const clientErr = validateClientSchedules();
    if (clientErr) {
      setFormError(clientErr);
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const payload = buildPayload();
      if (editingId) {
        await intakeService.updateIntake(editingId, payload);
      } else {
        await intakeService.createIntake(payload);
      }
      cancelForm();
      await loadList();
    } catch (e) {
      setFormError(e.message || "Save failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Soft-delete intake “${row.name || row.id}”?`)) {
      return;
    }
    setError("");
    try {
      await intakeService.deleteIntake(row.id);
      await loadList();
    } catch (e) {
      setError(e.message || "Delete failed.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <AdminPageHeader
        actions={
          viewMode === "list" ? (
            <Button className="inline-flex items-center gap-2" onClick={openCreate} type="button" variant="primary">
              <Plus className="h-4 w-4" aria-hidden />
              Add intake
            </Button>
          ) : (
            <Button className="inline-flex items-center gap-2" onClick={cancelForm} type="button" variant="secondary">
              Cancel
            </Button>
          )
        }
        description="One intake = one cohort for a faculty and degree, with an 8-term calendar and policies for student ID prefixes."
        title="Intakes / Batches"
      />

      {viewMode === "list" ? (
      <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
        <div className="flex flex-col gap-4 border-b border-border pb-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Search</span>
              <input
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, code, faculty…"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Status</span>
              <select
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Faculty</span>
              <select
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                value={facultyFilter}
                onChange={(e) => {
                  setFacultyFilter(e.target.value);
                  setDegreeFilter("");
                }}
              >
                <option value="">All</option>
                {faculties.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Degree</span>
              <select
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                value={degreeFilter}
                onChange={(e) => setDegreeFilter(e.target.value)}
                disabled={!facultyFilter}
              >
                <option value="">All</option>
                {degreesFilter.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Current term</span>
              <select
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                value={currentTermFilter}
                onChange={(e) => setCurrentTermFilter(e.target.value)}
              >
                <option value="">All</option>
                {TERM_SEQUENCE.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Sort</span>
              <select className="h-11 rounded-2xl border border-border bg-card px-3 text-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-border bg-tint p-4" role="alert">
            <p className="text-sm">{error}</p>
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-text/70">Loading…</p>
          ) : (
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                  <th className="py-3 pr-4">Intake</th>
                  <th className="py-3 pr-4">Faculty</th>
                  <th className="py-3 pr-4">Degree</th>
                  <th className="py-3 pr-4">Year / month</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Current term</th>
                  <th className="py-3 pr-4">Updated</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr className="border-b border-border/70" key={row.id}>
                    <td className="py-3 pr-4 font-medium text-heading">{row.name}</td>
                    <td className="py-3 pr-4">{row.facultyCode}</td>
                    <td className="py-3 pr-4">{row.degreeCode}</td>
                    <td className="py-3 pr-4 text-xs">
                      {row.intakeYear} / {row.intakeMonth}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">{row.currentTerm}</td>
                    <td className="py-3 pr-4 text-xs text-text/70">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—"}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(row)} type="button" variant="secondary" className="inline-flex items-center gap-1">
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Edit
                        </Button>
                        <Button onClick={() => onDelete(row)} type="button" variant="ghost" className="inline-flex items-center gap-1 text-red-600">
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && !items.length ? <p className="mt-4 text-sm text-text/70">No intakes match the filters.</p> : null}
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm text-text/70 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs">
              Rows
              <select
                className="h-9 rounded-xl border border-border bg-card px-2 text-sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button type="button" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </section>
      ) : null}

      {viewMode === "form" ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text/60">
            {editingId ? "Edit intake" : "New intake"}
          </h2>
        <div className="mt-4 flex max-h-[min(85vh,900px)] flex-col gap-4 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-semibold text-text/70">Intake name *</span>
              <input
                className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Faculty *</span>
              <select
                className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
                value={form.facultyCode}
                onChange={(e) => setForm((f) => ({ ...f, facultyCode: e.target.value, degreeCode: "" }))}
                disabled={!!editingId}
              >
                <option value="">Select</option>
                {faculties.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.code} — {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Degree *</span>
              <select
                className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
                value={form.degreeCode}
                onChange={(e) => setForm((f) => ({ ...f, degreeCode: e.target.value }))}
                disabled={!form.facultyCode || !!editingId}
              >
                <option value="">Select</option>
                {degreesModal.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Intake year *</span>
              <input
                type="number"
                className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
                min={2000}
                max={2100}
                value={form.intakeYear}
                onChange={(e) => setForm((f) => ({ ...f, intakeYear: Number(e.target.value) }))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Intake month *</span>
              <select
                className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
                value={form.intakeMonth}
                onChange={(e) => setForm((f) => ({ ...f, intakeMonth: e.target.value }))}
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Status</span>
              <select
                className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Stream (optional)</span>
              <input
                className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
                value={form.stream}
                onChange={(e) => setForm((f) => ({ ...f, stream: e.target.value }))}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-4 rounded-2xl border border-border p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.autoJumpEnabled}
                onChange={(e) => setForm((f) => ({ ...f, autoJumpEnabled: e.target.checked }))}
              />
              Auto jump
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.autoGenerateFutureTerms}
                onChange={(e) => setForm((f) => ({ ...f, autoGenerateFutureTerms: e.target.checked }))}
              />
              Auto-generate future terms
            </label>
            <label className="flex items-center gap-2 text-sm">
              Default weeks
              <select
                className="h-9 rounded-lg border border-border bg-card px-2 text-sm"
                value={form.defaultWeeksPerTerm}
                onChange={(e) => setForm((f) => ({ ...f, defaultWeeksPerTerm: Number(e.target.value) }))}
              >
                {WEEK_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              Notify before (days)
              <select
                className="h-9 rounded-lg border border-border bg-card px-2 text-sm"
                value={form.defaultNotifyBeforeDays}
                onChange={(e) => setForm((f) => ({ ...f, defaultNotifyBeforeDays: Number(e.target.value) }))}
              >
                {NOTIFY_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Term schedule</p>
            <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-border">
              <table className="w-full min-w-[720px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-tint text-left text-text/60">
                    <th className="p-2">Term</th>
                    <th className="p-2">Start</th>
                    <th className="p-2">End</th>
                    <th className="p-2">Weeks</th>
                    <th className="p-2">Notify</th>
                    <th className="p-2">Manual</th>
                  </tr>
                </thead>
                <tbody>
                  {form.termRows.map((r, idx) => (
                    <tr className="border-b border-border/70" key={r.termCode}>
                      <td className="p-2 font-mono">{r.termCode}</td>
                      <td className="p-1">
                        <input
                          type="date"
                          className="w-full rounded border border-border bg-card px-1 py-1"
                          value={r.startDate}
                          onChange={(e) => updateTermRow(idx, { startDate: e.target.value })}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="date"
                          className="w-full rounded border border-border bg-card px-1 py-1"
                          value={r.endDate}
                          onChange={(e) => updateTermRow(idx, { endDate: e.target.value })}
                        />
                      </td>
                      <td className="p-1">
                        <select
                          className="w-full rounded border border-border bg-card px-1 py-1"
                          value={r.weeks}
                          onChange={(e) => updateTermRow(idx, { weeks: Number(e.target.value) })}
                        >
                          {WEEK_OPTIONS.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1">
                        <select
                          className="w-full rounded border border-border bg-card px-1 py-1"
                          value={r.notifyBeforeDays}
                          onChange={(e) => updateTermRow(idx, { notifyBeforeDays: Number(e.target.value) })}
                        >
                          {NOTIFY_OPTIONS.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="checkbox"
                          checked={r.isManuallyCustomized}
                          onChange={(e) => updateTermRow(idx, { isManuallyCustomized: e.target.checked })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {formError ? (
            <div className="rounded-xl border border-border bg-tint p-3 text-sm" role="alert">
              {formError}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="secondary" onClick={cancelForm}>
              Cancel
            </Button>
            <Button type="button" variant="primary" disabled={submitting} onClick={submit}>
              {editingId ? "Save changes" : "Create intake"}
            </Button>
          </div>
        </div>
        </section>
      ) : null}
    </>
  );
}

export default IntakesAdminPage;
