import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../../components/Button";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useAdminShell } from "../../context/AdminShellContext";
import * as catalogModuleService from "../../services/catalogModuleService";
import * as facultyService from "../../services/facultyService";
import * as degreeService from "../../services/lmsDegreeProgramService";

const TERM_CODES = [
  "Y1S1",
  "Y1S2",
  "Y2S1",
  "Y2S2",
  "Y3S1",
  "Y3S2",
  "Y4S1",
  "Y4S2",
];

function CatalogModulesAdminPage() {
  const { setActiveWindow } = useAdminShell();
  const [faculties, setFaculties] = useState([]);
  const [paged, setPaged] = useState({ items: [], page: 1, pageSize: 25, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const [degreesForFaculty, setDegreesForFaculty] = useState([]);

  const [viewMode, setViewMode] = useState("list");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    credits: 3,
    facultyCode: "",
    applicableTerms: ["Y1S1"],
    applicableDegrees: [],
    defaultSyllabusVersion: "NEW",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    facultyService.listFaculties().then(setFaculties).catch(() => setFaculties([]));
  }, []);

  const loadDegrees = useCallback(async (facultyCode) => {
    if (!facultyCode) {
      setDegreesForFaculty([]);
      return;
    }
    try {
      const data = await degreeService.listDegreePrograms({
        faculty: facultyCode,
        page: 1,
        pageSize: 100,
      });
      setDegreesForFaculty(data.items || []);
    } catch {
      setDegreesForFaculty([]);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await catalogModuleService.listCatalogModules({
        facultyCode: facultyFilter || undefined,
        page,
        pageSize,
      });
      setPaged(data);
    } catch (e) {
      setError(e.message || "Failed to load modules.");
    } finally {
      setLoading(false);
    }
  }, [facultyFilter, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (form.facultyCode) {
      loadDegrees(form.facultyCode);
    }
  }, [form.facultyCode, loadDegrees]);

  const openCreate = () => {
    setEditing(null);
    setError("");
    setForm({
      code: "",
      name: "",
      credits: 3,
      facultyCode: faculties[0]?.code || "",
      applicableTerms: ["Y1S1"],
      applicableDegrees: [],
      defaultSyllabusVersion: "NEW",
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
      credits: row.credits,
      facultyCode: row.facultyCode,
      applicableTerms: row.applicableTerms?.length ? row.applicableTerms : ["Y1S1"],
      applicableDegrees: row.applicableDegrees || [],
      defaultSyllabusVersion: row.defaultSyllabusVersion || "NEW",
    });
    setViewMode("form");
    setActiveWindow("Edit");
  };

  const cancelForm = () => {
    setViewMode("list");
    setActiveWindow("");
  };

  const toggleTerm = (t) => {
    setForm((f) => {
      const set = new Set(f.applicableTerms);
      if (set.has(t)) {
        set.delete(t);
      } else {
        set.add(t);
      }
      return { ...f, applicableTerms: Array.from(set) };
    });
  };

  const toggleDegree = (code) => {
    setForm((f) => {
      const set = new Set(f.applicableDegrees);
      if (set.has(code)) {
        set.delete(code);
      } else {
        set.add(code);
      }
      return { ...f, applicableDegrees: Array.from(set) };
    });
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    const payload = {
      code: form.code,
      name: form.name,
      credits: form.credits,
      facultyCode: form.facultyCode,
      applicableTerms: form.applicableTerms,
      applicableDegrees: form.applicableDegrees,
      defaultSyllabusVersion: form.defaultSyllabusVersion,
      outlineTemplate: [],
    };
    try {
      if (editing) {
        await catalogModuleService.updateCatalogModule(editing.code, {
          name: form.name,
          credits: form.credits,
          facultyCode: form.facultyCode,
          applicableTerms: form.applicableTerms,
          applicableDegrees: form.applicableDegrees,
          defaultSyllabusVersion: form.defaultSyllabusVersion,
          outlineTemplate: [],
        });
      } else {
        await catalogModuleService.createCatalogModule(payload);
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
    if (!window.confirm(`Soft-delete module ${row.code}?`)) {
      return;
    }
    setError("");
    try {
      await catalogModuleService.deleteCatalogModule(row.code);
      await load();
    } catch (e) {
      setError(e.message || "Delete failed.");
    }
  };

  const totalPages = Math.max(1, Math.ceil((paged.totalCount || 0) / (paged.pageSize || pageSize)));

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
              Add module
            </Button>
          ) : (
            <Button className="inline-flex items-center gap-2" onClick={cancelForm} type="button" variant="secondary">
              Cancel
            </Button>
          )
        }
        description="Catalog modules: faculty scope, applicable terms (Y1S1–Y4S2), and allowed degree codes."
        title="Module catalog"
      />

      {viewMode === "form" ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text/60">
            {editing ? "Edit module" : "New module"}
          </h2>
          <div className="mt-4 max-h-[min(80vh,720px)] space-y-4 overflow-y-auto pr-1">
          {!editing ? (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Module code</span>
              <input
                className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
                maxLength={10}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                value={form.code}
              />
            </label>
          ) : (
            <p className="text-sm text-text/70">
              Code: <strong className="text-heading">{editing.code}</strong>
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
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  facultyCode: e.target.value,
                  applicableDegrees: [],
                }))
              }
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
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Credits</span>
            <input
              className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
              max={30}
              min={1}
              onChange={(e) => setForm((f) => ({ ...f, credits: Number(e.target.value) }))}
              type="number"
              value={form.credits}
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
              Applicable terms
            </legend>
            <div className="flex flex-wrap gap-2">
              {TERM_CODES.map((t) => (
                <label key={t} className="inline-flex items-center gap-2 text-sm">
                  <input
                    checked={form.applicableTerms.includes(t)}
                    onChange={() => toggleTerm(t)}
                    type="checkbox"
                  />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
              Applicable degrees (same faculty)
            </legend>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-border p-3">
              {degreesForFaculty.length === 0 ? (
                <p className="text-sm text-text/60">Select a faculty with degree programs.</p>
              ) : (
                degreesForFaculty.map((d) => (
                  <label key={d.code} className="flex items-center gap-2 text-sm">
                    <input
                      checked={form.applicableDegrees.includes(d.code)}
                      onChange={() => toggleDegree(d.code)}
                      type="checkbox"
                    />
                    {d.code} — {d.name}
                  </label>
                ))
              )}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
              Default syllabus version
            </span>
            <select
              className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
              onChange={(e) => setForm((f) => ({ ...f, defaultSyllabusVersion: e.target.value }))}
              value={form.defaultSyllabusVersion}
            >
              <option value="OLD">OLD</option>
              <option value="NEW">NEW</option>
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
        <div className="flex flex-wrap gap-4 border-b border-border pb-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Faculty filter</span>
            <select
              className="h-12 min-w-[200px] rounded-2xl border border-border px-3"
              onChange={(e) => {
                setFacultyFilter(e.target.value);
                setPage(1);
              }}
              value={facultyFilter}
            >
              <option value="">All</option>
              {faculties.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.code}
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
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-[0.08em] text-text/60">
                  <th className="py-3 pr-4">Code</th>
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Faculty</th>
                  <th className="py-3 pr-4">Credits</th>
                  <th className="py-3 pr-4">Terms</th>
                  <th className="py-3 pr-4">Degrees</th>
                  <th className="py-3 pr-4">Syllabus</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.items.map((row) => (
                  <tr className="border-b border-border/70" key={row.code}>
                    <td className="py-3 pr-4 font-medium text-heading">{row.code}</td>
                    <td className="py-3 pr-4">{row.name}</td>
                    <td className="py-3 pr-4">{row.facultyCode}</td>
                    <td className="py-3 pr-4">{row.credits}</td>
                    <td className="py-3 pr-4 text-xs">{(row.applicableTerms || []).join(", ")}</td>
                    <td className="py-3 pr-4 text-xs">{(row.applicableDegrees || []).join(", ")}</td>
                    <td className="py-3 pr-4">{row.defaultSyllabusVersion}</td>
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

export default CatalogModulesAdminPage;
