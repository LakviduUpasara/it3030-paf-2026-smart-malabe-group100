import { useEffect, useState } from "react";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import api from "../../services/api";

/**
 * Read-only directory of active technicians, sourced from the admin ticket API
 * so callers see the same list the assignment dialog uses. No write actions here —
 * adding / removing technicians is an admin-only operation.
 */
function TechnicianTeamPage() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get("/admin/tickets/assignable-technicians");
        const payload = res?.data;
        const rows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        if (active) {
          setTechnicians(rows);
          setError("");
        }
      } catch (e) {
        if (active) {
          setError(
            e?.response?.data?.message ||
              e?.message ||
              "Unable to load technicians directory.",
          );
          setTechnicians([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card title="Technicians" subtitle="Active maintenance & operations contacts">
      {loading ? (
        <LoadingSpinner label="Loading technicians…" />
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : technicians.length === 0 ? (
        <p className="text-sm text-text/70">No technicians are currently available.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-tint/80 text-left text-xs font-semibold uppercase tracking-wide text-text/60">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {technicians.map((t) => (
                <tr key={t.id} className="align-top">
                  <td className="px-4 py-3 font-medium text-heading">{t.fullName || "—"}</td>
                  <td className="px-4 py-3 text-xs text-text/70">{t.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default TechnicianTeamPage;
