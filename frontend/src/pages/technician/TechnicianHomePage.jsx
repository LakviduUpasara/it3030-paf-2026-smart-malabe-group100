import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, CheckCircle2, ClipboardList } from "lucide-react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import AdminKpiGrid from "../../components/admin/AdminKpiGrid";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatTile from "../../components/admin/AdminStatTile";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  getTechnicianNotificationSummary,
  listTechnicianTickets,
} from "../../services/technicianWorkspaceService";
import { toToken } from "../../utils/formatters";

function TechnicianHomePage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [ticketData, alertSummary] = await Promise.all([
          listTechnicianTickets(),
          getTechnicianNotificationSummary(),
        ]);
        if (!active) {
          return;
        }
        setTickets(Array.isArray(ticketData) ? ticketData : []);
        setUnreadAlerts(typeof alertSummary?.unreadCount === "number" ? alertSummary.unreadCount : 0);
      } catch (e) {
        if (active) {
          setError(e.message || "Failed to load desk.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const openish = tickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length;
    const urgent = tickets.filter((t) => t.priority === "HIGH" || t.priority === "CRITICAL").length;
    const done = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;
    return { openish, urgent, done };
  }, [tickets]);

  const resolvedPct = tickets.length ? Math.round((stats.done / tickets.length) * 100) : 0;
  const activePct = tickets.length ? Math.round((stats.openish / tickets.length) * 100) : 0;

  const nextTicket = tickets[0];

  return (
    <>
      <AdminPageHeader
        actions={
          <>
            <Button onClick={() => navigate("/technician/notifications")} variant="secondary" type="button">
              Alerts inbox
            </Button>
            <Button onClick={() => navigate("/technician/tickets")} variant="primary" type="button">
              Open queue
            </Button>
          </>
        }
        description="Assigned maintenance and incident work across the campus. Update status, add notes, and resolve from the ticket detail view."
        title="Technician operations desk"
      />

      {error ? (
        <section
          className="rounded-3xl border border-border bg-tint p-5 shadow-shadow"
          role="alert"
        >
          <p className="text-sm font-semibold text-heading">Unable to load desk</p>
          <p className="mt-1 text-sm text-text/70">{error}</p>
        </section>
      ) : null}

      <AdminKpiGrid>
        <AdminStatTile
          detail="Not resolved or closed"
          icon={ClipboardList}
          label="Active assignments"
          value={stats.openish}
        />
        <AdminStatTile
          detail="Needs priority attention"
          icon={AlertTriangle}
          label="High / critical"
          value={stats.urgent}
        />
        <AdminStatTile
          detail="Completed in your queue"
          icon={CheckCircle2}
          label="Resolved"
          value={stats.done}
        />
        <AdminStatTile
          detail="Technician notification feed"
          icon={Bell}
          label="Unread alerts"
          value={unreadAlerts}
        />
      </AdminKpiGrid>

      {loading ? (
        <Card title="Loading">
          <LoadingSpinner label="Loading technician desk..." />
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6 lg:space-y-8">
            <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-shadow">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    Live queue
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-heading">Work priorities</h2>
                  <p className="mt-1 text-sm text-text/72">
                    Next actions on assigned incidents and operational alerts.
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-border bg-tint px-2.5 py-1 text-xs font-semibold text-text">
                  {tickets.length} assigned {tickets.length === 1 ? "ticket" : "tickets"}
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <article className="rounded-2xl border border-border bg-tint p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    Next in queue
                  </p>
                  <p className="mt-2 font-semibold text-heading">
                    {nextTicket?.title || "No assignments yet"}
                  </p>
                  <p className="mt-1 text-sm text-text/72">
                    {nextTicket
                      ? `${nextTicket.reference ? `${nextTicket.reference} · ` : ""}${nextTicket.location || "—"} • ${nextTicket.status}`
                      : "The desk will route work here when assigned."}
                  </p>
                </article>
                <article className="rounded-2xl border border-border bg-tint p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    Urgent load
                  </p>
                  <p className="mt-2 font-semibold text-heading">
                    {stats.urgent} high-priority {stats.urgent === 1 ? "item" : "items"}
                  </p>
                  <p className="mt-1 text-sm text-text/72">
                    {stats.urgent
                      ? "Review and update these tickets first when possible."
                      : "No critical queue pressure right now."}
                  </p>
                </article>
                <article className="rounded-2xl border border-border bg-tint p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    Alerts
                  </p>
                  <p className="mt-2 font-semibold text-heading">{unreadAlerts} unread</p>
                  <p className="mt-1 text-sm text-text/72">
                    <Link className="font-medium text-heading underline-offset-2 hover:underline" to="/technician/notifications">
                      Open alerts inbox
                    </Link>
                  </p>
                </article>
              </div>
            </section>

            <Card subtitle="Everything currently routed to you" title="Assigned tickets">
              <div className="space-y-3">
                {tickets.slice(0, 5).map((ticket) => (
                  <Link
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-tint/80 px-4 py-3 transition hover:bg-tint"
                    key={ticket.id}
                    to={`/technician/tickets/${ticket.id}`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-heading">{ticket.title}</p>
                      <p className="text-sm text-text/72">
                        {ticket.reference ? `${ticket.reference} · ` : ""}
                        {ticket.location || "—"}
                      </p>
                    </div>
                    <span className={`status-badge shrink-0 ${toToken(ticket.status)}`}>{ticket.status}</span>
                  </Link>
                ))}
                {!tickets.length ? (
                  <p className="text-sm text-text/70">No tickets are assigned to you yet.</p>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => navigate("/technician/tickets")} variant="secondary" type="button">
                  View full queue
                </Button>
              </div>
            </Card>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-border bg-tint p-5">
              <p className="text-base font-semibold text-heading">Quick actions</p>
              <p className="text-sm text-text/72">Technician workspace</p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  className="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-heading transition-colors hover:bg-tint"
                  type="button"
                  onClick={() => navigate("/technician/tickets")}
                >
                  My tickets
                </button>
                <button
                  className="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-heading transition-colors hover:bg-tint"
                  type="button"
                  onClick={() => navigate("/technician/notifications")}
                >
                  Alerts inbox
                </button>
                <button
                  className="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-heading transition-colors hover:bg-tint"
                  type="button"
                  onClick={() => navigate("/technician")}
                >
                  Desk home
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-5 shadow-shadow">
              <p className="text-base font-semibold text-heading">Queue posture</p>
              <p className="text-sm text-text/72">Assignment overview</p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-text/72">Still active</span>
                    <span className="font-medium text-heading">{activePct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${activePct}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-text/72">Resolved</span>
                    <span className="font-medium text-heading">{resolvedPct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${resolvedPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}
    </>
  );
}

export default TechnicianHomePage;
