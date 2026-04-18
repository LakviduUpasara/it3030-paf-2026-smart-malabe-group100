import { useEffect, useState } from "react";
import { Boxes, ShieldAlert, Wrench } from "lucide-react";
import Button from "../components/Button";
import AdminKpiGrid from "../components/admin/AdminKpiGrid";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminStatTile from "../components/admin/AdminStatTile";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import {
  createResource,
  deleteResource,
  getResources,
  updateResource,
} from "../services/resourceService";
import { toToken } from "../utils/formatters";

const initialFilters = {
  type: "",
  location: "",
  minCapacity: "",
};

const initialResourceForm = {
  name: "",
  type: "LAB",
  capacity: "1",
  location: "",
  status: "ACTIVE",
  templateStartTime: "09:00",
  templateEndTime: "17:00",
  calendarPickDate: "",
  availabilityWindows: [{ dayOfWeek: "MONDAY", startTime: "09:00", endTime: "17:00" }],
};

const resourceTypes = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"];

const resourceStatuses = ["ACTIVE", "OUT_OF_SERVICE"];

const daysOfWeek = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function formatEnumLabel(value = "") {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatAvailabilityWindow(window) {
  const startTime = window.startTime?.slice(0, 5);
  const endTime = window.endTime?.slice(0, 5);
  return `${formatEnumLabel(window.dayOfWeek)} ${startTime} - ${endTime}`;
}

function getStatusToken(status) {
  if (status === "ACTIVE") {
    return "available";
  }

  if (status === "OUT_OF_SERVICE") {
    return "maintenance";
  }

  return toToken(status);
}

function normalizeFilters(filters) {
  const normalizedFilters = {};
  const trimmedLocation = filters.location.trim();

  if (filters.type) {
    normalizedFilters.type = filters.type;
  }

  if (trimmedLocation) {
    normalizedFilters.location = trimmedLocation;
  }

  if (filters.minCapacity !== "") {
    normalizedFilters.minCapacity = Number(filters.minCapacity);
  }

  return normalizedFilters;
}

function buildFormState(resource) {
  const windows =
    resource?.availabilityWindows?.length > 0
      ? resource.availabilityWindows.map((w) => ({
          dayOfWeek: w.dayOfWeek,
          startTime: w.startTime?.slice(0, 5) || "09:00",
          endTime: w.endTime?.slice(0, 5) || "17:00",
        }))
      : [{ dayOfWeek: "MONDAY", startTime: "09:00", endTime: "17:00" }];

  return {
    name: resource?.name || "",
    type: resource?.type || "LAB",
    capacity: String(resource?.capacity ?? 1),
    location: resource?.location || "",
    status: resource?.status || "ACTIVE",
    templateStartTime: windows[0].startTime,
    templateEndTime: windows[0].endTime,
    calendarPickDate: "",
    availabilityWindows: windows,
  };
}

function windowKey(w) {
  return `${w.dayOfWeek}|${w.startTime}|${w.endTime}`;
}

/** Local calendar date string YYYY-MM-DD -> Java DayOfWeek enum name */
function getTodayIsoDate() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function dateStringToDayOfWeek(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const map = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  return map[dt.getDay()];
}

function buildResourcePayload(formState) {
  return {
    name: formState.name.trim(),
    type: formState.type,
    capacity: Number(formState.capacity),
    location: formState.location.trim(),
    status: formState.status,
    availabilityWindows: formState.availabilityWindows.map((w) => ({
      dayOfWeek: w.dayOfWeek,
      startTime: w.startTime,
      endTime: w.endTime,
    })),
  };
}

function ResourceForm({
  formState,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
  error,
  minCalendarDate,
  onAddWeekdayFromCalendar,
  onAddWeekdaysMonFri,
  onUpdateAvailabilityWindow,
  onRemoveAvailabilityWindow,
}) {
  return (
    <form className="form-grid resource-form-shell" onSubmit={onSubmit}>
      {error ? <p className="alert alert-error">{error}</p> : null}

      <div className="resource-form-fields">
        <label className="field">
          <span>Name</span>
          <input
            name="name"
            onChange={onChange}
            placeholder="e.g. Engineering Lab A"
            required
            type="text"
            value={formState.name}
          />
        </label>

        <label className="field">
          <span>Type</span>
          <select name="type" onChange={onChange} value={formState.type}>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {formatEnumLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Capacity</span>
          <input
            min="1"
            name="capacity"
            onChange={onChange}
            required
            type="number"
            value={formState.capacity}
          />
        </label>

        <label className="field">
          <span>Location</span>
          <input
            name="location"
            onChange={onChange}
            placeholder="e.g. Engineering Block"
            required
            type="text"
            value={formState.location}
          />
        </label>

        <label className="field">
          <span>Status</span>
          <select name="status" onChange={onChange} value={formState.status}>
            {resourceStatuses.map((status) => (
              <option key={status} value={status}>
                {formatEnumLabel(status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="resource-form-fields border-t border-border/60 pt-4 mt-2">
        <p className="supporting-text col-span-full mb-2">
          <strong>Weekly availability</strong> — times must fall inside these windows for bookings and
          availability checks (same rules as <code className="text-xs">GET /api/v1/bookings/check</code>).
        </p>

        <label className="field">
          <span>Default hours (for calendar / Mon–Fri quick add)</span>
          <div className="flex flex-wrap gap-2">
            <input
              name="templateStartTime"
              onChange={onChange}
              type="time"
              value={formState.templateStartTime}
            />
            <span className="self-center text-text/60">to</span>
            <input
              name="templateEndTime"
              onChange={onChange}
              type="time"
              value={formState.templateEndTime}
            />
          </div>
        </label>

        <label className="field">
          <span>Add weekday from calendar</span>
          <div className="flex flex-wrap items-end gap-2">
            <input
              min={minCalendarDate}
              name="calendarPickDate"
              onChange={onChange}
              type="date"
              value={formState.calendarPickDate}
            />
            <Button disabled={submitting} onClick={onAddWeekdayFromCalendar} type="button" variant="secondary">
              Add this weekday
            </Button>
            <Button disabled={submitting} onClick={onAddWeekdaysMonFri} type="button" variant="secondary">
              Mon–Fri (template hours)
            </Button>
          </div>
          <p className="supporting-text mt-1">Calendar is today onward only (same as resource availability).</p>
        </label>

        <div className="field col-span-full">
          <span>Scheduled windows</span>
          <ul className="mt-2 space-y-2 rounded-lg border border-border/80 bg-tint/40 p-3">
            {formState.availabilityWindows.map((w, index) => (
              <li
                className="flex flex-wrap items-center gap-2 text-sm"
                key={`${windowKey(w)}-${index}`}
              >
                <select
                  className="rounded border border-border px-2 py-1"
                  onChange={(e) => onUpdateAvailabilityWindow(index, "dayOfWeek", e.target.value)}
                  value={w.dayOfWeek}
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {formatEnumLabel(day)}
                    </option>
                  ))}
                </select>
                <input
                  className="rounded border border-border px-2 py-1"
                  onChange={(e) => onUpdateAvailabilityWindow(index, "startTime", e.target.value)}
                  type="time"
                  value={w.startTime}
                />
                <span className="text-text/50">–</span>
                <input
                  className="rounded border border-border px-2 py-1"
                  onChange={(e) => onUpdateAvailabilityWindow(index, "endTime", e.target.value)}
                  type="time"
                  value={w.endTime}
                />
                <Button
                  disabled={submitting || formState.availabilityWindows.length < 2}
                  onClick={() => onRemoveAvailabilityWindow(index)}
                  type="button"
                  variant="ghost"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="resource-form-actions">
        <Button disabled={submitting} onClick={onCancel} type="button" variant="secondary">
          Cancel
        </Button>
        <Button disabled={submitting} type="submit" variant="primary">
          {submitting ? `${submitLabel}...` : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function ManageResourcesPage() {
  const [resources, setResources] = useState([]);
  const [resourceForm, setResourceForm] = useState(initialResourceForm);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [reloadKey, setReloadKey] = useState(0);
  const [modalMode, setModalMode] = useState("create");
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setListError("");

      try {
        const data = await getResources(appliedFilters);
        if (active) {
          setResources(data);
        }
      } catch (loadError) {
        if (active) {
          setListError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [appliedFilters, reloadKey]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previousState) => ({
      ...previousState,
      [name]: value,
    }));
  };

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setResourceForm((previousState) => ({
      ...previousState,
      [name]: value,
    }));
  };

  const handleAddWeekdayFromCalendar = () => {
    setFormError("");
    const today = getTodayIsoDate();
    if (!resourceForm.calendarPickDate) {
      setFormError("Pick a date on the calendar first.");
      return;
    }
    if (resourceForm.calendarPickDate < today) {
      setFormError("Past dates cannot be used — pick today or later.");
      return;
    }
    const dow = dateStringToDayOfWeek(resourceForm.calendarPickDate);
    const row = {
      dayOfWeek: dow,
      startTime: resourceForm.templateStartTime,
      endTime: resourceForm.templateEndTime,
    };
    if (resourceForm.availabilityWindows.some((w) => windowKey(w) === windowKey(row))) {
      setFormError("That weekday and time range is already listed.");
      return;
    }
    setResourceForm((previousState) => ({
      ...previousState,
      availabilityWindows: [...previousState.availabilityWindows, row],
    }));
  };

  const handleAddWeekdaysMonFri = () => {
    setFormError("");
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    setResourceForm((previousState) => {
      let next = [...previousState.availabilityWindows];
      for (const d of days) {
        const row = {
          dayOfWeek: d,
          startTime: previousState.templateStartTime,
          endTime: previousState.templateEndTime,
        };
        if (!next.some((w) => windowKey(w) === windowKey(row))) {
          next.push(row);
        }
      }
      return { ...previousState, availabilityWindows: next };
    });
  };

  const handleUpdateAvailabilityWindow = (index, field, value) => {
    setResourceForm((previousState) => ({
      ...previousState,
      availabilityWindows: previousState.availabilityWindows.map((w, i) =>
        i === index ? { ...w, [field]: value } : w,
      ),
    }));
  };

  const handleRemoveAvailabilityWindow = (index) => {
    setResourceForm((previousState) => ({
      ...previousState,
      availabilityWindows: previousState.availabilityWindows.filter((_, i) => i !== index),
    }));
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(normalizeFilters(filters));
  };

  const handleFilterReset = () => {
    setFilters(initialFilters);
    setAppliedFilters({});
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingResourceId(null);
    setResourceForm(initialResourceForm);
    setFormError("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (resource) => {
    setModalMode("edit");
    setEditingResourceId(resource.id);
    setResourceForm(buildFormState(resource));
    setFormError("");
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    if (submitting) {
      return;
    }

    setIsFormModalOpen(false);
    setFormError("");
  };

  const refreshResources = () => {
    setReloadKey((currentValue) => currentValue + 1);
  };

  const handleResourceSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setActionError("");
    setActionSuccess("");

    const trimmedName = resourceForm.name.trim();
    const trimmedLocation = resourceForm.location.trim();
    const numericCapacity = Number(resourceForm.capacity);

    if (!trimmedName || !trimmedLocation) {
      setFormError("Name and location are required.");
      return;
    }

    if (!Number.isFinite(numericCapacity) || numericCapacity < 1) {
      setFormError("Capacity must be at least 1.");
      return;
    }

    if (!resourceForm.availabilityWindows.length) {
      setFormError("Add at least one availability window.");
      return;
    }

    if (
      !resourceForm.templateStartTime ||
      !resourceForm.templateEndTime ||
      resourceForm.templateEndTime <= resourceForm.templateStartTime
    ) {
      setFormError("Default hours: end time must be after start time.");
      return;
    }

    for (const w of resourceForm.availabilityWindows) {
      if (!w.startTime || !w.endTime || w.endTime <= w.startTime) {
        setFormError("Each availability window needs an end time after its start time.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = buildResourcePayload(resourceForm);

      if (modalMode === "edit" && editingResourceId !== null) {
        const updatedResource = await updateResource(editingResourceId, payload);
        setActionSuccess(`Resource "${updatedResource.name}" updated successfully.`);
      } else {
        const createdResource = await createResource(payload);
        setActionSuccess(`Resource "${createdResource.name}" created successfully.`);
      }

      setResourceForm(initialResourceForm);
      setIsFormModalOpen(false);
      refreshResources();
    } catch (submitError) {
      setFormError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resource) => {
    const confirmed = window.confirm(`Delete resource "${resource.name}"?`);
    if (!confirmed) {
      return;
    }

    setActionError("");
    setActionSuccess("");
    setDeletingId(resource.id);

    try {
      await deleteResource(resource.id);
      setActionSuccess(`Resource "${resource.name}" deleted successfully.`);
      refreshResources();
    } catch (deleteError) {
      setActionError(deleteError.message);
    } finally {
      setDeletingId(null);
    }
  };

  const availableResources = resources.filter((resource) => resource.status === "ACTIVE").length;
  const maintenanceResources = resources.filter((resource) => resource.status === "OUT_OF_SERVICE")
    .length;
  const resourceTypesCount = new Set(resources.map((resource) => resource.type)).size;
  const capacityTotal = resources.reduce(
    (total, resource) => total + Number(resource.capacity || 0),
    0,
  );

  return (
    <>
      <AdminPageHeader
        actions={
          <>
            <Button onClick={refreshResources} variant="secondary" type="button">
              Refresh inventory
            </Button>
            <Button className="resource-primary-action" onClick={openCreateModal} variant="primary">
              New resource
            </Button>
          </>
        }
        description="Review rooms, labs, and movable assets with filters, CRUD actions, and a live portfolio snapshot."
        title="Resource portfolio"
      />

      <AdminKpiGrid>
        <AdminStatTile
          detail={`${availableResources} available now`}
          icon={Boxes}
          label="Total resources"
          value={resources.length}
        />
        <AdminStatTile
          detail="Ready for scheduling"
          icon={Wrench}
          label="Active"
          value={availableResources}
        />
        <AdminStatTile
          detail="Out of service"
          icon={ShieldAlert}
          label="Maintenance"
          value={maintenanceResources}
        />
      </AdminKpiGrid>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="page-stack resource-management-page min-w-0">
        <Card
          className="resource-management-card admin-panel-card"
          title="Manage Resources"
          subtitle="Browse, filter, create, update, and remove catalogue entries"
        >
          <div className="resource-feedback-stack">
            {listError ? <p className="alert alert-error">{listError}</p> : null}
            {actionError ? <p className="alert alert-error">{actionError}</p> : null}
            {actionSuccess ? <p className="alert alert-success">{actionSuccess}</p> : null}
          </div>

          <section className="resource-filter-section">
            <div className="resource-section-head">
              <div>
                <strong>Filter catalogue</strong>
                <p className="supporting-text">
                  Narrow the resource list by type, location, and minimum capacity.
                </p>
              </div>
            </div>

            <form className="form-grid resource-filter-grid" onSubmit={handleFilterSubmit}>
              <label className="field">
                <span>Type</span>
                <select name="type" onChange={handleFilterChange} value={filters.type}>
                  <option value="">All resource types</option>
                  {resourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatEnumLabel(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Location</span>
                <input
                  name="location"
                  onChange={handleFilterChange}
                  placeholder="Search by location"
                  type="text"
                  value={filters.location}
                />
              </label>

              <label className="field">
                <span>Minimum capacity</span>
                <input
                  min="1"
                  name="minCapacity"
                  onChange={handleFilterChange}
                  placeholder="e.g. 30"
                  type="number"
                  value={filters.minCapacity}
                />
              </label>

              <div className="inline-actions resource-filter-actions">
                <Button type="submit" variant="primary">
                  Apply filters
                </Button>
                <Button disabled={loading} onClick={handleFilterReset} type="button" variant="secondary">
                  Clear filters
                </Button>
              </div>
            </form>
          </section>

          <section className="resource-results-section">
            <div className="resource-results-head">
              <p className="supporting-text">
                Showing {resources.length} resource{resources.length === 1 ? "" : "s"}.
              </p>
            </div>

            {loading ? <LoadingSpinner label="Loading resources..." /> : null}

            {!loading && !resources.length ? (
              <p className="empty-state">No resources matched the current filters.</p>
            ) : null}

            {!loading && resources.length ? (
              <div className="resource-card-grid">
                {resources.map((resource) => (
                  <Card
                    actions={
                      <div className="inline-actions resource-card-actions">
                        <Button onClick={() => openEditModal(resource)} variant="secondary">
                          Edit
                        </Button>
                        <Button
                          disabled={deletingId === resource.id}
                          onClick={() => handleDelete(resource)}
                          variant="ghost"
                        >
                          {deletingId === resource.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    }
                    className="resource-item-card"
                    key={resource.id}
                    subtitle={`${formatEnumLabel(resource.type)} | ${resource.location}`}
                    title={resource.name}
                  >
                    <div className="resource-card-content">
                      <div className="resource-card-meta">
                        <p className="supporting-text">Capacity: {resource.capacity}</p>
                        {resource.availabilityWindows?.length ? (
                          <p className="supporting-text resource-availability">
                            Availability:{" "}
                            {resource.availabilityWindows.map(formatAvailabilityWindow).join(" | ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="resource-card-footer">
                        <span className={`status-badge ${getStatusToken(resource.status)}`}>
                          {formatEnumLabel(resource.status)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : null}
          </section>
        </Card>
        </div>

        <aside className="h-fit rounded-3xl border border-border bg-tint p-5">
          <p className="text-base font-semibold text-heading">Portfolio mix</p>
          <p className="text-sm text-text/72">Inventory snapshot</p>
          <div className="mt-4 space-y-3 border-t border-border/60 pt-4 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-text/72">Resource types</span>
              <span className="font-semibold text-heading">{resourceTypesCount}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-text/72">Bookable capacity</span>
              <span className="font-semibold text-heading">{capacityTotal}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-text/72">Maintenance blocked</span>
              <span className="font-semibold text-heading">{maintenanceResources}</span>
            </div>
          </div>
        </aside>
      </div>

      <Modal
        contentClassName="resource-modal-content"
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        panelClassName="resource-modal-panel"
        title={modalMode === "edit" ? "Edit Resource" : "Create Resource"}
      >
        <div className="resource-modal-body">
          <p className="supporting-text resource-modal-copy">
            {modalMode === "edit"
              ? "Update the selected resource and save the changes."
              : "Add a new room, lab, meeting space, or equipment item."}
          </p>
          <ResourceForm
            error={formError}
            formState={resourceForm}
            minCalendarDate={getTodayIsoDate()}
            onAddWeekdayFromCalendar={handleAddWeekdayFromCalendar}
            onAddWeekdaysMonFri={handleAddWeekdaysMonFri}
            onCancel={closeFormModal}
            onChange={handleCreateChange}
            onRemoveAvailabilityWindow={handleRemoveAvailabilityWindow}
            onSubmit={handleResourceSubmit}
            onUpdateAvailabilityWindow={handleUpdateAvailabilityWindow}
            submitLabel={modalMode === "edit" ? "Update Resource" : "Create Resource"}
            submitting={submitting}
          />
        </div>
      </Modal>
    </>
  );
}

export default ManageResourcesPage;
