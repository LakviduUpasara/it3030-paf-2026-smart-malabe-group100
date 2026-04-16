import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useAdminShell } from "../../context/AdminShellContext";
import * as facultyService from "../../services/facultyService";
import * as degreeService from "../../services/lmsDegreeProgramService";
import * as intakeService from "../../services/intakeService";
import * as moduleOfferingService from "../../services/moduleOfferingService";

const TERM_SEQUENCE = ["Y1S1", "Y1S2", "Y2S1", "Y2S2", "Y3S1", "Y3S2", "Y4S1", "Y4S2"];
const STATUSES = ["ACTIVE", "INACTIVE"];
const SORTS = [
  { value: "updated", label: "Updated" },
  { value: "module", label: "Module code" },
  { value: "term", label: "Term" },
];
const PAGE_SIZES = [10, 25, 50, 100];
const PRIMARY = "#034aa6";

function formatInstant(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

function ModuleOfferingsAdminPage() {
  const { setActiveWindow } = useAdminShell();

  useEffect(() => {
    setActiveWindow("List");
    return () => setActiveWindow("");
  }, [setActiveWindow]);

  const [faculties, setFaculties] = useState([]);
  const [filterFaculty, setFilterFaculty] = useState("");
  const [degreesFilter, setDegreesFilter] = useState([]);
  const [filterDegree, setFilterDegree] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formFaculty, setFormFaculty] = useState("");
  const [formDegrees, setFormDegrees] = useState([]);
  const [formDegree, setFormDegree] = useState("");
  const [formIntakes, setFormIntakes] = useState([]);
  const [formIntakeId, setFormIntakeId] = useState("");
  const [formTerm, setFormTerm] = useState("Y1S1");
  const [formModules, setFormModules] = useState([]);
  const [formModuleCode, setFormModuleCode] = useState("");
  const [formSyllabus, setFormSyllabus] = useState("NEW");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [formLecturers, setFormLecturers] = useState([]);
  const [formLabs, setFormLabs] = useState([]);
  const [selLecturerIds, setSelLecturerIds] = useState([]);
  const [selLabIds, setSelLabIds] = useState([]);

  useEffect(() => {
    facultyService.listFaculties().then(setFaculties).catch(() => setFaculties([]));
  }, []);

  useEffect(() => {
    if (!filterFaculty) {
      setDegreesFilter([]);
      setFilterDegree("");
      return;
    }
    degreeService
      .listDegreePrograms({ faculty: filterFaculty, status: "ACTIVE", page: 1, pageSize: 200 })
      .then((d) => setDegreesFilter(d.items || []))
      .catch(() => setDegreesFilter([]));
  }, [filterFaculty]);

  useEffect(() => {
    if (!formFaculty) {
      setFormDegrees([]);
      setFormDegree("");
      return;
    }
    degreeService
      .listDegreePrograms({ faculty: formFaculty, status: "ACTIVE", page: 1, pageSize: 200 })
      .then((d) => setFormDegrees(d.items || []))
      .catch(() => setFormDegrees([]));
  }, [formFaculty]);

  useEffect(() => {
    if (!formFaculty || !formDegree) {
      setFormIntakes([]);
      setFormIntakeId("");
      return;
    }
    intakeService
      .listIntakesPaged({
        page: 1,
        pageSize: 100,
        sort: "az",
        status: "ACTIVE",
        facultyCode: formFaculty,
        degreeCode: formDegree,
      })
      .then((d) => setFormIntakes(d.items || []))
      .catch(() => setFormIntakes([]));
  }, [formFaculty, formDegree]);

  useEffect(() => {
    if (!formFaculty || !formDegree || !formTerm) {
      setFormModules([]);
      setFormModuleCode("");
      return;
    }
    moduleOfferingService
      .listApplicableModules({
        facultyCode: formFaculty,
        degreeId: formDegree,
        term: formTerm,
      })
      .then((list) => {
        setFormModules(Array.isArray(list) ? list : []);
        setFormModuleCode("");
      })
      .catch(() => setFormModules([]));
  }, [formFaculty, formDegree, formTerm]);

  useEffect(() => {
    if (!formFaculty || !formDegree || !formModuleCode) {
      setFormLecturers([]);
      setFormLabs([]);
      setSelLecturerIds([]);
      setSelLabIds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [lec, lab] = await Promise.all([
          moduleOfferingService.eligibleLecturers({
            facultyCode: formFaculty,
            degreeCode: formDegree,
            moduleCode: formModuleCode,
          }),
          moduleOfferingService.eligibleLabAssistants({
            facultyCode: formFaculty,
            degreeCode: formDegree,
            moduleCode: formModuleCode,
          }),
        ]);
        if (!cancelled) {
          setFormLecturers(Array.isArray(lec) ? lec : []);
          setFormLabs(Array.isArray(lab) ? lab : []);
        }
      } catch {
        if (!cancelled) {
          setFormLecturers([]);
          setFormLabs([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formFaculty, formDegree, formModuleCode]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await moduleOfferingService.listModuleOfferings({
        page,
        pageSize,
        sort,
        facultyCode: filterFaculty || undefined,
        degreeCode: filterDegree || undefined,
        termCode: filterTerm || undefined,
        status: filterStatus || undefined,
        search: deferredSearch.trim() || undefined,
      });
      setItems(data.items || []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e.message || "Failed to load module offerings.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sort, filterFaculty, filterDegree, filterTerm, filterStatus, deferredSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setFormError("");
    setFormFaculty(filterFaculty || "");
    setFormDegree(filterDegree || "");
    setFormIntakeId("");
    setFormTerm(filterTerm || "Y1S1");
    setFormModuleCode("");
    setFormSyllabus("NEW");
    setFormStatus("ACTIVE");
    setSelLecturerIds([]);
    setSelLabIds([]);
    setModalOpen(true);
    setActiveWindow("Create");
  };

  const openEdit = async (row) => {
    setFormError("");
    setEditingId(row.id);
    setModalOpen(true);
    setActiveWindow("Edit");
    try {
      const full = await moduleOfferingService.getModuleOffering(row.id);
      setFormFaculty(full.faculty?.code || "");
      setFormDegree(full.degree?.code || "");
      setFormIntakeId(full.intake?.id || "");
      setFormTerm(full.termCode || "Y1S1");
      setFormModuleCode(full.module?.code || "");
      setFormSyllabus(full.syllabusVersion || "NEW");
      setFormStatus(full.status || "ACTIVE");
      setSelLecturerIds((full.lecturers || []).map((x) => x.id).filter(Boolean));
      setSelLabIds((full.labAssistants || []).map((x) => x.id).filter(Boolean));
    } catch (e) {
      setFormError(e.message || "Failed to load offering.");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setActiveWindow("List");
  };

  const toggleId = (list, setList, id) => {
    if (list.includes(id)) {
      setList(list.filter((x) => x !== id));
    } else {
      setList([...list, id]);
    }
  };

  const submitForm = async () => {
    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        facultyCode: formFaculty,
        degreeCode: formDegree,
        intakeId: formIntakeId,
        termCode: formTerm,
        moduleCode: formModuleCode,
        syllabusVersion: formSyllabus,
        status: formStatus,
        assignedLecturerIds: selLecturerIds,
        assignedLabAssistantIds: selLabIds,
      };
      if (editingId) {
        await moduleOfferingService.updateModuleOffering(editingId, payload);
      } else {
        await moduleOfferingService.createModuleOffering(payload);
      }
      closeModal();
      await load();
    } catch (e) {
      setFormError(e.message || "Save failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove offering for ${row.module?.code || row.id}?`)) return;
    try {
      await moduleOfferingService.deleteModuleOffering(row.id);
      await load();
    } catch (e) {
      setError(e.message || "Delete failed.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <AdminPageHeader
        title="Module offerings"
        description="Assign catalog modules to an intake cohort for a specific term. One offering per intake × term × module."
        actions={
          <Button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: PRIMARY }}
          >
            <Plus className="h-4 w-4" />
            Add offering
          </Button>
        }
      />

      <div
        className="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-sm"
        style={{ borderLeftWidth: 4, borderLeftColor: PRIMARY }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Filters</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Search</span>
            <input
              className="h-12 rounded-xl border border-border bg-background px-3 text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Module code or name"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Faculty</span>
            <select
              className="h-12 rounded-xl border border-border bg-background px-3 text-sm"
              value={filterFaculty}
              onChange={(e) => {
                setFilterFaculty(e.target.value);
                setFilterDegree("");
                setPage(1);
              }}
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
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Degree</span>
            <select
              className="h-12 rounded-xl border border-border bg-background px-3 text-sm"
              value={filterDegree}
              onChange={(e) => {
                setFilterDegree(e.target.value);
                setPage(1);
              }}
              disabled={!filterFaculty}
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
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Term</span>
            <select
              className="h-12 rounded-xl border border-border bg-background px-3 text-sm"
              value={filterTerm}
              onChange={(e) => {
                setFilterTerm(e.target.value);
                setPage(1);
              }}
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
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Status</span>
            <select
              className="h-12 rounded-xl border border-border bg-background px-3 text-sm"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
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
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Sort</span>
            <select
              className="h-12 rounded-xl border border-border bg-background px-3 text-sm"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
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
        <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-900 dark:text-rose-100">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-tint/40">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                Module
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                Faculty / Degree
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                Intake
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                Term
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                Syllabus
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                Staff
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                Updated
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-text/60">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-text/60">
                  No module offerings match the filters.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="hover:bg-tint/30">
                  <td className="px-3 py-2">
                    <div className="font-medium text-heading">{row.module?.code}</div>
                    <div className="text-xs text-text/70">{row.module?.name}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div>{row.faculty?.code}</div>
                    <div className="text-text/70">{row.degree?.code}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">{row.intake?.name || "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.termCode}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full border border-border bg-tint px-2 py-0.5 text-xs">
                      {row.syllabusVersion}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        row.status === "ACTIVE"
                          ? "rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-900 dark:text-emerald-100"
                          : "rounded-full border border-border px-2 py-0.5 text-xs"
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="max-w-[220px] px-3 py-2 text-xs text-text/80">
                    {(row.lecturers || []).length} lecturer
                    {(row.lecturers || []).length === 1 ? "" : "s"} · {(row.labAssistants || []).length} lab
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-text/70">
                    {formatInstant(row.updatedAt)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="mr-2 inline-flex rounded-lg p-1.5 text-text hover:bg-tint"
                      onClick={() => openEdit(row)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex rounded-lg p-1.5 text-rose-600 hover:bg-rose-500/10"
                      onClick={() => remove(row)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text/70">
          Page {page} of {totalPages} — {total} total
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-text/60">Rows</span>
            <select
              className="h-10 rounded-lg border border-border bg-background px-2 text-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit module offering" : "Add module offering"}
        panelClassName="max-w-2xl rounded-2xl"
      >
        <div className="space-y-4 p-1">
          {formError ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-900 dark:text-rose-100">
              {formError}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Faculty</span>
              <select
                className="h-12 rounded-xl border border-border bg-background px-3 text-sm"
                value={formFaculty}
                onChange={(e) => setFormFaculty(e.target.value)}
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
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Degree</span>
              <select
                className="h-12 rounded-xl border border-border bg-background px-3 text-sm"
                value={formDegree}
                onChange={(e) => setFormDegree(e.target.value)}
                disabled={!formFaculty}
              >
                <option value="">Select</option>
                {formDegrees.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Intake</span>
              <select
                className="h-12 rounded-xl border border-border bg-background px-3 text-sm"
                value={formIntakeId}
                onChange={(e) => setFormIntakeId(e.target.value)}
                disabled={!formDegree}
              >
                <option value="">Select intake</option>
                {formIntakes.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name || i.label || i.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Term</span>
              <select
                className="h-12 rounded-xl border border-border bg-background px-3 text-sm"
                value={formTerm}
                onChange={(e) => setFormTerm(e.target.value)}
              >
                {TERM_SEQUENCE.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Module</span>
              <select
                className="h-12 rounded-xl border border-border bg-background px-3 text-sm"
                value={formModuleCode}
                onChange={(e) => setFormModuleCode(e.target.value)}
                disabled={!formFaculty || !formDegree}
              >
                <option value="">Select module</option>
                {formModules.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} — {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Syllabus</span>
              <select
                className="h-12 rounded-xl border border-border bg-background px-3 text-sm"
                value={formSyllabus}
                onChange={(e) => setFormSyllabus(e.target.value)}
              >
                <option value="OLD">OLD</option>
                <option value="NEW">NEW</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Status</span>
              <select
                className="h-12 rounded-xl border border-border bg-background px-3 text-sm"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Lecturers</p>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border p-2 text-sm">
                {formLecturers.length === 0 ? (
                  <p className="text-text/60">Select faculty, degree, term, and module.</p>
                ) : (
                  formLecturers.map((l) => (
                    <label key={l.id} className="flex cursor-pointer items-center gap-2 py-0.5">
                      <input
                        type="checkbox"
                        checked={selLecturerIds.includes(l.id)}
                        onChange={() => toggleId(selLecturerIds, setSelLecturerIds, l.id)}
                      />
                      <span>{l.fullName || l.id}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Lab assistants</p>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border p-2 text-sm">
                {formLabs.length === 0 ? (
                  <p className="text-text/60">Select faculty, degree, term, and module.</p>
                ) : (
                  formLabs.map((l) => (
                    <label key={l.id} className="flex cursor-pointer items-center gap-2 py-0.5">
                      <input
                        type="checkbox"
                        checked={selLabIds.includes(l.id)}
                        onChange={() => toggleId(selLabIds, setSelLabIds, l.id)}
                      />
                      <span>{l.fullName || l.id}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitForm}
              disabled={submitting || !formFaculty || !formDegree || !formIntakeId || !formModuleCode}
              className="rounded-xl px-4 py-2.5 text-white"
              style={{ backgroundColor: PRIMARY }}
            >
              {submitting ? "Saving…" : editingId ? "Save changes" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ModuleOfferingsAdminPage;
