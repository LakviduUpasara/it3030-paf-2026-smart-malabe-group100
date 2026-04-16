import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { Copy, Plus } from "lucide-react";
import Button from "../../components/Button";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useAdminShell } from "../../context/AdminShellContext";
import * as registrationService from "../../services/registrationService";

const ROLES = ["ADMIN", "LOST_ITEM_ADMIN"];
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
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const deferredSearch = useDeferredValue(search);

  const [form, setForm] = useState(() => emptyAdminForm());
  const [submitting, setSubmitting] = useState(false);
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
      setError(e.message || "Failed to load admins.");
    } finally {
      setLoading(false);
    }
  }, [deferredSearch, roleFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setForm(emptyAdminForm());
    setFormError("");
    setFormSuccess("");
    setLastGeneratedPassword("");
    setViewMode("form");
    setActiveWindow("Register");
  };

  const cancelAdd = () => {
    setViewMode("list");
    setFormError("");
    setActiveWindow("");
  };

  const submit = async () => {
    setSubmitting(true);
    setFormError("");
    setLastGeneratedPassword("");
    try {
      const payload = {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
        status: form.status,
      };
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }
      const res = await registrationService.createAdmin(payload);
      if (res.generatedPassword) {
        setLastGeneratedPassword(res.generatedPassword);
      }
      setFormSuccess("Admin account created.");
      setForm(emptyAdminForm());
      setViewMode("list");
      setActiveWindow("");
      await load();
    } catch (e) {
      setFormError(e.message || "Create failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyPw = async () => {
    try {
      await navigator.clipboard.writeText(lastGeneratedPassword);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <AdminPageHeader
        actions={
          viewMode === "list" ? (
            <Button className="inline-flex items-center gap-2" onClick={openAdd} type="button" variant="primary">
              <Plus className="h-4 w-4" aria-hidden />
              Add admin
            </Button>
          ) : (
            <Button className="inline-flex items-center gap-2" onClick={cancelAdd} type="button" variant="secondary">
              Cancel
            </Button>
          )
        }
        description="Create console admin user accounts (no separate staff profile). Optional password — otherwise the server generates one and shows it once."
        title="Admins"
      />

      {viewMode === "form" ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text/60">New admin</h2>
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
              <span className="text-xs font-semibold text-text/70">Password (optional, min 8 if set)</span>
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
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
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
              Create admin
            </Button>
            <Button type="button" variant="secondary" onClick={cancelAdd}>
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
            <label className="flex w-full flex-col gap-1 md:w-40">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Role</span>
              <select
                className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
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
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Username</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr className="border-b border-border/70" key={row.id}>
                      <td className="py-3 pr-4 font-medium text-heading">{row.fullName}</td>
                      <td className="py-3 pr-4">{row.username}</td>
                      <td className="py-3 pr-4 text-text/80">{row.email}</td>
                      <td className="py-3 pr-4">{row.role}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex rounded-full border border-border bg-tint px-2.5 py-1 text-xs font-semibold">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && !list.length ? (
              <p className="mt-4 text-sm text-text/70">No admins match the filters.</p>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}

export default AdminsAdminPage;
