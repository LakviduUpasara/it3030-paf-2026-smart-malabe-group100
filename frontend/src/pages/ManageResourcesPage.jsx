import { useEffect, useState } from "react";
import AdminWorkspaceLayout from "../components/AdminWorkspaceLayout";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { getResources } from "../services/resourceService";
import { toToken } from "../utils/formatters";

function ManageResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResources = async (isActive = () => true) => {
    setLoading(true);
    setError("");

    try {
      const data = await getResources();
      if (isActive()) {
        setResources(data);
      }
    } catch (loadError) {
      if (isActive()) {
        setError(loadError.message);
      }
    } finally {
      if (isActive()) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let active = true;
    loadResources(() => active);

    return () => {
      active = false;
    };
  }, []);

  const availableResources = resources.filter((resource) => resource.status === "Available").length;
  const reservedResources = resources.filter((resource) => resource.status === "Reserved").length;
  const maintenanceResources = resources.filter(
    (resource) => resource.status === "Maintenance",
  ).length;
  const resourceTypes = new Set(resources.map((resource) => resource.type)).size;
  const capacityTotal = resources.reduce(
    (total, resource) => total + Number(resource.capacity || 0),
    0,
  );

  return (
    <AdminWorkspaceLayout
      actions={
        <Button onClick={() => loadResources()} variant="primary">
          Refresh inventory
        </Button>
      }
      rail={
        <>
          <Card className="admin-panel-card admin-panel-card-compact">
            <div className="admin-rail-header">
              <strong>Portfolio mix</strong>
              <span>Inventory snapshot</span>
            </div>
            <div className="admin-breakdown-list">
              <div>
                <span>Resource types</span>
                <strong>{resourceTypes}</strong>
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
        </>
      }
      stats={[
        {
          label: "Total resources",
          value: resources.length,
          detail: `${availableResources} available now`,
          tone: "cool",
        },
        {
          label: "Reserved",
          value: reservedResources,
          detail: "Currently allocated to approved requests",
          tone: "warm",
        },
        {
          label: "Maintenance",
          value: maintenanceResources,
          detail: "Need admin visibility or technician follow-up",
          tone: "critical",
        },
      ]}
      subtitle="Review rooms, labs, and movable assets with a cleaner portfolio-style operations view."
      title="Resource Portfolio"
    >
      {error ? <p className="alert alert-error">{error}</p> : null}

      {loading ? (
        <Card className="admin-panel-card">
          <LoadingSpinner label="Loading resources..." />
        </Card>
      ) : (
        <Card className="admin-panel-card admin-table-card">
          <div className="admin-panel-header">
            <div>
              <p className="admin-panel-kicker">Managed inventory</p>
              <h3>Campus resources and assets</h3>
            </div>
          </div>

          <div className="admin-data-list">
            {resources.map((resource) => (
              <article className="admin-data-row" key={resource.id}>
                <div className="admin-data-main">
                  <div className="admin-data-titleblock">
                    <strong>{resource.name}</strong>
                    <p>
                      {resource.type} • {resource.location}
                    </p>
                  </div>
                  <div className="admin-data-meta">
                    <span>
                      Capacity <strong>{resource.capacity}</strong>
                    </span>
                    <span>Resource ID {resource.id}</span>
                  </div>
                </div>
                <span className={`status-badge ${toToken(resource.status)}`}>{resource.status}</span>
              </article>
            ))}
          </div>
        </Card>
      )}
    </AdminWorkspaceLayout>
  );
}

export default ManageResourcesPage;
