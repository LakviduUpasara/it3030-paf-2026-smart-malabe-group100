import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Notification from '../components/Notification';
import { bookingAPI } from '../services/api';
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
      const response = await bookingAPI.getAllBookings({});
      console.log('API Response:', response);
      const bookingsData = response?.data?.data?.content || [];
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (error) {
      console.error('Error fetching bookings:', error.message, error);
      setError(error.message || 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      await bookingAPI.cancelBooking(bookingId);
      setNotification({ type: 'success', message: 'Booking cancelled successfully' });
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setNotification({ type: 'error', message: 'Failed to cancel booking' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-600 text-white';
      case 'PENDING':
        return 'bg-yellow-600 text-white';
      case 'REJECTED':
        return 'bg-red-600 text-white';
      case 'CANCELLED':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-700 text-gray-300';
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
          {bookings.map(booking => (
            <Card key={booking.id}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FiCalendar className="text-blue-400" /> Booking #{booking.id}
                  </h3>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <FiUser /> Resource ID
                  </p>
                  <p className="text-white font-semibold">{booking.resourceId}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <FiHash /> User ID
                  </p>
                  <p className="text-white font-semibold">{booking.userId}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <FiClock /> Start Time
                  </p>
                  <p className="text-white font-semibold">
                    {new Date(booking.startTime).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <FiClock /> End Time
                  </p>
                  <p className="text-white font-semibold">
                    {new Date(booking.endTime).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <FiFileText /> Purpose
                </p>
                <p className="text-white">{booking.purpose}</p>
              </div>

              {booking.status === 'APPROVED' && (
                <Button
                  variant="danger"
                  onClick={() => handleCancel(booking.id)}
                >
                  Cancel Booking
                </Button>
              )}
            </Card>
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

