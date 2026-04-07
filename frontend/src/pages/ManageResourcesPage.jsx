import { useEffect, useState } from "react";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { getResources } from "../services/resourceService";
import { toToken } from "../utils/formatters";

function ManageResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadResources() {
      setLoading(true);
      setError("");

      try {
        const data = await getResources();
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
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading resources..." />;
  }

  return (
    <Card title="Manage Resources" subtitle="Rooms, labs, and movable campus assets">
      {error ? <p className="alert alert-error">{error}</p> : null}
      <div className="list-stack">
        {resources.map((resource) => (
          <article className="list-row" key={resource.id}>
            <div>
              <strong>{resource.name}</strong>
              <p className="supporting-text">
                {resource.type} | {resource.location}
              </p>
              <p className="supporting-text">Capacity: {resource.capacity}</p>
            </div>
            <span className={`status-badge ${toToken(resource.status)}`}>
              {resource.status}
            </span>
          </article>
        ))}
      </div>
    </Card>
  );
}

export default ManageResourcesPage;

