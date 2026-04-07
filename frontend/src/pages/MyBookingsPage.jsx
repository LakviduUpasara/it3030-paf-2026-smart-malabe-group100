import { useEffect, useState } from "react";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { getMyBookings } from "../services/bookingService";
import { formatDate, toToken } from "../utils/formatters";

function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      setLoading(true);
      setError("");

      try {
        const data = await getMyBookings();
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

    loadBookings();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading your bookings..." />;
  }

  return (
    <div className="page-stack">
      <Card title="My Bookings" subtitle="Your current and upcoming reservations">
        {error ? <p className="alert alert-error">{error}</p> : null}
        <div className="list-stack">
          {bookings.map((booking) => (
            <article className="list-row" key={booking.id}>
              <div>
                <strong>{booking.facility}</strong>
                <p className="supporting-text">
                  {formatDate(booking.date)} | {booking.time}
                </p>
                <p className="supporting-text">{booking.purpose}</p>
              </div>
              <span className={`status-badge ${toToken(booking.status)}`}>
                {booking.status}
              </span>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default MyBookingsPage;

