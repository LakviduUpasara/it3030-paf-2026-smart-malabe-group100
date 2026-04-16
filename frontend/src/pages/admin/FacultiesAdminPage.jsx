import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../../components/Button";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useAdminShell } from "../../context/AdminShellContext";
import * as facultyService from "../../services/facultyService";

const STATUSES = ["ACTIVE", "INACTIVE"];

function emptyForm() {
  return { code: "", name: "", status: "ACTIVE" };
}

function FacultiesAdminPage() {
  const { setActiveWindow } = useAdminShell();
  const [viewMode, setViewMode] = useState("list");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const deferredSearch = useDeferredValue(search);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await facultyService.listFaculties();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load faculties.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = deferredSearch.trim().toLowerCase();
    return items.filter((f) => {
      if (statusFilter && f.status !== statusFilter) {
        return false;
      }
      if (!s) {
        return true;
      }
      return (
        (f.code && f.code.toLowerCase().includes(s)) || (f.name && f.name.toLowerCase().includes(s))
      );
    });
  }, [items, deferredSearch, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError("");
    setViewMode("form");
    setActiveWindow("Create");
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ code: row.code, name: row.name, status: row.status });
    setError("");
    setViewMode("form");
    setActiveWindow("Edit");
  };

  const cancelForm = () => {
    setViewMode("list");
    setEditing(null);
    setActiveWindow("");
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      if (editing) {
        await facultyService.updateFaculty(editing.code, { name: form.name, status: form.status });
      } else {
        await facultyService.createFaculty({
          code: form.code,
          name: form.name,
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
    if (!window.confirm(`Soft-delete faculty ${row.code}?`)) {
      return;
    }
    setError("");
    try {
      await facultyService.deleteFaculty(row.code);
      await load();
    } catch (e) {
      setError(e.message || "Delete failed.");
    }
  };

  return (
    <>
      <AdminPageHeader
        actions={
          viewMode === "list" ? (
            <Button className="inline-flex items-center gap-2" onClick={openCreate} type="button" variant="primary">
              <Plus className="h-4 w-4" aria-hidden />
              Add faculty
            </Button>
          ) : (
            <Button className="inline-flex items-center gap-2" onClick={cancelForm} type="button" variant="secondary">
              Cancel
            </Button>
          )
        }
        description="Register faculties as top-level org units. Codes are immutable after create."
        title="Faculties"
      />

      {viewMode === "form" ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text/60">
            {editing ? "Edit faculty" : "New faculty"}
          </h2>
          <div className="mt-4 space-y-4">
            {!editing ? (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Faculty code</span>
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
            <div className="flex flex-wrap gap-2 pt-2">
              <Button disabled={submitting} onClick={submit} type="button" variant="primary">
                {submitting ? "Saving…" : "Save"}
              </Button>
              <Button onClick={cancelForm} type="button" variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {viewMode === "list" ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-end">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Search</span>
              <input
                aria-label="Search faculties"
                className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-heading outline-none ring-focus focus:ring-2"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Code or name"
                type="search"
                value={search}
              />
            </label>
            <label className="flex w-full flex-col gap-1 md:w-48">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Status</span>
              <select
                className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
                onChange={(e) => setStatusFilter(e.target.value)}
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
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                    <th className="py-3 pr-4">Code</th>
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr className="border-b border-border/70" key={row.code}>
                      <td className="py-3 pr-4 font-medium text-heading">{row.code}</td>
                      <td className="py-3 pr-4 text-text">{row.name}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex rounded-full border border-border bg-tint px-2.5 py-1 text-xs font-semibold text-text">
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
            {!loading && !filtered.length ? (
              <p className="mt-4 text-sm text-text/70">No faculties match the current filters.</p>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}

export default FacultiesAdminPage;
