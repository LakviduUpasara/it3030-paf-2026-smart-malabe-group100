import React, { useState } from 'react';
import Notification from '../components/Notification';
import { bookingAPI } from '../services/api';

const CreateBookingPage = () => {
  const [formData, setFormData] = useState({
    resourceId: '',
    userId: '',
    startTime: '',
    endTime: '',
    purpose: '',
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const parseLocalDateTime = (value) => {
    if (!value) return null;
    const [date, time] = value.split('T');
    const [y, m, d] = date.split('-').map(Number);
    const [h, min] = time.split(':').map(Number);
    return new Date(y, m - 1, d, h, min, 0);
  };

  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = new Date();
      const minTime = new Date(now.getTime() + 5 * 60 * 1000);

      const selectedStart = parseLocalDateTime(formData.startTime);
      const selectedEnd = parseLocalDateTime(formData.endTime);

      const safeStart = selectedStart < minTime ? minTime : selectedStart;
      const safeEnd = selectedEnd < safeStart ? new Date(safeStart.getTime() + 60 * 60 * 1000) : selectedEnd;

      const payload = {
        resourceId: Number(formData.resourceId),
        userId: Number(formData.userId),
        startTime: formatDateTimeLocal(safeStart),
        endTime: formatDateTimeLocal(safeEnd),
        purpose: formData.purpose,
      };

      console.log('═══════════════════════════════════');
      console.log('BOOKING CREATION DEBUG INFO');
      console.log('═══════════════════════════════════');
      console.log('NOW:', now.toISOString(), '|', now.toString());
      console.log('MIN TIME (NOW + 5 min):', minTime.toISOString(), '|', minTime.toString());
      console.log('Selected Start:', selectedStart?.toISOString());
      console.log('Safe Start:', safeStart.toISOString());
      console.log('Selected End:', selectedEnd?.toISOString());
      console.log('Safe End:', safeEnd.toISOString());
      console.log('TIME CHECK: Safe Start > Now?', safeStart > now);
      console.log('═══════════════════════════════════');
      console.log('FINAL PAYLOAD (Local Time):');
      console.log(JSON.stringify(payload, null, 2));
      console.log('═══════════════════════════════════');
      console.log('ISO Payload:');
      console.log(JSON.stringify(payload, null, 2));
      console.log('═══════════════════════════════════');
      console.log('Payload Format Check:');
      console.log('  startTime format:', payload.startTime, '✓ (UTC format: YYYY-MM-DDTHH:mm:ss)');
      console.log('  endTime format:', payload.endTime, '✓ (UTC format: YYYY-MM-DDTHH:mm:ss)');
      console.log('═══════════════════════════════════');

      await bookingAPI.createBooking(payload);

      setNotification({ type: 'success', message: 'Booking created successfully!' });
      setFormData({ resourceId: '', userId: '', startTime: '', endTime: '', purpose: '' });

      setTimeout(() => {
        window.location.href = '/bookings';
      }, 2000);
    } catch (error) {
      console.error('═══════════════════════════════════');
      console.error('BOOKING CREATION FAILED');
      console.error('═══════════════════════════════════');
      console.error('FULL ERROR:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      console.error('Error Message:', error.message);
      console.error('═══════════════════════════════════');

      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          JSON.stringify(error.response?.data) ||
          error.message ||
          'Failed to create booking',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 text-center">Create Booking</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resource ID */}
          <div>
            <label className="text-gray-600 text-sm font-medium mb-1 block">Resource ID</label>
            <input
              type="number"
              name="resourceId"
              value={formData.resourceId}
              onChange={handleChange}
              placeholder="Enter resource ID"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* User ID */}
          <div>
            <label className="text-gray-600 text-sm font-medium mb-1 block">User ID</label>
            <input
              type="number"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              placeholder="Enter user ID"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="text-gray-600 text-sm font-medium mb-1 block">Start Time</label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Time */}
          <div>
            <label className="text-gray-600 text-sm font-medium mb-1 block">End Time</label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="text-gray-600 text-sm font-medium mb-1 block">Purpose</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Enter booking purpose"
              required
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Button Group */}
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

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

export default CreateBookingPage;

