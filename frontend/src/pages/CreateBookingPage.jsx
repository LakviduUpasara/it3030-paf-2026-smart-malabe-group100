import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Notification from '../components/Notification';
import { bookingAPI } from '../services/api';
import { getResources } from '../services/resourceService';
import { useAuth } from '../hooks/useAuth';

function normalizeTypeLabel(type) {
  if (type == null) {
    return 'Other';
  }
  if (typeof type === 'object' && type.name) {
    return String(type.name).replace(/_/g, ' ');
  }
  return String(type).replace(/_/g, ' ');
}

const CreateBookingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState(null);

  const [formData, setFormData] = useState({
    resourceId: '',
    startTime: '',
    endTime: '',
    purpose: '',
  });

  const [prefilledFromAvailability, setPrefilledFromAvailability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const emptyFormState = {
    resourceId: '',
    startTime: '',
    endTime: '',
    purpose: '',
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getResources();
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setResources(
          list.map((r) => ({
            id: String(r.id),
            name: r.name || `Resource ${r.id}`,
            type: normalizeTypeLabel(r.type),
          })),
        );
        setResourcesError(null);
      } catch (e) {
        if (active) {
          setResources([]);
          setResourcesError(e?.message || 'Unable to load resources.');
        }
      } finally {
        if (active) setResourcesLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const savedBookingData = sessionStorage.getItem('bookingData');

    if (!savedBookingData) {
      return;
    }

    try {
      const parsedBookingData = JSON.parse(savedBookingData);

      setFormData((prev) => ({
        ...prev,
        resourceId: parsedBookingData.resourceId ? String(parsedBookingData.resourceId) : '',
        startTime: toDateTimeInputValue(parsedBookingData.startTime),
        endTime: toDateTimeInputValue(parsedBookingData.endTime),
      }));

      setPrefilledFromAvailability(
        Boolean(parsedBookingData.lockResourceSelection) || Boolean(parsedBookingData.resourceId),
      );
    } catch (error) {
      console.error('Failed to parse booking data from session storage:', error);
    }
  }, []);

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

  const toDateTimeInputValue = (value) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
      if (!user?.id) {
        setNotification({
          type: 'error',
          message: 'You must be signed in to create a booking.',
        });
        return;
      }
      if (!formData.resourceId) {
        setNotification({
          type: 'warning',
          message: 'Please select a resource.',
        });
        return;
      }

      const now = new Date();
      const minTime = new Date(now.getTime() + 5 * 60 * 1000);

      const selectedStart = parseLocalDateTime(formData.startTime);
      const selectedEnd = parseLocalDateTime(formData.endTime);

      const safeStart = selectedStart < minTime ? minTime : selectedStart;
      const safeEnd = selectedEnd < safeStart ? new Date(safeStart.getTime() + 60 * 60 * 1000) : selectedEnd;

      const payload = {
        resourceId: String(formData.resourceId),
        userId: String(user.id),
        startTime: formatDateTimeLocal(safeStart),
        endTime: formatDateTimeLocal(safeEnd),
        purpose: formData.purpose,
      };

      await bookingAPI.createBooking(payload);

      setNotification({
        type: 'success',
        message: 'Booking created successfully! Redirecting to My Bookings…',
      });
      setFormData(emptyFormState);
      setPrefilledFromAvailability(false);
      sessionStorage.removeItem('bookingData');

      setTimeout(() => {
        navigate('/bookings', { replace: true });
      }, 1200);
    } catch (error) {
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

  const handleCancel = () => {
    setFormData(emptyFormState);
    setPrefilledFromAvailability(false);
    setNotification(null);
    sessionStorage.removeItem('bookingData');
    window.history.back();
  };

  const getGroupLabel = (type) => {
    const labels = {
      'Computer Lab': 'Labs',
      Room: 'Rooms',
      Equipment: 'Equipment',
    };

    return labels[type] || type;
  };

  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = [];
    }

    acc[resource.type].push(resource);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 text-center">Create Booking</h1>
        {resourcesLoading ? <p className="mb-4 text-center text-sm text-gray-600">Loading resources…</p> : null}
        {resourcesError ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-800">
            {resourcesError}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resource */}
          <div>
            <label className="text-gray-600 text-sm font-medium mb-1 block">Resource</label>
            <select
              name="resourceId"
              value={formData.resourceId}
              onChange={handleChange}
              disabled={prefilledFromAvailability}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Resource</option>
              {Object.entries(groupedResources).map(([type, resourcesInGroup]) => (
                <optgroup key={type} label={`${getGroupLabel(type)} (${resourcesInGroup.length})`}>
                  {resourcesInGroup.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {prefilledFromAvailability && (
              <p className="text-xs text-green-600 mt-1">
                Resource is locked to the selection from Availability.
              </p>
            )}
          </div>

          <div>
            <label className="text-gray-600 text-sm font-medium mb-1 block">Booked as</label>
            <input
              type="text"
              readOnly
              value={user?.email ? `${user.email} (${user.id})` : user?.id || '—'}
              className="w-full cursor-not-allowed bg-gray-100 px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
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
              onClick={handleCancel}
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

