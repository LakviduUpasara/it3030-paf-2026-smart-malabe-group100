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
  getPendingBookings,
  rejectBooking,
} from "../services/bookingService";
import { toToken } from "../utils/formatters";

function ApproveBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleDecision = async (bookingId, action) => {
    setError("");

    try {
      if (action === "approve") {
        await approveBooking(bookingId);
      } else {
        await rejectBooking(bookingId);
      }

      setBookings((previousBookings) =>
        previousBookings.filter((booking) => booking.id !== bookingId),
      );
    } catch (decisionError) {
      setError(decisionError.message);
    }
  };

  const totalAttendees = bookings.reduce(
    (total, booking) => total + Number(booking.attendees || 0),
    0,
  );
  const largeEvents = bookings.filter((booking) => Number(booking.attendees || 0) >= 100).length;
  const uniqueFacilities = new Set(bookings.map((booking) => booking.facility)).size;

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

      {error ? (
        <section
          className="rounded-3xl border border-border bg-tint p-5 shadow-shadow"
          role="alert"
        >
          <p className="text-sm font-semibold text-heading">Something went wrong</p>
          <p className="mt-1 text-sm text-text/70">{error}</p>
        </section>
      ) : null}

      {loading ? (
        <Card title="Loading">
          <LoadingSpinner label="Loading booking approvals..." />
        </Card>
      ) : (
        <Card subtitle="Approve or reject each request" title="Decision workspace">
          <div className="space-y-4">
            {bookings.map((booking) => (
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

            {!bookings.length ? (
              <p className="text-center text-sm text-text/70">All booking requests have been processed.</p>
            ) : null}
          </div>
        </Card>
      )}
    </>
  );
}

export default ApproveBookingsPage;
