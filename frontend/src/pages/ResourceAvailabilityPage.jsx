import React, { useState } from 'react';
import Notification from '../components/Notification';
import { bookingAPI } from '../services/api';
import { FiSearch, FiCalendar, FiClock } from 'react-icons/fi';

const ResourceAvailabilityPage = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Predefined resources
  const resources = [
    { id: 1, name: 'Lab A', type: 'Computer Lab' },
    { id: 2, name: 'Lab B', type: 'Computer Lab' },
    { id: 3, name: 'Meeting Room 1', type: 'Room' },
    { id: 4, name: 'Projector 1', type: 'Equipment' },
  ];

  // Map type to display label
  const getGroupLabel = (type) => {
    const labels = {
      'Computer Lab': 'Labs',
      'Room': 'Rooms',
      'Equipment': 'Equipment',
    };
    return labels[type] || type;
  };

  // Group resources by type and sort
  const groupResourcesByType = () => {
    const groupOrder = { 'Computer Lab': 0, 'Room': 1, 'Equipment': 2 };
    const grouped = resources.reduce((acc, resource) => {
      const type = resource.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(resource);
      return acc;
    }, {});

    return Object.entries(grouped).sort((a, b) => {
      const orderA = groupOrder[a[0]] ?? 999;
      const orderB = groupOrder[b[0]] ?? 999;
      return orderA - orderB;
    });
  };

  const formatDateTimeRange = (value) => {
    if (!value) return { start: '', end: '' };
    if (!value.includes('-')) return { start: '', end: '' };
    
    const [year, month, day] = value.split('-');
    const startTime = `${year}-${month}-${day}T00:00:00`;
    const endTime = `${year}-${month}-${day}T23:59:59`;
    
    return { start: startTime, end: endTime };
  };

  const handleCheckAvailability = async () => {
    if (!selectedDate || !resourceId) {
      setNotification({ type: 'warning', message: 'Please select date and resource' });
      return;
    }

    setLoading(true);
    try {
      const { start, end } = formatDateTimeRange(selectedDate);

      console.log('FINAL REQUEST:', {
        resourceId: Number(resourceId),
        start,
        end,
      });

      const response = await bookingAPI.checkAvailability(
        Number(resourceId),
        start,
        end
      );

      setAvailability(response.data.data);
      generateTimeSlots(new Date(selectedDate));
      setNotification({
        type: response.data.data.available ? 'success' : 'warning',
        message: response.data.data.message,
      });
    } catch (error) {
      console.error('BACKEND ERROR:', error.response?.data);
      console.error('STATUS:', error.response?.status);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to check availability',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (date) => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      slots.push({
        time: `${hour}:00 - ${hour + 1}:00`,
        startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0),
        endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + 1, 0),
      });
    }
    setTimeSlots(slots);
  };

  const handleBookSlot = (slot) => {
    const selectedResource = resources.find(
      (resource) => String(resource.id) === String(resourceId),
    );

    const bookingData = {
      resourceId: Number(resourceId),
      resourceName: selectedResource?.name || `Resource ${resourceId}`,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      lockResourceSelection: true,
    };

    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    window.location.href = '/booking/create';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Resource Availability</h1>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <FiSearch className="text-blue-500" /> Check Availability
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Resource Selection Dropdown */}
          <div>
            <label className="text-gray-600 text-sm font-medium mb-2 block flex items-center gap-2">
              <FiSearch className="text-gray-500" /> Resource
            </label>
            <select
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white cursor-pointer"
            >
              <option value="">Select Resource</option>
              {groupResourcesByType().map(([type, resourcesInGroup]) => (
                <optgroup key={type} label={`${getGroupLabel(type)} (${resourcesInGroup.length})`}>
                  {resourcesInGroup.map(resource => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Date Input */}
          <div>
            <label className="text-gray-600 text-sm font-medium mb-2 block flex items-center gap-2">
              <FiCalendar className="text-gray-500" /> Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
          </div>

          {/* Check Availability Button */}
          <button
            onClick={handleCheckAvailability}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Checking...' : 'Check Availability'}
          </button>
        </div>
      </div>

      {/* Time Slots Section */}
      {timeSlots.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center gap-2">
            <FiClock className="text-blue-500" /> Available Time Slots
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {timeSlots.map((slot, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
                <p className="text-lg font-semibold text-gray-900 mb-3">{slot.time}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {availability?.available ? '✓ Available' : '✗ Not Available'}
                </p>
                <button
                  onClick={() => handleBookSlot(slot)}
                  disabled={!availability?.available}
                  className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                    availability?.available
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {availability?.available ? 'Book Now' : 'Unavailable'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      {availability && (
        <div className="mt-8 bg-blue-100 rounded-xl shadow-md p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Status</h3>
          <p className="text-gray-800">{availability.message}</p>
          <p className="text-sm text-gray-600 mt-2">
            Resource ID: {availability.resourceId} | Date: {selectedDate}
          </p>
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

export default ResourceAvailabilityPage;
