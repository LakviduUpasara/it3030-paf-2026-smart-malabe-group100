import { useEffect, useState } from "react";
import AdminWorkspaceLayout from "../components/AdminWorkspaceLayout";
import Button from "../components/Button";
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
  dayOfWeek: "MONDAY",
  startTime: "08:00",
  endTime: "10:00",
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
  const availabilityWindow = resource?.availabilityWindows?.[0];

  return {
    name: resource?.name || "",
    type: resource?.type || "LAB",
    capacity: String(resource?.capacity ?? 1),
    location: resource?.location || "",
    status: resource?.status || "ACTIVE",
    dayOfWeek: availabilityWindow?.dayOfWeek || "MONDAY",
    startTime: availabilityWindow?.startTime?.slice(0, 5) || "08:00",
    endTime: availabilityWindow?.endTime?.slice(0, 5) || "10:00",
  };
}

function buildResourcePayload(formState) {
  return {
    name: formState.name.trim(),
    type: formState.type,
    capacity: Number(formState.capacity),
    location: formState.location.trim(),
    status: formState.status,
    availabilityWindows: [
      {
        dayOfWeek: formState.dayOfWeek,
        startTime: formState.startTime,
        endTime: formState.endTime,
      },
    ],
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

        <label className="field">
          <span>Available Day</span>
          <select name="dayOfWeek" onChange={onChange} value={formState.dayOfWeek}>
            {daysOfWeek.map((day) => (
              <option key={day} value={day}>
                {formatEnumLabel(day)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Start Time</span>
          <input
            name="startTime"
            onChange={onChange}
            required
            type="time"
            value={formState.startTime}
          />
        </label>

        <label className="field">
          <span>End Time</span>
          <input
            name="endTime"
            onChange={onChange}
            required
            type="time"
            value={formState.endTime}
          />
        </label>
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

    if (
      !resourceForm.startTime ||
      !resourceForm.endTime ||
      resourceForm.endTime <= resourceForm.startTime
    ) {
      setFormError("End time must be after start time.");
      return;
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
    <AdminWorkspaceLayout
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
      rail={
        <Card className="admin-panel-card admin-panel-card-compact">
          <div className="admin-rail-header">
            <strong>Portfolio mix</strong>
            <span>Inventory snapshot</span>
          </div>
          <div className="admin-breakdown-list">
            <div>
              <span>Resource types</span>
              <strong>{resourceTypesCount}</strong>
            </div>
            <div>
              <span>Bookable capacity</span>
              <strong>{capacityTotal}</strong>
            </div>
            <div>
              <span>Maintenance blocked</span>
              <strong>{maintenanceResources}</strong>
            </div>
          </div>
        </Card>
      }
      stats={[
        {
          label: "Total resources",
          value: resources.length,
          detail: `${availableResources} available now`,
          tone: "cool",
        },
        {
          label: "Active",
          value: availableResources,
          detail: "Ready for scheduling",
          tone: "warm",
        },
        {
          label: "Maintenance",
          value: maintenanceResources,
          detail: "Out of service entries",
          tone: "critical",
        },
      ]}
      subtitle="Review rooms, labs, and movable assets with filters, CRUD actions, and a live portfolio snapshot."
      title="Resource Portfolio"
    >
      <div className="page-stack resource-management-page">
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
            onCancel={closeFormModal}
            onChange={handleCreateChange}
            onSubmit={handleResourceSubmit}
            submitLabel={modalMode === "edit" ? "Update Resource" : "Create Resource"}
            submitting={submitting}
          />
        </div>
      </Modal>
    </AdminWorkspaceLayout>
  );
}

export default ManageResourcesPage;
