import { useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { createResource, getResources } from "../services/resourceService";
import { toToken } from "../utils/formatters";

const initialFilters = {
  type: "",
  location: "",
  minCapacity: "",
};

const initialCreateForm = {
  name: "",
  type: "LAB",
  capacity: "1",
  location: "",
  status: "ACTIVE",
  dayOfWeek: "MONDAY",
  startTime: "08:00",
  endTime: "10:00",
};

const resourceTypes = [
  "LECTURE_HALL",
  "LAB",
  "MEETING_ROOM",
  "EQUIPMENT",
];

const resourceStatuses = [
  "ACTIVE",
  "OUT_OF_SERVICE",
];

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

function ManageResourcesPage() {
  const [resources, setResources] = useState([]);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadResources() {
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

    loadResources();

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
    setCreateForm((previousState) => ({
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

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    const trimmedName = createForm.name.trim();
    const trimmedLocation = createForm.location.trim();
    const numericCapacity = Number(createForm.capacity);

    if (!trimmedName || !trimmedLocation) {
      setCreateError("Name and location are required.");
      return;
    }

    if (!Number.isFinite(numericCapacity) || numericCapacity < 1) {
      setCreateError("Capacity must be at least 1.");
      return;
    }

    if (!createForm.startTime || !createForm.endTime || createForm.endTime <= createForm.startTime) {
      setCreateError("End time must be after start time.");
      return;
    }

    setCreating(true);

    try {
      const createdResource = await createResource({
        name: trimmedName,
        type: createForm.type,
        capacity: numericCapacity,
        location: trimmedLocation,
        status: createForm.status,
        availabilityWindows: [
          {
            dayOfWeek: createForm.dayOfWeek,
            startTime: createForm.startTime,
            endTime: createForm.endTime,
          },
        ],
      });

      setCreateSuccess(`Resource "${createdResource.name}" created successfully.`);
      setCreateForm(initialCreateForm);
      setReloadKey((currentValue) => currentValue + 1);
    } catch (submitError) {
      setCreateError(submitError.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-stack">
      <Card
        title="Create Resource"
        subtitle="Add a new room, lab, meeting space, or equipment item"
      >
        {createError ? <p className="alert alert-error">{createError}</p> : null}
        {createSuccess ? <p className="alert alert-success">{createSuccess}</p> : null}

        <form className="form-grid" onSubmit={handleCreateSubmit}>
          <label className="field">
            <span>Name</span>
            <input
              name="name"
              onChange={handleCreateChange}
              placeholder="e.g. Engineering Lab A"
              required
              type="text"
              value={createForm.name}
            />
          </label>

          <label className="field">
            <span>Type</span>
            <select name="type" onChange={handleCreateChange} value={createForm.type}>
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
              onChange={handleCreateChange}
              required
              type="number"
              value={createForm.capacity}
            />
          </label>

          <label className="field">
            <span>Location</span>
            <input
              name="location"
              onChange={handleCreateChange}
              placeholder="e.g. Engineering Block"
              required
              type="text"
              value={createForm.location}
            />
          </label>

          <label className="field">
            <span>Status</span>
            <select name="status" onChange={handleCreateChange} value={createForm.status}>
              {resourceStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatEnumLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Available Day</span>
            <select name="dayOfWeek" onChange={handleCreateChange} value={createForm.dayOfWeek}>
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
              onChange={handleCreateChange}
              required
              type="time"
              value={createForm.startTime}
            />
          </label>

          <label className="field">
            <span>End Time</span>
            <input
              name="endTime"
              onChange={handleCreateChange}
              required
              type="time"
              value={createForm.endTime}
            />
          </label>

          <div className="inline-actions">
            <Button disabled={creating} type="submit" variant="primary">
              {creating ? "Creating..." : "Create Resource"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Manage Resources" subtitle="Rooms, labs, and movable campus assets">
        {listError ? <p className="alert alert-error">{listError}</p> : null}
        <form className="form-grid" onSubmit={handleFilterSubmit}>
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
            <span>Minimum Capacity</span>
            <input
              min="1"
              name="minCapacity"
              onChange={handleFilterChange}
              placeholder="e.g. 30"
              type="number"
              value={filters.minCapacity}
            />
          </label>

          <div className="inline-actions">
            <Button type="submit" variant="primary">
              Apply Filters
            </Button>
            <Button
              disabled={loading}
              onClick={handleFilterReset}
              type="button"
              variant="secondary"
            >
              Clear Filters
            </Button>
          </div>
        </form>

        <p className="supporting-text">
          Showing {resources.length} resource{resources.length === 1 ? "" : "s"}.
        </p>

        {loading ? <LoadingSpinner label="Loading resources..." /> : null}

        {!loading && !resources.length ? (
          <p className="empty-state">No resources matched the current filters.</p>
        ) : null}

        {!loading && resources.length ? (
          <div className="list-stack">
            {resources.map((resource) => (
              <article className="list-row align-start" key={resource.id}>
                <div>
                  <strong>{resource.name}</strong>
                  <p className="supporting-text">
                    {formatEnumLabel(resource.type)} | {resource.location}
                  </p>
                  <p className="supporting-text">Capacity: {resource.capacity}</p>
                  {resource.availabilityWindows?.length ? (
                    <p className="supporting-text">
                      Availability:{" "}
                      {resource.availabilityWindows.map(formatAvailabilityWindow).join(" | ")}
                    </p>
                  ) : null}
                </div>
                <span className={`status-badge ${getStatusToken(resource.status)}`}>
                  {formatEnumLabel(resource.status)}
                </span>
              </article>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default ManageResourcesPage;

