import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
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

  const formatDateTimeWithOffset = (date) => {
    return date.toISOString().slice(0, 19);
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
        startTime: formatDateTimeWithOffset(safeStart),
        endTime: formatDateTimeWithOffset(safeEnd),
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-white">Create Booking</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-300">Resource ID</label>
            <input
              type="number"
              name="resourceId"
              value={formData.resourceId}
              onChange={handleChange}
              placeholder="Enter resource ID"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-300">User ID</label>
            <input
              type="number"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              placeholder="Enter user ID"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-300">Start Time</label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-300">End Time</label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-300">Purpose</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Enter booking purpose"
              required
              rows="4"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Booking'}
            </Button>
            <Button variant="secondary" onClick={() => window.history.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>

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

