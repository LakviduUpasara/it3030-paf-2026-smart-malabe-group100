import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Button from "../../components/Button";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useAdminShell } from "../../context/AdminShellContext";
import StudentRegistrationFormBody from "../../components/registration/StudentRegistrationFormBody";
import { emptyStudentForm } from "../../components/registration/studentConstants";
import { useStudentRegistrationCatalog } from "../../hooks/useStudentRegistrationCatalog";
import * as registrationService from "../../services/registrationService";

function StudentsAdminPage() {
  const { setActiveWindow } = useAdminShell();
  const [viewMode, setViewMode] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [editingStudentIdLabel, setEditingStudentIdLabel] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [form, setForm] = useState(() => emptyStudentForm());
  const { faculties, degrees, intakes, subgroupOptions, loadingSubgroups } =
    useStudentRegistrationCatalog(form);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = {
        page,
        pageSize,
        sort: "createdAt,desc",
      };
      if (deferredSearch.trim()) q.search = deferredSearch.trim();
      if (statusFilter) q.status = statusFilter;
      const data = await registrationService.listStudents(q);
      setList(data.items || []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch (e) {
      setError(e.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, deferredSearch, statusFilter]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, statusFilter]);

  const openAdd = () => {
    setEditingId(null);
    setEditingStudentIdLabel("");
    setForm(emptyStudentForm());
    setFormError("");
    setFormSuccess("");
    setViewMode("form");
    setActiveWindow("Register");
  };

  const openEdit = (row) => {
    const le = row.latestEnrollment || {};
    const streamVal =
      typeof le.stream === "string" ? le.stream : le.stream?.name || le.stream || "WEEKDAY";
    setEditingId(row.id);
    setEditingStudentIdLabel(row.studentId || "");
    setForm({
      firstName: row.firstName || "",
      lastName: row.lastName || "",
      nicNumber: row.nicNumber || "",
      phone: row.phone || "",
      optionalEmail: row.optionalEmail || "",
      status: row.status || "ACTIVE",
      facultyId: le.facultyCode || "",
      degreeProgramId: le.degreeCode || "",
      intakeId: le.intakeId || "",
      stream: String(streamVal).toUpperCase(),
      subgroup: le.subgroup || "",
      enrollmentStatus: le.enrollmentStatus || "ACTIVE",
    });
    setFormError("");
    setFormSuccess("");
    setViewMode("form");
    setActiveWindow("Edit");
  };

  const cancelForm = () => {
    setViewMode("list");
    setEditingId(null);
    setEditingStudentIdLabel("");
    setFormError("");
    setFormSuccess("");
    setActiveWindow("");
  };

  const submit = async () => {
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        nicNumber: form.nicNumber.trim(),
        phone: form.phone.trim() || undefined,
        optionalEmail: form.optionalEmail.trim() || undefined,
        status: form.status,
        facultyId: form.facultyId.trim(),
        degreeProgramId: form.degreeProgramId.trim(),
        intakeId: form.intakeId.trim(),
        stream: form.stream,
        subgroup: form.subgroup.trim() || undefined,
        enrollmentStatus: form.enrollmentStatus,
      };
      if (editingId) {
        await registrationService.updateStudent(editingId, payload);
        setFormSuccess("Student updated.");
      } else {
        const created = await registrationService.createStudent(payload);
        setFormSuccess(
          `Created ${created.studentId} — login email ${created.email} (password is NIC at creation).`
        );
      }
      setForm(emptyStudentForm());
      setEditingId(null);
      setEditingStudentIdLabel("");
      setActiveWindow("");
      setViewMode("list");
      await loadList();
    } catch (e) {
      setFormError(e.message || "Save failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async (row) => {
    const ok = window.confirm(
      `Delete student ${row.studentId} (${row.firstName} ${row.lastName})? This removes enrollments and the login account.`
    );
    if (!ok) return;
    setDeletingId(row.id);
    setError("");
    try {
      await registrationService.deleteStudent(row.id);
      setFormSuccess("Student deleted.");
      await loadList();
    } catch (e) {
      setError(e.message || "Delete failed.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <>
      <AdminPageHeader
        actions={
          viewMode === "list" ? (
            <Button className="inline-flex items-center gap-2" onClick={openAdd} type="button" variant="primary">
              <Plus className="h-4 w-4" aria-hidden />
              Add student
            </Button>
          ) : (
            <Button className="inline-flex items-center gap-2" onClick={cancelForm} type="button" variant="secondary">
              Cancel
            </Button>
          )
        }
        description="Register a student with faculty, degree, intake, and stream. Subgroup must already exist for that cohort unless left blank."
        title="Students"
      />

      {viewMode === "form" ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text/60">
            {editingId ? "Edit student" : "New student"}
          </h2>
          {editingId && editingStudentIdLabel ? (
            <p className="mt-2 text-sm text-text/70">
              Student ID: <span className="font-mono font-medium text-heading">{editingStudentIdLabel}</span> (login email
              is fixed to this id)
            </p>
          ) : null}

          <StudentRegistrationFormBody
            degrees={degrees}
            faculties={faculties}
            form={form}
            intakes={intakes}
            loadingSubgroups={loadingSubgroups}
            setForm={setForm}
            subgroupOptions={subgroupOptions}
          />

          {formError ? (
            <div className="mt-4 rounded-2xl border border-border bg-tint p-3 text-sm" role="alert">
              {formError}
            </div>
          ) : null}
          {formSuccess ? (
            <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-900 dark:text-emerald-100">
              {formSuccess}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              className="inline-flex items-center gap-2"
              disabled={submitting}
              onClick={submit}
              type="button"
              variant="primary"
            >
              {editingId ? null : <Plus className="h-4 w-4" aria-hidden />}
              {editingId ? "Save changes" : "Create student"}
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
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text/60">Directory</h2>
          <div className="mt-4 flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-end">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Search</span>
              <input
                className="h-12 rounded-2xl border border-border bg-card px-4 text-sm"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Student id, name, email, NIC…"
              />
            </label>
            <label className="flex w-full flex-col gap-1 md:w-44">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Status</span>
              <select
                className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                {PROFILE_STATUSES.map((s) => (
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
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                    <th className="py-3 pr-4">Student ID</th>
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Enrollments</th>
                    <th className="py-3 pr-4">Latest</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr className="border-b border-border/70" key={row.id}>
                      <td className="py-3 pr-4 font-mono text-xs text-heading">{row.studentId}</td>
                      <td className="py-3 pr-4">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="py-3 pr-4 text-xs text-text/80">{row.email}</td>
                      <td className="py-3 pr-4">{row.enrollmentCount}</td>
                      <td className="py-3 pr-4 text-xs text-text/70">
                        {row.latestEnrollment
                          ? `${row.latestEnrollment.facultyCode ?? ""} / ${row.latestEnrollment.degreeCode ?? ""} · ${row.latestEnrollment.stream ?? ""}${row.latestEnrollment.subgroup ? ` · ${row.latestEnrollment.subgroup}` : ""}`
                          : "—"}
                      </td>
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
                            aria-label={`Edit ${row.studentId}`}
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
                            aria-label={`Delete ${row.studentId}`}
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
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm text-text/70 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Page {page + 1} of {Math.max(totalPages, 1)} · {totalElements} total
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
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

export default StudentsAdminPage;
