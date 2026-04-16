import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Notification from '../components/Notification';
import { bookingAPI } from '../services/api';
import { FiCalendar, FiClock, FiUser, FiHash, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const AdminDashboardPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const fetchAllBookings = async () => {
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

  const handleApprove = async (bookingId) => {
    try {
      await bookingAPI.approveBooking(bookingId);
      setNotification({ type: 'success', message: 'Booking approved' });
      fetchAllBookings();
    } catch (error) {
      console.error('Error approving booking:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to approve booking',
      });
    }
  };

  const handleReject = async (bookingId) => {
    try {
      await bookingAPI.rejectBooking(bookingId);
      setNotification({ type: 'success', message: 'Booking rejected' });
      fetchAllBookings();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      setNotification({ type: 'error', message: 'Failed to reject booking' });
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
          <p className="text-lg text-gray-400 mb-4">Loading admin dashboard...</p>
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">Admin Dashboard</h1>
        <Card className="bg-red-900 border-red-700">
          <p className="text-red-200 text-center py-8">Error: {error}</p>
          <div className="text-center">
            <Button onClick={fetchAllBookings}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  const stats = {
    total: bookings.length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    rejected: bookings.filter(b => b.status === 'REJECTED').length,
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Bookings', value: stats.total, color: 'bg-blue-600' },
          { label: 'Approved', value: stats.approved, color: 'bg-green-600' },
          { label: 'Pending', value: stats.pending, color: 'bg-yellow-600' },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-600' },
        ].map((stat, idx) => (
          <Card key={idx} className={stat.color}>
            <p className="text-gray-200 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Bookings Table */}
      {bookings.length === 0 ? (
        <Card>
          <p className="text-gray-400 text-center py-8">No bookings to manage</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-3 px-4 text-gray-400">ID</th>
                <th className="py-3 px-4 text-gray-400">Resource</th>
                <th className="py-3 px-4 text-gray-400">User</th>
                <th className="py-3 px-4 text-gray-400">Start Time</th>
                <th className="py-3 px-4 text-gray-400">End Time</th>
                <th className="py-3 px-4 text-gray-400">Status</th>
                <th className="py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="py-3 px-4 text-white">{booking.id}</td>
                  <td className="py-3 px-4 text-white">{booking.resourceId}</td>
                  <td className="py-3 px-4 text-white">{booking.userId}</td>
                  <td className="py-3 px-4 text-white text-sm">
                    {new Date(booking.startTime).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-white text-sm">
                    {new Date(booking.endTime).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {booking.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          variant="success"
                          onClick={() => handleApprove(booking.id)}
                          className="text-sm px-3 py-1"
                        >
                          <FiCheckCircle className="inline mr-1" /> Approve
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleReject(booking.id)}
                          className="text-sm px-3 py-1"
                        >
                          <FiXCircle className="inline mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
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

export default AdminDashboardPage;

