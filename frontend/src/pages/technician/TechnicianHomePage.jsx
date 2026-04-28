import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, CheckCircle2, ClipboardList } from "lucide-react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import AdminKpiGrid from "../../components/admin/AdminKpiGrid";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatTile from "../../components/admin/AdminStatTile";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getMyTickets } from "../../services/ticketService";
import { getTechnicianNotificationSummary } from "../../services/technicianWorkspaceService";
import { isActiveTicketStatus } from "../../utils/technicianTicketStatus";
import { toToken } from "../../utils/formatters";

function ticketDetailOrWorkspace(ticket) {
  const s = String(ticket?.status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (!ticket?.id) return "/technician/tickets";
  if (s === "IN_PROGRESS" || s === "ACCEPTED") {
    return `/technician/tickets/${ticket.id}/work`;
  }
  return `/technician/tickets/${ticket.id}`;
}

function formatTicketMeta(ticket) {
  const idShort = ticket?.id ? String(ticket.id).slice(0, 10) : "";
  const cat = [ticket?.categoryId, ticket?.subCategoryId].filter(Boolean).join(" · ");
  const bits = [];
  if (idShort) bits.push(idShort);
  if (cat) bits.push(cat);
  return bits.join(" · ") || "—";
}

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
        const [ticketsRes, alertSummary] = await Promise.all([
          getMyTickets(),
          getTechnicianNotificationSummary(),
        ]);
        if (!active) {
          return;
        }
        const ticketData = ticketsRes?.data;
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
    const openish = tickets.filter((t) => {
      const u = String(t.status || "").toUpperCase();
      return u !== "RESOLVED" && u !== "CLOSED" && u !== "WITHDRAWN";
    }).length;
    const inProgress = tickets.filter((t) => {
      const u = String(t.status || "").toUpperCase();
      return u === "IN_PROGRESS" || u === "ACCEPTED";
    }).length;
    const done = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;
    return { openish, inProgress, done };
  }, [tickets]);

  const resolvedPct = tickets.length ? Math.round((stats.done / tickets.length) * 100) : 0;
  const activePct = tickets.length ? Math.round((stats.openish / tickets.length) * 100) : 0;

  const activeTickets = useMemo(() => tickets.filter((t) => isActiveTicketStatus(t?.status)), [tickets]);
  const nextTicket = activeTickets[0];

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
        description="Assigned work: accept or decline on the ticket summary, then use the workspace to post updates and mark resolved."
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
          detail="Marked in progress"
          icon={AlertTriangle}
          label="In progress"
          value={stats.inProgress}
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
                  {activeTickets.length} active {activeTickets.length === 1 ? "ticket" : "tickets"}
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
                      ? `${formatTicketMeta(nextTicket)} · ${nextTicket.createdByUsername || "Reporter"} · ${nextTicket.status}`
                      : "The desk will route work here when assigned."}
                  </p>
                </article>
                <article className="rounded-2xl border border-border bg-tint p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    In progress
                  </p>
                  <p className="mt-2 font-semibold text-heading">
                    {stats.inProgress} in progress {stats.inProgress === 1 ? "ticket" : "tickets"}
                  </p>
                  <p className="mt-1 text-sm text-text/72">
                    {stats.inProgress
                      ? "Tickets currently marked in progress."
                      : "Nothing marked in progress yet."}
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

            <Card subtitle="Active work currently routed to you" title="Assigned tickets">
              <div className="space-y-3">
                {activeTickets.slice(0, 5).map((ticket) => (
                  <Link
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-tint/80 px-4 py-3 transition hover:bg-tint"
                    key={ticket.id}
                    to={ticketDetailOrWorkspace(ticket)}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-heading">{ticket.title}</p>
                      <p className="text-sm text-text/72">{formatTicketMeta(ticket)}</p>
                    </div>
                    <span className={`status-badge shrink-0 ${toToken(ticket.status)}`}>{ticket.status}</span>
                  </Link>
                ))}
                {!activeTickets.length ? (
                  <p className="text-sm text-text/70">
                    {tickets.length
                      ? "No active tickets — see Resolved for completed work."
                      : "No tickets are assigned to you yet."}
                  </p>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => navigate("/technician/tickets")} variant="secondary" type="button">
                  View full queue
                </Button>
                <Button onClick={() => navigate("/technician/resolved")} variant="secondary" type="button">
                  Resolved tickets
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
                  onClick={() => navigate("/technician/resolved")}
                >
                  Resolved
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
