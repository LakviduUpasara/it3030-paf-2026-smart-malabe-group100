import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardCheck,
  MapPin,
  Package,
} from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import AdminKpiGrid from "../components/admin/AdminKpiGrid";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminStatTile from "../components/admin/AdminStatTile";
import LoadingSpinner from "../components/LoadingSpinner";
import { getPendingBookings } from "../services/bookingService";
import { getResources } from "../services/resourceService";
import { getManagedTickets } from "../services/ticketService";
import { toToken } from "../utils/formatters";

const initialSummary = {
  resources: [],
  bookings: [],
  tickets: [],
};

function resourceIsAvailable(resource) {
  const s = String(resource?.status ?? "").toUpperCase();
  return s === "ACTIVE" || s === "AVAILABLE" || resource.status === "Available";
}

function resourceIsMaintenance(resource) {
  const s = String(resource?.status ?? "").toUpperCase();
  return (
    s === "OUT_OF_SERVICE" ||
    s === "MAINTENANCE" ||
    resource.status === "Maintenance"
  );
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAdminSummary() {
      setLoading(true);
      setError("");

      try {
        const [resources, bookings, tickets] = await Promise.all([
          getResources(),
          getPendingBookings(),
          getManagedTickets(),
        ]);

        if (active) {
          setSummary({
            resources,
            bookings,
            tickets,
          });
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

    loadAdminSummary();

    return () => {
      active = false;
    };
  }, []);

  const availableResources = summary.resources.filter(resourceIsAvailable).length;
  const maintenanceResources = summary.resources.filter(resourceIsMaintenance).length;
  const resolvedTickets = summary.tickets.filter((ticket) => ticket.status === "Resolved").length;
  const urgentTickets = summary.tickets.filter(
    (ticket) => ["High", "Critical"].includes(ticket.priority) && ticket.status !== "Resolved",
  ).length;
  const pendingAttendees = summary.bookings.reduce(
    (total, booking) => total + Number(booking.attendees || 0),
    0,
  );
  const trackedLocations = new Set(summary.resources.map((resource) => resource.location)).size;

  const availPct = summary.resources.length
    ? Math.round((availableResources / summary.resources.length) * 100)
    : 0;
  const resolvedPct = summary.tickets.length
    ? Math.round((resolvedTickets / summary.tickets.length) * 100)
    : 0;

  return (
    <>
      <AdminPageHeader
        actions={
          <>
            <Button onClick={() => navigate("/admin/bookings")} variant="secondary" type="button">
              Review approvals
            </Button>
            <Button onClick={() => navigate("/admin/resources")} variant="primary" type="button">
              Open resources
            </Button>
          </>
        }
        description="Monitor approvals, resource availability, and operational support from one control center."
        title="Campus operations"
      />

      {error ? (
        <section
          className="rounded-3xl border border-border bg-tint p-5 shadow-shadow"
          role="alert"
        >
          <p className="text-sm font-semibold text-heading">Unable to load summary</p>
          <p className="mt-1 text-sm text-text/70">{error}</p>
        </section>
      ) : null}

      <AdminKpiGrid>
        <AdminStatTile
          detail={`${availableResources} ready for booking`}
          icon={Package}
          label="Tracked assets"
          value={summary.resources.length}
        />
        <AdminStatTile
          detail={`${pendingAttendees} attendees waiting`}
          icon={ClipboardCheck}
          label="Pending approvals"
          value={summary.bookings.length}
        />
        <AdminStatTile
          detail={`${urgentTickets} need rapid attention`}
          icon={AlertTriangle}
          label="Open incidents"
          value={summary.tickets.length - resolvedTickets}
        />
        <AdminStatTile
          detail="Resource visibility"
          icon={MapPin}
          label="Campus coverage"
          value={trackedLocations}
        />
      </AdminKpiGrid>

      {loading ? (
        <Card title="Loading">
          <LoadingSpinner label="Loading admin dashboard..." />
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6 lg:space-y-8">
            <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-shadow">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    Live queues
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-heading">Operational priorities</h2>
                  <p className="mt-1 text-sm text-text/72">
                    Snapshot of the next actions across bookings and incidents.
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-border bg-tint px-2.5 py-1 text-xs font-semibold text-text">
                  {summary.bookings.length} approval items
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <article className="rounded-2xl border border-border bg-tint p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    Booking queue
                  </p>
                  <p className="mt-2 font-semibold text-heading">
                    {summary.bookings[0]?.facility || "No pending requests"}
                  </p>
                  <p className="mt-1 text-sm text-text/72">
                    {summary.bookings[0]
                      ? `${summary.bookings[0].requestedBy} • ${summary.bookings[0].time}`
                      : "All booking requests are up to date."}
                  </p>
                </article>
                <article className="rounded-2xl border border-border bg-tint p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    Incident escalation
                  </p>
                  <p className="mt-2 font-semibold text-heading">
                    {summary.tickets[0]?.title || "No incidents in queue"}
                  </p>
                  <p className="mt-1 text-sm text-text/72">
                    {summary.tickets[0]
                      ? `${summary.tickets[0].location} • ${summary.tickets[0].priority} priority`
                      : "No unresolved incidents at the moment."}
                  </p>
                </article>
                <article className="rounded-2xl border border-border bg-tint p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    Resource coverage
                  </p>
                  <p className="mt-2 font-semibold text-heading">{availableResources} resources ready</p>
                  <p className="mt-1 text-sm text-text/72">
                    {maintenanceResources
                      ? `${maintenanceResources} asset(s) under maintenance.`
                      : "No assets blocked by maintenance."}
                  </p>
                </article>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Pending booking approvals" subtitle="Next decisions">
                <div className="space-y-3">
                  {summary.bookings.slice(0, 3).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-tint/80 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-heading">{booking.facility}</p>
                        <p className="text-sm text-text/72">
                          {booking.requestedBy} • {booking.date} • {booking.time}
                        </p>
                      </div>
                      <span className={`status-badge shrink-0 ${toToken(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                  {!summary.bookings.length ? (
                    <p className="text-sm text-text/70">No pending booking approvals.</p>
                  ) : null}
                </div>
                <div className="mt-4">
                  <Button onClick={() => navigate("/admin/bookings")} variant="secondary" type="button">
                    Open queue
                  </Button>
                </div>
              </Card>

              <Card title="Incident management" subtitle="Active service desk items">
                <div className="space-y-3">
                  {summary.tickets.slice(0, 3).map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-tint/80 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-heading">{ticket.title}</p>
                        <p className="text-sm text-text/72">
                          {ticket.location} • {ticket.assignee}
                        </p>
                      </div>
                      <span className={`status-badge shrink-0 ${toToken(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  ))}
                  {!summary.tickets.length ? (
                    <p className="text-sm text-text/70">No tickets to show.</p>
                  ) : null}
                </div>
                <div className="mt-4">
                  <Button onClick={() => navigate("/admin/tickets")} variant="secondary" type="button">
                    View tickets
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-border bg-tint p-5">
              <p className="text-base font-semibold text-heading">Quick actions</p>
              <p className="text-sm text-text/72">Priority workflow shortcuts</p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  className="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-heading transition-colors hover:bg-tint"
                  type="button"
                  onClick={() => navigate("/admin/bookings")}
                >
                  Booking approvals
                </button>
                <button
                  className="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-heading transition-colors hover:bg-tint"
                  type="button"
                  onClick={() => navigate("/admin/resources")}
                >
                  Asset portfolio
                </button>
                <button
                  className="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-heading transition-colors hover:bg-tint"
                  type="button"
                  onClick={() => navigate("/admin/tickets")}
                >
                  Incident desk
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-5 shadow-shadow">
              <p className="text-base font-semibold text-heading">Operations posture</p>
              <p className="text-sm text-text/72">Current overview</p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-text/72">Resources available</span>
                    <span className="font-medium text-heading">{availPct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${availPct}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-text/72">Tickets resolved</span>
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

export default AdminDashboardPage;
