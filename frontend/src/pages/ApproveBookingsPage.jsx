import { useEffect, useState } from "react";
import { ClipboardList, Users, Zap } from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import AdminKpiGrid from "../components/admin/AdminKpiGrid";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminStatTile from "../components/admin/AdminStatTile";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  approveBooking,
  getAllBookingsAdmin,
  getPendingBookings,
  rejectBooking,
} from "../services/bookingService";
import { getResources } from "../services/resourceService";
import { normalizeBookingQueueRow } from "../utils/bookingDisplay";
import { toToken } from "../utils/formatters";

function ApproveBookingsPage() {
  const [view, setView] = useState("pending");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [registryRows, setRegistryRows] = useState([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registryPage, setRegistryPage] = useState(0);
  const [registryTotalPages, setRegistryTotalPages] = useState(0);
  const [filterResourceId, setFilterResourceId] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [resourceOptions, setResourceOptions] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadPendingBookings() {
      setLoading(true);
      setError("");

      try {
        const data = await getPendingBookings();
        if (active) {
          setBookings(data);
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

    loadPendingBookings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await getResources({});
        if (!active) return;
        setResourceOptions(Array.isArray(list) ? list : []);
      } catch {
        if (active) setResourceOptions([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (view !== "registry") return;

    let active = true;

    async function loadRegistry() {
      setRegistryLoading(true);
      setError("");
      try {
        const page = await getAllBookingsAdmin({
          page: registryPage,
          size: 15,
          resourceId: filterResourceId || undefined,
          userId: filterUserId,
          date: filterDate || undefined,
        });
        if (!active) return;
        const content = page?.content ?? [];
        setRegistryRows(content);
        setRegistryTotalPages(page?.totalPages ?? 0);
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
          setRegistryRows([]);
        }
      } finally {
        if (active) setRegistryLoading(false);
      }
    }

    loadRegistry();
    return () => {
      active = false;
    };
  }, [view, registryPage, filterResourceId, filterUserId, filterDate]);

  const handleDecision = async (bookingId, action) => {
    setError("");

    try {
      if (action === "approve") {
        await approveBooking(bookingId);
      } else {
        const reason = window.prompt(
          "Rejection reason (required — visible to requester in line with module requirements):",
        );
        if (reason == null) {
          return;
        }
        const trimmed = reason.trim();
        if (!trimmed) {
          setError("A rejection reason is required.");
          return;
        }
        await rejectBooking(bookingId, trimmed);
      }

      setBookings((previousBookings) =>
        previousBookings.filter((booking) => booking.id !== bookingId),
      );
    } catch (decisionError) {
      setError(decisionError.message);
    }
  };

  const bookingsUi = bookings.map(normalizeBookingQueueRow);
  const registryUi = registryRows.map(normalizeBookingQueueRow);

  const totalAttendees = bookingsUi.reduce(
    (total, booking) => total + Number(booking.attendees || 0),
    0,
  );
  const largeEvents = bookingsUi.filter((booking) => Number(booking.attendees || 0) >= 100).length;
  const uniqueFacilities = new Set(bookingsUi.map((booking) => booking.facility)).size;

  return (
    <>
      <AdminPageHeader
        description="Review booking requests and approve or reject with full schedule context."
        title="Booking approval queue"
      />

      <AdminKpiGrid>
        <AdminStatTile
          detail={`${uniqueFacilities} facilities in queue`}
          icon={ClipboardList}
          label="Pending requests"
          value={bookings.length}
        />
        <AdminStatTile
          detail="Across queued bookings"
          icon={Users}
          label="Expected attendees"
          value={totalAttendees}
        />
        <AdminStatTile
          detail="High-capacity review"
          icon={Zap}
          label="Large events"
          value={largeEvents}
        />
      </AdminKpiGrid>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          onClick={() => setView("pending")}
          type="button"
          variant={view === "pending" ? "primary" : "secondary"}
        >
          Pending queue
        </Button>
        <Button
          onClick={() => setView("registry")}
          type="button"
          variant={view === "registry" ? "primary" : "secondary"}
        >
          All bookings (filters)
        </Button>
      </div>

      {error ? (
        <section
          className="rounded-3xl border border-border bg-tint p-5 shadow-shadow"
          role="alert"
        >
          <p className="text-sm font-semibold text-heading">Something went wrong</p>
          <p className="mt-1 text-sm text-text/70">{error}</p>
        </section>
      ) : null}

      {view === "pending" ? (
        loading ? (
          <Card title="Loading">
            <LoadingSpinner label="Loading booking approvals..." />
          </Card>
        ) : (
          <Card subtitle="Approve or reject each request" title="Decision workspace">
            <div className="space-y-4">
              {bookingsUi.map((booking) => (
                <article
                  key={booking.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-tint/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-heading">{booking.facility}</p>
                        <p className="text-sm text-text/72">
                          Requested by {booking.requestedBy} • {booking.date}
                        </p>
                      </div>
                      <span className={`status-badge ${toToken(booking.status)}`}>{booking.status}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-text/72">
                      <span>{booking.time}</span>
                      <span>{booking.attendees} attendees</span>
                      <span className="font-mono text-xs">{booking.id}</span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-wrap gap-2 sm:flex-none sm:justify-end">
                    <Button onClick={() => handleDecision(booking.id, "approve")} variant="primary">
                      Approve
                    </Button>
                    <Button onClick={() => handleDecision(booking.id, "reject")} variant="secondary">
                      Reject
                    </Button>
                  </div>
                </article>
              ))}

              {!bookingsUi.length ? (
                <p className="text-center text-sm text-text/70">All booking requests have been processed.</p>
              ) : null}
            </div>
          </Card>
        )
      ) : null}

      {view === "registry" ? (
        <Card
          subtitle="Filter by resource, requester account id, or calendar date (module requirement)."
          title="Booking registry"
        >
          {registryLoading ? (
            <LoadingSpinner label="Loading bookings..." />
          ) : (
            <>
              <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-text/70">Resource</span>
                  <select
                    className="rounded-xl border border-border bg-tint px-3 py-2 text-heading"
                    onChange={(e) => {
                      setRegistryPage(0);
                      setFilterResourceId(e.target.value);
                    }}
                    value={filterResourceId}
                  >
                    <option value="">Any</option>
                    {resourceOptions.map((r) => (
                      <option key={r.id} value={String(r.id)}>
                        {r.name || `Resource #${r.id}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-text/70">User id (Mongo)</span>
                  <input
                    className="rounded-xl border border-border bg-tint px-3 py-2 text-heading"
                    onChange={(e) => {
                      setRegistryPage(0);
                      setFilterUserId(e.target.value);
                    }}
                    placeholder="Exact match"
                    type="text"
                    value={filterUserId}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-text/70">On date</span>
                  <input
                    className="rounded-xl border border-border bg-tint px-3 py-2 text-heading"
                    onChange={(e) => {
                      setRegistryPage(0);
                      setFilterDate(e.target.value);
                    }}
                    type="date"
                    value={filterDate}
                  />
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-text/70">
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Facility</th>
                      <th className="py-2 pr-3 font-medium">Requester</th>
                      <th className="py-2 pr-3 font-medium">When</th>
                      <th className="py-2 pr-3 font-medium">Attendees</th>
                      <th className="py-2 font-medium">Id</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registryUi.map((row) => (
                      <tr className="border-b border-border/60" key={row.id}>
                        <td className="py-3 pr-3">
                          <span className={`status-badge ${toToken(row.status)}`}>{row.status}</span>
                        </td>
                        <td className="py-3 pr-3 font-medium text-heading">{row.facility}</td>
                        <td className="py-3 pr-3 text-text/80">{row.requestedBy}</td>
                        <td className="py-3 pr-3 text-text/80">
                          {row.date}
                          <br />
                          <span className="text-xs">{row.time}</span>
                        </td>
                        <td className="py-3 pr-3">{row.attendees}</td>
                        <td className="py-3 font-mono text-xs">{row.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!registryUi.length ? (
                <p className="mt-4 text-center text-sm text-text/70">No bookings match these filters.</p>
              ) : null}

              {registryTotalPages > 1 ? (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-text/70">
                    Page {registryPage + 1} of {registryTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      disabled={registryPage <= 0}
                      onClick={() => setRegistryPage((p) => Math.max(0, p - 1))}
                      type="button"
                      variant="secondary"
                    >
                      Previous
                    </Button>
                    <Button
                      disabled={registryPage >= registryTotalPages - 1}
                      onClick={() => setRegistryPage((p) => p + 1)}
                      type="button"
                      variant="secondary"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Card>
      ) : null}
    </>
  );
}

export default ApproveBookingsPage;
