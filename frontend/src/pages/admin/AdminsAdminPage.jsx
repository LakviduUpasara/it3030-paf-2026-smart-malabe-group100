import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import Button from "../../components/Button";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useAdminShell } from "../../context/AdminShellContext";
import * as registrationService from "../../services/registrationService";
import { ROLES } from "../../utils/roleUtils";

/** Matches backend `Role` enum — same set admins can assign as signup approval. */
const DIRECTORY_ROLES = [
  ROLES.USER,
  ROLES.STUDENT,
  ROLES.LECTURER,
  ROLES.LAB_ASSISTANT,
  ROLES.TECHNICIAN,
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.LOST_ITEM_ADMIN,
];
const STATUSES = ["ACTIVE", "INACTIVE"];

function emptyAdminForm() {
  return {
    fullName: "",
    username: "",
    email: "",
    password: "",
    role: "ADMIN",
    status: "ACTIVE",
  };
}

function AdminsAdminPage() {
  const { setActiveWindow } = useAdminShell();
  const [viewMode, setViewMode] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const deferredSearch = useDeferredValue(search);

  const [form, setForm] = useState(() => emptyAdminForm());
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [lastGeneratedPassword, setLastGeneratedPassword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = {};
      if (deferredSearch.trim()) q.search = deferredSearch.trim();
      if (roleFilter) q.role = roleFilter;
      if (statusFilter) q.status = statusFilter;
      const data = await registrationService.listAdmins(q);
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load accounts.");
    } finally {
      setLoading(false);
    }
  }, [deferredSearch, roleFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyAdminForm());
    setFormError("");
    setFormSuccess("");
    setLastGeneratedPassword("");
    setViewMode("form");
    setActiveWindow("Register");
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      fullName: row.fullName || "",
      username: row.username || "",
      email: row.email || "",
      password: "",
      role: row.role || "ADMIN",
      status: row.status || "ACTIVE",
    });
    setFormError("");
    setFormSuccess("");
    setLastGeneratedPassword("");
    setViewMode("form");
    setActiveWindow("Edit");
  };

  const cancelForm = () => {
    setViewMode("list");
    setEditingId(null);
    setFormError("");
    setActiveWindow("");
  };

  const submit = async () => {
    setSubmitting(true);
    setFormError("");
    setLastGeneratedPassword("");
    try {
      const base = {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
        status: form.status,
      };

      if (editingId) {
        const payload = { ...base };
        if (form.password.trim()) {
          payload.password = form.password.trim();
        }
        await registrationService.updateAdmin(editingId, payload);
        setFormSuccess("Account updated.");
      } else {
        const payload = { ...base };
        if (form.password.trim()) {
          payload.password = form.password.trim();
        }
        const res = await registrationService.createAdmin(payload);
        if (res.generatedPassword) {
          setLastGeneratedPassword(res.generatedPassword);
        }
        setFormSuccess("Account created.");
      }

      setForm(emptyAdminForm());
      setEditingId(null);
      setViewMode("list");
      setActiveWindow("");
      await load();
    } catch (e) {
      setFormError(e.message || "Save failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async (row) => {
    const ok = window.confirm(
      `Delete account for ${row.fullName} (${row.email})? This cannot be undone.`,
    );
    if (!ok) return;
    setDeletingId(row.id);
    setError("");
    try {
      await registrationService.deleteAdmin(row.id);
      setFormSuccess("Account deleted.");
      await load();
    } catch (e) {
      setError(e.message || "Delete failed.");
    } finally {
      setDeletingId("");
    }
  };

  const copyPw = async () => {
    try {
      await navigator.clipboard.writeText(lastGeneratedPassword);
    } catch {
      /* ignore */
    }
  };

  const isEdit = Boolean(editingId);

  return (
    <>
      <AdminPageHeader
        actions={
          viewMode === "list" ? (
            <Button className="inline-flex items-center gap-2" onClick={openAdd} type="button" variant="primary">
              <Plus className="h-4 w-4" aria-hidden />
              Add user
            </Button>
          ) : (
            <Button className="inline-flex items-center gap-2" onClick={cancelForm} type="button" variant="secondary">
              Back to list
            </Button>
          )
        }
        description="Create and manage platform accounts (admin, user, technician, manager). Optional password on create — otherwise the server generates one and shows it once. Edit details or remove accounts from the directory."
        title="Admins"
      />

      {viewMode === "form" ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text/60">
            {isEdit ? "Edit account" : "New account"}
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Full name *</span>
              <input
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Username *</span>
              <input
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Email *</span>
              <input
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">
                {isEdit ? "New password (optional, min 8 if set; leave blank to keep current)" : "Password (optional, min 8 if set)"}
              </span>
              <input
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text/70">Role</span>
                <select
                  className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {DIRECTORY_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text/70">Status</span>
                <select
                  className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
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
            </div>
          </div>

          {formError ? (
            <div className="mt-4 rounded-2xl border border-border bg-tint p-3 text-sm" role="alert">
              {formError}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <Button disabled={submitting} onClick={submit} type="button" variant="primary">
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create account"}
            </Button>
            <Button type="button" variant="secondary" onClick={cancelForm}>
              Cancel
            </Button>
          </div>
        </section>
      ) : null}

      {viewMode === "list" ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          {formSuccess ? (
            <div
              className="mb-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-900 dark:text-emerald-100"
              role="status"
            >
              {formSuccess}
            </div>
          ) : null}

          {lastGeneratedPassword ? (
            <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-800 dark:text-emerald-200">
                Generated password (copy now — shown once)
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-card px-2 py-1 text-sm">{lastGeneratedPassword}</code>
                <Button type="button" variant="secondary" className="inline-flex items-center gap-1" onClick={copyPw}>
                  <Copy className="h-4 w-4" aria-hidden />
                  Copy
                </Button>
              </div>
            </div>
          ) : null}

          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text/60">Directory</h2>
          <div className="mt-4 flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:flex-wrap md:items-end">
            <label className="flex min-w-[160px] flex-1 flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Search</span>
              <input
                className="h-12 rounded-2xl border border-border bg-card px-4 text-sm"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, username, email"
              />
            </label>
            <label className="flex w-full flex-col gap-1 md:w-44">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Role</span>
              <select
                className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All</option>
                {DIRECTORY_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex w-full flex-col gap-1 md:w-40">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Status</span>
              <select
                className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
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
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Username</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr className="border-b border-border/70" key={row.id}>
                      <td className="py-3 pr-4 font-medium text-heading">{row.fullName}</td>
                      <td className="py-3 pr-4">{row.username}</td>
                      <td className="py-3 pr-4 text-text/80">{row.email}</td>
                      <td className="py-3 pr-4">{String(row.role).replaceAll("_", " ")}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex rounded-full border border-border bg-tint px-2.5 py-1 text-xs font-semibold">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="secondary"
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs"
                            onClick={() => openEdit(row)}
                            aria-label={`Edit ${row.fullName}`}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="inline-flex items-center gap-1 border-red-500/30 px-2 py-1.5 text-xs text-red-700 hover:bg-red-500/10 dark:text-red-300"
                            disabled={deletingId === row.id}
                            onClick={() => confirmDelete(row)}
                            aria-label={`Delete ${row.fullName}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            {deletingId === row.id ? "…" : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && !list.length ? (
              <p className="mt-4 text-sm text-text/70">No accounts match the filters.</p>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}

export default AdminsAdminPage;
