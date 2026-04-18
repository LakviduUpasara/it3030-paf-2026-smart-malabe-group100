import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CalendarDays, ClipboardList, Ticket } from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import AdminKpiGrid from "../components/admin/AdminKpiGrid";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminStatTile from "../components/admin/AdminStatTile";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { getMyBookings } from "../services/bookingService";
import { getMyTickets } from "../services/ticketService";
import { getRoleDescription } from "../utils/roleUtils";
import { toToken } from "../utils/formatters";

const initialSummary = {
  bookings: [],
  tickets: [],
};

function bookingStatusUpper(booking) {
  return String(booking?.status ?? "").toUpperCase();
}

function isTicketOpen(ticket) {
  const s = String(ticket?.status ?? "").toUpperCase();
  return s !== "RESOLVED" && s !== "CLOSED";
}

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [bookings, ticketsRes] = await Promise.all([getMyBookings(), getMyTickets()]);
        if (active) {
          const ticketRows = ticketsRes?.data;
          setSummary({
            bookings: Array.isArray(bookings) ? bookings : [],
            tickets: Array.isArray(ticketRows) ? ticketRows : [],
          });
        }
      } catch (e) {
        if (active) {
          setError(e.message || "Unable to load dashboard.");
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

  const pendingBookings = summary.bookings.filter((b) => bookingStatusUpper(b) === "PENDING").length;
  const approvedBookings = summary.bookings.filter((b) =>
    ["APPROVED", "CONFIRMED"].includes(bookingStatusUpper(b)),
  ).length;
  const openTickets = summary.tickets.filter(isTicketOpen).length;
  const resolvedTickets = summary.tickets.filter((t) => String(t.status).toUpperCase() === "RESOLVED").length;
  const urgentTickets = summary.tickets.filter(
    (t) => isTicketOpen(t) && ["HIGH", "CRITICAL"].includes(String(t.priority).toUpperCase()),
  ).length;

  const bookingPct = summary.bookings.length
    ? Math.round((approvedBookings / summary.bookings.length) * 100)
    : 0;
  const ticketPct = summary.tickets.length
    ? Math.round((resolvedTickets / summary.tickets.length) * 100)
    : 0;

  const nextBooking = summary.bookings[0];
  const topTicket = summary.tickets[0];

  return (
    <>
      <AdminPageHeader
        actions={
          <>
            <Button onClick={() => navigate("/tickets")} variant="secondary" type="button">
              My tickets
            </Button>
            <Button onClick={() => navigate("/bookings")} variant="secondary" type="button">
              My bookings
            </Button>
            <Button onClick={() => navigate("/bookings/new")} variant="primary" type="button">
              New booking
            </Button>
          </>
        }
        description={`${getRoleDescription(user?.role)} Track reservations and incidents you have raised.`}
        title={`Welcome back, ${user?.name || "campus user"}`}
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
          detail={`${pendingBookings} waiting for approval`}
          icon={CalendarDays}
          label="My bookings"
          value={summary.bookings.length}
        />
        <AdminStatTile
          detail={`${approvedBookings} confirmed or active`}
          icon={ClipboardList}
          label="Approved bookings"
          value={approvedBookings}
        />
        <AdminStatTile
          detail={`${urgentTickets} high / critical open`}
          icon={AlertTriangle}
          label="Open incidents"
          value={openTickets}
        />
        <AdminStatTile
          detail="Reported by you"
          icon={Ticket}
          label="Total tickets"
          value={summary.tickets.length}
        />
      </AdminKpiGrid>

      {loading ? (
        <Card title="Loading">
          <LoadingSpinner label="Loading your dashboard..." />
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6 lg:space-y-8">
            <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-shadow">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    Your activity
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-heading">Campus overview</h2>
                  <p className="mt-1 text-sm text-text/72">
                    Bookings and incident requests tied to your account.
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-border bg-tint px-2.5 py-1 text-xs font-semibold text-text">
                  {user?.email}
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <article className="rounded-2xl border border-border bg-tint p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    Next booking
                  </p>
                  <p className="mt-2 font-semibold text-heading">
                    {nextBooking?.facility || "No bookings yet"}
                  </p>
                  <p className="mt-1 text-sm text-text/72">
                    {nextBooking
                      ? `${nextBooking.date} • ${nextBooking.time} • ${nextBooking.status}`
                      : "Create a booking to see it here."}
                  </p>
                </article>
                <article className="rounded-2xl border border-border bg-tint p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    Latest ticket
                  </p>
                  <p className="mt-2 font-semibold text-heading">
                    {topTicket?.title || "No tickets reported"}
                  </p>
                  <p className="mt-1 text-sm text-text/72">
                    {topTicket
                      ? `${topTicket.location || "—"} • ${topTicket.status}`
                      : "You have not submitted an incident request."}
                  </p>
                </article>
                <article className="rounded-2xl border border-border bg-tint p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    Alerts
                  </p>
                  <p className="mt-2 font-semibold text-heading">Notification center</p>
                  <p className="mt-1 text-sm text-text/72">
                    Operational notices and campus updates in one place.
                  </p>
                </article>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card subtitle="Reservations you created" title="Bookings">
                <div className="space-y-3">
                  {summary.bookings.slice(0, 3).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-tint/80 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-heading">{booking.facility}</p>
                        <p className="text-sm text-text/72">
                          {booking.date} • {booking.time}
                        </p>
                      </div>
                      <span className={`status-badge shrink-0 ${toToken(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                  {!summary.bookings.length ? (
                    <p className="text-sm text-text/70">No bookings yet.</p>
                  ) : null}
                </div>
                <div className="mt-4">
                  <Button onClick={() => navigate("/bookings")} variant="secondary" type="button">
                    View all bookings
                  </Button>
                </div>
              </Card>

              <Card subtitle="Incidents you reported" title="My tickets">
                <div className="space-y-3">
                  {summary.tickets.slice(0, 3).map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-tint/80 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-heading">{ticket.title}</p>
                        <p className="text-sm text-text/72">
                          {ticket.location || "—"} •{" "}
                          {ticket.assigneeDisplayName || ticket.assigneeTechnicianId || "Unassigned"}
                        </p>
                      </div>
                      <span className={`status-badge shrink-0 ${toToken(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  ))}
                  {!summary.tickets.length ? (
                    <p className="text-sm text-text/70">No incident tickets yet.</p>
                  ) : null}
                </div>
                <div className="mt-4">
                  <Button onClick={() => navigate("/tickets")} variant="secondary" type="button">
                    View all tickets
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-border bg-tint p-5">
              <p className="text-base font-semibold text-heading">Quick actions</p>
              <p className="text-sm text-text/72">Shortcuts</p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  className="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-heading transition-colors hover:bg-tint"
                  type="button"
                  onClick={() => navigate("/bookings/new")}
                >
                  New booking
                </button>
                <button
                  className="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-heading transition-colors hover:bg-tint"
                  type="button"
                  onClick={() => navigate("/bookings")}
                >
                  My bookings
                </button>
                <button
                  className="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-heading transition-colors hover:bg-tint"
                  type="button"
                  onClick={() => navigate("/tickets")}
                >
                  My tickets
                </button>
                <button
                  className="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-heading transition-colors hover:bg-tint"
                  type="button"
                  onClick={() => navigate("/notifications")}
                >
                  Notifications
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-5 shadow-shadow">
              <p className="text-base font-semibold text-heading">Progress</p>
              <p className="text-sm text-text/72">At a glance</p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-text/72">Bookings approved</span>
                    <span className="font-medium text-heading">{bookingPct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${bookingPct}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-text/72">Tickets resolved</span>
                    <span className="font-medium text-heading">{ticketPct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${ticketPct}%` }}
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

export default DashboardPage;
