import React, { useEffect, useState } from 'react';
import Notification from '../components/Notification';
import { useAuth } from '../hooks/useAuth';
import { bookingAPI } from '../services/api';
import { createBooking } from '../services/bookingService';
import { getResources } from '../services/resourceService';

const CreateBookingPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [resources, setResources] = useState([]);
  const [resourcesError, setResourcesError] = useState('');

  const [formData, setFormData] = useState({
    resourceId: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: '',
  });

  const [prefilledFromAvailability, setPrefilledFromAvailability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [notification, setNotification] = useState(null);

  const emptyFormState = {
    resourceId: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: '',
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getResources({ status: 'ACTIVE' });
        if (!cancelled) {
          setResources(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        if (!cancelled) {
          setResourcesError(e.message || 'Could not load resources.');
          setResources([]);
        }
      }
    })();
    return () => {
      cancelled = true;
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
      if (!isAuthenticated || !user?.id) {
        setNotification({
          type: 'warning',
          message: 'Please sign in to request a booking.',
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

      const attendeesNum = formData.expectedAttendees === '' ? 0 : Number(formData.expectedAttendees);
      if (Number.isNaN(attendeesNum) || attendeesNum < 0) {
        setNotification({ type: 'warning', message: 'Enter a valid expected attendee count (0 or more).' });
        return;
      }

      const payload = {
        resourceId: Number(formData.resourceId),
        startTime: formatDateTimeLocal(safeStart),
        endTime: formatDateTimeLocal(safeEnd),
        purpose: formData.purpose.trim(),
        expectedAttendees: attendeesNum,
      };


      await createBooking(payload);

      setNotification({ type: 'success', message: 'Booking request submitted (pending approval).' });
      setFormData(emptyFormState);
      setPrefilledFromAvailability(false);
      sessionStorage.removeItem('bookingData');

      setTimeout(() => {
        window.location.href = '/bookings';
      }, 2000);
    } catch (error) {
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
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
    const t = typeof type === 'string' ? type : type?.name || String(type || '');
    const labels = {
      LAB: 'Labs',
      LECTURE_HALL: 'Lecture halls',
      MEETING_ROOM: 'Meeting rooms',
      EQUIPMENT: 'Equipment',
      'Computer Lab': 'Labs',
      Room: 'Rooms',
      Equipment: 'Equipment',
    };

    return labels[t] || t || 'Resources';
  };

  const groupedResources = resources.reduce((acc, resource) => {
    const typeKey = typeof resource.type === 'string' ? resource.type : resource.type?.name || 'OTHER';
    if (!acc[typeKey]) {
      acc[typeKey] = [];
    }

    acc[typeKey].push(resource);
    return acc;
  }, {});

  const handleCheckAvailability = async () => {
    if (!formData.resourceId || !formData.startTime || !formData.endTime) {
      setNotification({ type: 'warning', message: 'Select resource, start, and end first.' });
      return;
    }
    const selectedStart = parseLocalDateTime(formData.startTime);
    const selectedEnd = parseLocalDateTime(formData.endTime);
    if (!selectedStart || !selectedEnd || selectedEnd <= selectedStart) {
      setNotification({ type: 'warning', message: 'Enter a valid start and end time range.' });
      return;
    }
    setCheckingAvailability(true);
    try {
      const startIso = formatDateTimeLocal(selectedStart);
      const endIso = formatDateTimeLocal(selectedEnd);
      const res = await bookingAPI.checkAvailability(Number(formData.resourceId), startIso, endIso);
      const data = res?.data?.data ?? res?.data;
      const ok = data?.available === true;
      setNotification({
        type: ok ? 'success' : 'warning',
        message: data?.message || (ok ? 'Slot appears available (approved bookings only).' : 'Slot not available.'),
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Availability check failed.',
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 text-center">Create Booking</h1>
        {resourcesError ? (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{resourcesError}</p>
        ) : null}
        {!isAuthenticated ? (
          <p className="mb-4 text-center text-sm text-red-600">Sign in to submit a booking request.</p>
        ) : (
          <p className="mb-4 text-center text-sm text-gray-600">
            Signed in as <strong>{user?.email || user?.fullName || user?.id}</strong>
          </p>
        )}

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
                      {resource.name} — {resource.location} (cap. {resource.capacity})
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

          <div>
            <label className="text-gray-600 text-sm font-medium mb-1 block">
              Expected attendees (optional)
            </label>
            <input
              type="number"
              name="expectedAttendees"
              min={0}
              value={formData.expectedAttendees}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Button Group */}
          <div className="flex flex-wrap gap-4 mt-6">
            <button
              type="button"
              disabled={checkingAvailability}
              onClick={handleCheckAvailability}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {checkingAvailability ? 'Checking…' : 'Check availability'}
            </button>
            <button
              type="submit"
              disabled={loading || !isAuthenticated}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit request'}
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

