import { useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { getResources } from "../services/resourceService";
import { toToken } from "../utils/formatters";

const initialFilters = {
  type: "",
  location: "",
  minCapacity: "",
};

const resourceTypes = [
  "LECTURE_HALL",
  "LAB",
  "MEETING_ROOM",
  "EQUIPMENT",
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
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadResources() {
      setLoading(true);
      setError("");

      try {
        const data = await getResources(appliedFilters);
        if (active) {
          setResources(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
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
  }, [appliedFilters]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((previousState) => ({
      ...previousState,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(normalizeFilters(filters));
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters({});
  };

  return (
    <Card title="Manage Resources" subtitle="Rooms, labs, and movable campus assets">
      {error ? <p className="alert alert-error">{error}</p> : null}
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Type</span>
          <select name="type" onChange={handleChange} value={filters.type}>
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
            onChange={handleChange}
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
            onChange={handleChange}
            placeholder="e.g. 30"
            type="number"
            value={filters.minCapacity}
          />
        </label>

        <div className="inline-actions">
          <Button type="submit" variant="primary">
            Apply Filters
          </Button>
          <Button disabled={loading} onClick={handleReset} type="button" variant="secondary">
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
  );
}

export default ManageResourcesPage;

