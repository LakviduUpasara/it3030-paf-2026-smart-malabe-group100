import { useEffect, useState } from "react";
import AdminWorkspaceLayout from "../components/AdminWorkspaceLayout";
import Button from "../components/Button";
import Card from "../components/Card";
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
    <AdminWorkspaceLayout
      stats={[
        {
          label: "Pending requests",
          value: bookings.length,
          detail: `${uniqueFacilities} facilities waiting for a decision`,
          tone: "warm",
        },
        {
          label: "Expected attendees",
          value: totalAttendees,
          detail: "Combined impact across queued bookings",
          tone: "cool",
        },
        {
          label: "Large events",
          value: largeEvents,
          detail: "High-capacity requests needing careful review",
          tone: "critical",
        },
      ]}
      subtitle="Review every booking request with enterprise-style decision controls and better visibility into schedule impact."
      title="Booking Approval Queue"
    >
      {error ? <p className="alert alert-error">{error}</p> : null}

      {loading ? (
        <Card className="admin-panel-card">
          <LoadingSpinner label="Loading booking approvals..." />
        </Card>
      ) : (
        <Card className="admin-panel-card">
          <div className="admin-panel-header">
            <div>
              <p className="admin-panel-kicker">Decision workspace</p>
              <h3>Approve or reject requests</h3>
            </div>
          </div>

          <div className="admin-queue-list">
            {bookings.map((booking) => (
              <article className="admin-queue-card" key={booking.id}>
                <div className="admin-queue-card-main">
                  <div className="admin-queue-card-head">
                    <div>
                      <strong>{booking.facility}</strong>
                      <p>
                        Requested by {booking.requestedBy} • {booking.date}
                      </p>
                    </div>
                    <span className={`status-badge ${toToken(booking.status)}`}>{booking.status}</span>
                  </div>

                  <div className="admin-queue-meta">
                    <span>{booking.time}</span>
                    <span>{booking.attendees} attendees</span>
                    <span>{booking.id}</span>
                  </div>
                </div>

                <div className="admin-queue-actions">
                  <Button onClick={() => handleDecision(booking.id, "approve")} variant="primary">
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleDecision(booking.id, "reject")}
                    variant="secondary"
                  >
                    Reject
                  </Button>
                </div>
              </article>
            ))}

            {!bookings.length ? (
              <p className="empty-state">All booking requests have been processed.</p>
            ) : null}
          </div>
        </Card>
      )}
    </AdminWorkspaceLayout>
  );
}

export default ApproveBookingsPage;
