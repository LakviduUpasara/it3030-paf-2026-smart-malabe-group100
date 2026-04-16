import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../../components/Button";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useAdminShell } from "../../context/AdminShellContext";
import * as facultyService from "../../services/facultyService";
import * as degreeService from "../../services/lmsDegreeProgramService";
import * as registrationService from "../../services/registrationService";

const PROFILE_STATUSES = ["ACTIVE", "INACTIVE"];
const STREAMS = ["WEEKDAY", "WEEKEND"];
const ENROLL_STATUSES = ["ACTIVE", "INACTIVE"];

function emptyStudentForm() {
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

function StudentsAdminPage() {
  const { setActiveWindow } = useAdminShell();
  const [viewMode, setViewMode] = useState("list");
  const [faculties, setFaculties] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [subgroupOptions, setSubgroupOptions] = useState([]);
  const [loadingSubgroups, setLoadingSubgroups] = useState(false);

  const [form, setForm] = useState(() => emptyStudentForm());
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

  useEffect(() => {
    facultyService.listFaculties().then(setFaculties).catch(() => setFaculties([]));
  }, []);

  const loadDegrees = useCallback(async (facultyCode) => {
    if (!facultyCode) {
      setDegrees([]);
      return;
    }
    try {
      const data = await degreeService.listDegreePrograms({
        faculty: facultyCode,
        page: 1,
        pageSize: 200,
      });
      setDegrees(data.items || []);
    } catch {
      setDegrees([]);
    }
  }, []);

  useEffect(() => {
    if (form.facultyId) {
      loadDegrees(form.facultyId);
    } else {
      setDegrees([]);
    }
  }, [form.facultyId, loadDegrees]);

  useEffect(() => {
    const loadInt = async () => {
      if (!form.facultyId || !form.degreeProgramId) {
        setIntakes([]);
        return;
      }
      try {
        const data = await registrationService.listIntakes({
          facultyCode: form.facultyId,
          degreeCode: form.degreeProgramId,
        });
        setIntakes(Array.isArray(data) ? data : []);
      } catch {
        setIntakes([]);
      }
    };
    loadInt();
  }, [form.facultyId, form.degreeProgramId]);

  useEffect(() => {
    const run = async () => {
      if (!form.intakeId || !form.facultyId || !form.degreeProgramId || !form.stream) {
        setSubgroupOptions([]);
        return;
      }
      setLoadingSubgroups(true);
      try {
        const data = await registrationService.listIntakeSubgroups(form.intakeId, {
          facultyId: form.facultyId,
          degreeProgramId: form.degreeProgramId,
          stream: form.stream,
          status: "ACTIVE",
        });
        setSubgroupOptions(data.items || []);
      } catch {
        setSubgroupOptions([]);
      } finally {
        setLoadingSubgroups(false);
      }
    };
    run();
  }, [form.intakeId, form.facultyId, form.degreeProgramId, form.stream]);

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
    setForm(emptyStudentForm());
    setFormError("");
    setFormSuccess("");
    setViewMode("add");
    setActiveWindow("Register");
  };

  const cancelAdd = () => {
    setViewMode("list");
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
      const created = await registrationService.createStudent(payload);
      setFormSuccess(
        `Created ${created.studentId} — login email ${created.email} (password is NIC at creation).`
      );
      setForm(emptyStudentForm());
      setActiveWindow("");
      setViewMode("list");
      await loadList();
    } catch (e) {
      setFormError(e.message || "Create failed.");
    } finally {
      setSubmitting(false);
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
            <Button className="inline-flex items-center gap-2" onClick={cancelAdd} type="button" variant="secondary">
              Cancel
            </Button>
          )
        }
        description="Register a student with faculty, degree, intake, and stream. Subgroup must already exist for that cohort unless left blank."
        title="Students"
      />

      {viewMode === "add" ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text/60">New student</h2>

          <div className="mt-4 flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text/70">First name *</span>
                <input
                  className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text/70">Last name *</span>
                <input
                  className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">NIC number *</span>
              <input
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                value={form.nicNumber}
                onChange={(e) => setForm((f) => ({ ...f, nicNumber: e.target.value }))}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text/70">Phone</span>
                <input
                  className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text/70">Optional email</span>
                <input
                  className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                  type="email"
                  value={form.optionalEmail}
                  onChange={(e) => setForm((f) => ({ ...f, optionalEmail: e.target.value }))}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Profile status</span>
              <select
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
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

            <hr className="my-2 border-border" />

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Faculty *</span>
              <select
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
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

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Degree program *</span>
              <select
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
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

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Intake *</span>
              <select
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
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

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Stream *</span>
              <select
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
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

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">
                Subgroup (optional — pick existing cohort label)
              </span>
              <select
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
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

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Enrollment status</span>
              <select
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
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
              <Plus className="h-4 w-4" aria-hidden />
              Create student
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
