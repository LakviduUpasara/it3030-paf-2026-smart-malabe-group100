import { useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  approveBooking,
  getPendingBookings,
  rejectBooking,
} from "../services/bookingService";

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

  if (loading) {
    return <LoadingSpinner label="Loading booking approvals..." />;
  }

  return (
    <Card title="Approve or Reject Bookings" subtitle="Review pending booking requests">
      {error ? <p className="alert alert-error">{error}</p> : null}
      <div className="list-stack">
        {bookings.map((booking) => (
          <article className="list-row align-start" key={booking.id}>
            <div>
              <strong>{booking.facility}</strong>
              <p className="supporting-text">
                Requested by {booking.requestedBy} | {booking.date} | {booking.time}
              </p>
              <p className="supporting-text">Expected attendees: {booking.attendees}</p>
            </div>
            <div className="inline-actions">
              <Button onClick={() => handleDecision(booking.id, "approve")}>
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
      </div>
    </Card>
  );
}

export default ApproveBookingsPage;

