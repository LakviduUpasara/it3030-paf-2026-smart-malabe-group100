import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Flame } from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import AdminKpiGrid from "../components/admin/AdminKpiGrid";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminStatTile from "../components/admin/AdminStatTile";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  assignTicketOnDesk,
  getAssignableTechnicians,
  getManagedTickets,
} from "../services/ticketService";
import { toToken } from "../utils/formatters";

function ManageTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [assignSelection, setAssignSelection] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [ticketData, techData] = await Promise.all([getManagedTickets(), getAssignableTechnicians()]);
        if (active) {
          setTickets(Array.isArray(ticketData) ? ticketData : []);
          setTechnicians(Array.isArray(techData) ? techData : []);
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

    load();

    return () => {
      active = false;
    };
  }, []);

  const handleAssignChange = (ticketId, value) => {
    setAssignSelection((prev) => ({ ...prev, [ticketId]: value }));
  };

  const handleAssign = async (ticketId) => {
    const assigneeTechnicianId = assignSelection[ticketId];
    if (!assigneeTechnicianId) {
      return;
    }
    try {
      const updated = await assignTicketOnDesk(ticketId, assigneeTechnicianId);
      setTickets((previousTickets) =>
        previousTickets.map((ticket) => (ticket.id === ticketId ? updated : ticket)),
      );
    } catch (assignError) {
      setError(assignError.message);
    }
  };

  const resolvedTickets = tickets.filter((ticket) => ticket.status === "RESOLVED").length;
  const activeTickets = tickets.filter(
    (ticket) => ticket.status !== "RESOLVED" && ticket.status !== "CLOSED",
  ).length;
  const highPriorityTickets = tickets.filter((ticket) =>
    ["HIGH", "CRITICAL"].includes(ticket.priority),
  ).length;

  return (
    <>
      <AdminPageHeader
        description="Assign incidents to technicians; resolution happens in the technician workspace."
        title="Incident & ticket desk"
      />

      <AdminKpiGrid>
        <AdminStatTile
          detail="Still active in the queue"
          icon={AlertTriangle}
          label="Open workload"
          value={activeTickets}
        />
        <AdminStatTile
          detail="Completed responses"
          icon={CheckCircle2}
          label="Resolved"
          value={resolvedTickets}
        />
        <AdminStatTile
          detail="High and critical"
          icon={Flame}
          label="Priority incidents"
          value={highPriorityTickets}
        />
      </AdminKpiGrid>

      {error ? (
        <section
          className="rounded-3xl border border-border bg-tint p-5 shadow-shadow"
          role="alert"
        >
          <p className="text-sm font-semibold text-heading">Something went wrong</p>
          <p className="mt-1 text-sm text-text/70">{error}</p>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div>
          {loading ? (
            <Card title="Loading">
              <LoadingSpinner label="Loading managed tickets..." />
            </Card>
          ) : (
            <Card subtitle="Managed incident queue" title="Service operations">
              {!tickets.length ? (
                <p className="text-sm text-text/70">No incident tickets yet.</p>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <article
                      key={ticket.id}
                      className="flex flex-col gap-4 rounded-2xl border border-border bg-tint/80 p-4 lg:flex-row lg:items-start lg:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-heading">{ticket.title}</p>
                            <p className="text-sm text-text/72">
                              {ticket.location || "—"} • {ticket.category || "—"}
                            </p>
                          </div>
                          <span className={`status-badge ${toToken(ticket.status)}`}>{ticket.status}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-text/72">
                          <span>{ticket.priority} priority</span>
                          <span>
                            Assignee: {ticket.assigneeDisplayName || ticket.assigneeTechnicianId || "Unassigned"}
                          </span>
                          <span className="font-mono text-xs">{ticket.reference || ticket.id}</span>
                        </div>
                      </div>
                      <div className="flex w-full flex-col gap-2 lg:w-64">
                        <label className="text-xs font-semibold text-text/70" htmlFor={`assign-${ticket.id}`}>
                          Assign technician
                        </label>
                        <select
                          className="rounded-2xl border border-border bg-card px-3 py-2 text-sm"
                          id={`assign-${ticket.id}`}
                          onChange={(e) => handleAssignChange(ticket.id, e.target.value)}
                          value={assignSelection[ticket.id] ?? ""}
                        >
                          <option value="">Select…</option>
                          {technicians.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.fullName} ({tech.email})
                            </option>
                          ))}
                        </select>
                        <Button
                          disabled={!assignSelection[ticket.id]}
                          onClick={() => handleAssign(ticket.id)}
                          variant="primary"
                          type="button"
                        >
                          Save assignment
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-border bg-tint p-5">
          <p className="text-base font-semibold text-heading">Resolution focus</p>
          <p className="text-sm text-text/72">Current balance</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center sm:grid-cols-1">
            <div className="rounded-2xl border border-border bg-card p-3">
              <p className="text-xs text-text/60">Resolved</p>
              <p className="text-2xl font-semibold text-heading">{resolvedTickets}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3">
              <p className="text-xs text-text/60">Active</p>
              <p className="text-2xl font-semibold text-heading">{activeTickets}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3">
              <p className="text-xs text-text/60">High priority</p>
              <p className="text-2xl font-semibold text-heading">{highPriorityTickets}</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default ManageTicketsPage;
