import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../../components/Button";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useAdminShell } from "../../context/AdminShellContext";
import * as facultyService from "../../services/facultyService";
import * as degreeService from "../../services/lmsDegreeProgramService";

const STATUSES = ["ACTIVE", "INACTIVE", "DRAFT"];
const PAGE_SIZES = [10, 25, 50, 100];

function DegreeProgramsAdminPage() {
  const { setActiveWindow } = useAdminShell();
  const [faculties, setFaculties] = useState([]);
  const [paged, setPaged] = useState({ items: [], page: 1, pageSize: 25, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [facultyFilter, setFacultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [viewMode, setViewMode] = useState("list");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    facultyCode: "",
    award: "",
    credits: 120,
    durationYears: 3,
    status: "DRAFT",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    facultyService.listFaculties().then(setFaculties).catch(() => setFaculties([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await degreeService.listDegreePrograms({
        search: deferredSearch || undefined,
        faculty: facultyFilter || undefined,
        status: statusFilter || undefined,
        page,
        pageSize,
        sort: "updated",
      });
      setPaged(data);
    } catch (e) {
      setError(e.message || "Failed to load programs.");
    } finally {
      setLoading(false);
    }
  }, [deferredSearch, facultyFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil((paged.totalCount || 0) / (paged.pageSize || pageSize)));

  const openCreate = () => {
    setEditing(null);
    setError("");
    setForm({
      code: "",
      name: "",
      facultyCode: faculties[0]?.code || "",
      award: "",
      credits: 120,
      durationYears: 3,
      status: "DRAFT",
    });
    setViewMode("form");
    setActiveWindow("Create");
  };

  const openEdit = (row) => {
    setEditing(row);
    setError("");
    setForm({
      code: row.code,
      name: row.name,
      facultyCode: row.facultyCode,
      award: row.award,
      credits: row.credits,
      durationYears: row.durationYears,
      status: row.status,
    });
    setViewMode("form");
    setActiveWindow("Edit");
  };

  const cancelForm = () => {
    setViewMode("list");
    setActiveWindow("");
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      if (editing) {
        await degreeService.updateDegreeProgram(editing.code, {
          name: form.name,
          facultyCode: form.facultyCode,
          award: form.award,
          credits: form.credits,
          durationYears: form.durationYears,
          status: form.status,
        });
      } else {
        await degreeService.createDegreeProgram({
          code: form.code,
          name: form.name,
          facultyCode: form.facultyCode,
          award: form.award,
          credits: form.credits,
          durationYears: form.durationYears,
          status: form.status,
        });
      }
      cancelForm();
      await load();
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Soft-delete program ${row.code}?`)) {
      return;
    }
    setError("");
    try {
      await degreeService.deleteDegreeProgram(row.code);
      await load();
    } catch (e) {
      setError(e.message || "Delete failed.");
    }
  };

  const showing = useMemo(() => {
    const start = (paged.page - 1) * paged.pageSize + 1;
    const end = Math.min(paged.page * paged.pageSize, paged.totalCount);
    return { start, end };
  }, [paged]);

  return (
    <>
      <AdminPageHeader
        actions={
          viewMode === "list" ? (
            <Button className="inline-flex items-center gap-2" onClick={openCreate} type="button" variant="primary">
              <Plus className="h-4 w-4" aria-hidden />
              Add program
            </Button>
          ) : (
            <Button className="inline-flex items-center gap-2" onClick={cancelForm} type="button" variant="secondary">
              Cancel
            </Button>
          )
        }
        description="Programs under a faculty: award, credits, duration, and lifecycle status."
        title="Degree programs"
      />

      {viewMode === "form" ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text/60">
            {editing ? "Edit program" : "New program"}
          </h2>
          <div className="mt-4 space-y-4">
          {!editing ? (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Program code</span>
              <input
                className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
                maxLength={6}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                value={form.code}
              />
            </label>
          ) : (
            <p className="text-sm text-text/70">
              Code: <strong className="text-heading">{editing.code}</strong> (immutable)
            </p>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Name</span>
            <input
              className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              value={form.name}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Faculty</span>
            <select
              className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
              onChange={(e) => setForm((f) => ({ ...f, facultyCode: e.target.value }))}
              value={form.facultyCode}
            >
              {faculties.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.code}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Award</span>
            <input
              className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
              onChange={(e) => setForm((f) => ({ ...f, award: e.target.value }))}
              value={form.award}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Credits</span>
              <input
                className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
                min={1}
                onChange={(e) => setForm((f) => ({ ...f, credits: Number(e.target.value) }))}
                type="number"
                value={form.credits}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Duration (years)</span>
              <input
                className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
                min={1}
                onChange={(e) => setForm((f) => ({ ...f, durationYears: Number(e.target.value) }))}
                type="number"
                value={form.durationYears}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Status</span>
            <select
              className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              value={form.status}
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </label>
          {error ? (
            <div className="rounded-2xl border border-border bg-tint p-3 text-sm" role="alert">
              {error}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button onClick={cancelForm} type="button" variant="secondary">
              Cancel
            </Button>
            <Button disabled={submitting} onClick={submit} type="button" variant="primary">
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
          </div>
        </section>
      ) : null}

      {viewMode === "list" ? (
      <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
        <div className="grid gap-4 border-b border-border pb-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Search</span>
            <input
              aria-label="Search programs"
              className="h-12 rounded-2xl border border-border px-3"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              type="search"
              value={search}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Faculty</span>
            <select
              className="h-12 rounded-2xl border border-border px-3"
              onChange={(e) => {
                setFacultyFilter(e.target.value);
                setPage(1);
              }}
              value={facultyFilter}
            >
              <option value="">All</option>
              {faculties.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.code} — {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Status</span>
            <select
              className="h-12 rounded-2xl border border-border px-3"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              value={statusFilter}
            >
              <option value="">All</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Rows per page</span>
            <select
              className="h-12 rounded-2xl border border-border px-3"
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              value={pageSize}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-border bg-tint p-4" role="alert">
            <p className="text-sm font-semibold text-heading">Error</p>
            <p className="text-sm text-text/70">{error}</p>
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-text/70">Loading…</p>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                  <th className="py-3 pr-4">Code</th>
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Faculty</th>
                  <th className="py-3 pr-4">Award</th>
                  <th className="py-3 pr-4">Credits</th>
                  <th className="py-3 pr-4">Years</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.items.map((row) => (
                  <tr className="border-b border-border/70" key={row.code}>
                    <td className="py-3 pr-4 font-medium text-heading">{row.code}</td>
                    <td className="py-3 pr-4 text-text">{row.name}</td>
                    <td className="py-3 pr-4">{row.facultyCode}</td>
                    <td className="py-3 pr-4">{row.award}</td>
                    <td className="py-3 pr-4">{row.credits}</td>
                    <td className="py-3 pr-4">{row.durationYears}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex rounded-full border border-border bg-tint px-2.5 py-1 text-xs font-semibold">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(row)} type="button" variant="secondary">
                          Edit
                        </Button>
                        <Button onClick={() => onDelete(row)} type="button" variant="ghost">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 text-sm text-text/70 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing {paged.totalCount === 0 ? 0 : showing.start}–{showing.end} of {paged.totalCount}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
              variant="secondary"
            >
              Previous
            </Button>
            <span>
              Page {paged.page} of {totalPages}
            </span>
            <Button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              type="button"
              variant="secondary"
            >
              Next
            </Button>
          </div>
        </div>
      </section>
      ) : null}
    </>
  );
}

export default DegreeProgramsAdminPage;
