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
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

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

  const handleOpenRejectModal = (bookingId) => {
    setSelectedBookingId(bookingId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setSelectedBookingId(null);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      setNotification({ type: 'warning', message: 'Please enter a rejection reason' });
      return;
    }

    try {
      await bookingAPI.rejectBooking(selectedBookingId, { reason: rejectionReason });
      setNotification({ type: 'success', message: 'Booking rejected' });
      handleCloseRejectModal();
      fetchAllBookings();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to reject booking',
      });
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
          { label: 'Total Bookings', value: stats.total, color: 'bg-blue-100' },
          { label: 'Approved', value: stats.approved, color: 'bg-green-100' },
          { label: 'Pending', value: stats.pending, color: 'bg-yellow-100' },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-100' },
        ].map((stat, idx) => (
          <Card key={idx} className={stat.color}>
            <p className="text-gray-700 text-sm font-semibold">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Bookings Table */}
      {bookings.length === 0 ? (
        <Card>
          <p className="text-gray-400 text-center py-8">No bookings to manage</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto bg-white">
          <table className="w-full text-left bg-white">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="py-3 px-4 text-gray-700 font-semibold">ID</th>
                <th className="py-3 px-4 text-gray-700 font-semibold">Resource</th>
                <th className="py-3 px-4 text-gray-700 font-semibold">User</th>
                <th className="py-3 px-4 text-gray-700 font-semibold">Start Time</th>
                <th className="py-3 px-4 text-gray-700 font-semibold">End Time</th>
                <th className="py-3 px-4 text-gray-700 font-semibold">Status</th>
                <th className="py-3 px-4 text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...bookings]
                .sort((a, b) => a.id - b.id)
                .map(booking => (
                <tr key={booking.id} className="border-b border-gray-300 hover:bg-gray-100">
                  <td className="py-3 px-4 text-gray-800">{booking.id}</td>
                  <td className="py-3 px-4 text-gray-800">{booking.resourceId}</td>
                  <td className="py-3 px-4 text-gray-800">{booking.userId}</td>
                  <td className="py-3 px-4 text-gray-800 text-sm">
                    {new Date(booking.startTime).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-800 text-sm">
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
                        <button
                          onClick={() => handleApprove(booking.id)}
                          className="px-3 py-1 rounded text-sm font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors"
                        >
                          <FiCheckCircle className="inline mr-1" /> Approve
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(booking.id)}
                          className="px-3 py-1 rounded text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors"
                        >
                          <FiXCircle className="inline mr-1" /> Reject
                        </button>
                      </div>
                    )}
                    {booking.status !== 'PENDING' && (
                      <p className="text-gray-500 text-sm">{booking.status}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Booking</h2>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleConfirmReject}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
              >
                Confirm Reject
              </button>
              <button
                onClick={handleCloseRejectModal}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
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

export default AdminDashboardPage;