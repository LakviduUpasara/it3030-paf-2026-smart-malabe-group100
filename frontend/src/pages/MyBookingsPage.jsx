import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Notification from '../components/Notification';
import { getMyBookings, cancelBooking as cancelBookingRequest } from '../services/bookingService';
import { FiCalendar, FiClock, FiUser, FiFileText, FiHash } from 'react-icons/fi';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await getMyBookings();
      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      await cancelBookingRequest(bookingId);
      setNotification({ type: 'success', message: 'Booking cancelled successfully' });
      fetchBookings();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to cancel booking' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500 text-white';
      case 'PENDING':
        return 'bg-yellow-500 text-white';
      case 'REJECTED':
        return 'bg-red-500 text-white';
      case 'CANCELLED':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-400 mb-4">Loading bookings...</p>
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">My Bookings</h1>
        <Card className="bg-red-900 border-red-700">
          <p className="text-red-200 text-center py-8">Error: {error}</p>
          <div className="text-center">
            <Button onClick={fetchBookings}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white">My Bookings</h1>

      {bookings.length === 0 ? (
        <Card>
          <p className="text-gray-400 text-center py-8">No bookings found. Create one now!</p>
          <div className="text-center">
            <Button onClick={() => (window.location.href = '/booking/create')}>
              Create Booking
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookings.sort((a, b) => a.id - b.id).map(booking => (
            <div key={booking.id} className="bg-white rounded-xl shadow-md p-6 mb-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FiCalendar className="text-blue-500" /> Booking #{booking.id}
                  </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FiUser className="text-gray-500" /> Resource ID
                  </p>
                  <p className="text-gray-800 font-medium mt-1">{booking.resourceId}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FiHash className="text-gray-500" /> User ID
                  </p>
                  <p className="text-gray-800 font-medium mt-1">{booking.userId}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FiClock className="text-gray-500" /> Start Time
                  </p>
                  <p className="text-gray-800 font-medium mt-1">
                    {new Date(booking.startTime).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <FiClock className="text-gray-500" /> End Time
                  </p>
                  <p className="text-gray-800 font-medium mt-1">
                    {new Date(booking.endTime).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <FiFileText className="text-gray-500" /> Purpose
                </p>
                <p className="text-gray-800 mt-1">{booking.purpose}</p>
              </div>

              {Number(booking.expectedAttendees) > 0 ? (
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Expected attendees</p>
                  <p className="text-gray-800 mt-1">{booking.expectedAttendees}</p>
                </div>
              ) : null}

              {booking.status === 'REJECTED' && booking.rejectionReason ? (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  <strong>Rejection reason:</strong> {booking.rejectionReason}
                </div>
              ) : null}

              {booking.status === 'APPROVED' && (
                <button
                  onClick={() => handleCancel(booking.id)}
                  className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel Booking
                </button>
              )}
              {booking.status !== 'APPROVED' && (
                <p className="mt-4 text-gray-400 text-sm">Cannot cancel - status is {booking.status}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default MyBookingsPage;

