import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Flame } from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import AdminKpiGrid from "../components/admin/AdminKpiGrid";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminStatTile from "../components/admin/AdminStatTile";
import LoadingSpinner from "../components/LoadingSpinner";
import { getManagedTickets, resolveTicket } from "../services/ticketService";
import { toToken } from "../utils/formatters";

function ManageTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setLoading(true);
      setError("");

      try {
        const data = await getManagedTickets();
        if (active) {
          setTickets(data);
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

    loadTickets();

    return () => {
      active = false;
    };
  }, []);

  const handleResolve = async (ticketId) => {
    try {
      await resolveTicket(ticketId);
      setTickets((previousTickets) =>
        previousTickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: "Resolved" } : ticket,
        ),
      );
    } catch (resolveError) {
      setError(resolveError.message);
    }
  };

  const resolvedTickets = tickets.filter((ticket) => ticket.status === "Resolved").length;
  const activeTickets = tickets.filter((ticket) => ticket.status !== "Resolved").length;
  const highPriorityTickets = tickets.filter((ticket) =>
    ["High", "Critical"].includes(ticket.priority),
  ).length;

  return (
    <>
      <AdminPageHeader
        description="Track and resolve operational incidents from the service desk queue."
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
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className="flex flex-col gap-4 rounded-2xl border border-border bg-tint/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-heading">{ticket.title}</p>
                          <p className="text-sm text-text/72">
                            {ticket.location} • {ticket.category}
                          </p>
                        </div>
                        <span className={`status-badge ${toToken(ticket.status)}`}>{ticket.status}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-text/72">
                        <span>{ticket.priority} priority</span>
                        <span>Assigned to {ticket.assignee}</span>
                        <span className="font-mono text-xs">{ticket.id}</span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-wrap gap-2 sm:flex-none sm:justify-end">
                      {ticket.status !== "Resolved" ? (
                        <Button onClick={() => handleResolve(ticket.id)} variant="primary">
                          Mark resolved
                        </Button>
                      ) : (
                        <span className="inline-flex rounded-full border border-border bg-tint px-2.5 py-1 text-xs font-semibold text-text/80">
                          Completed
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
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
