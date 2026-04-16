import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
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
    const bookingData = {
      resourceId,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
    };
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    window.location.href = '/booking/create';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white">Resource Availability</h1>

      {/* Search Section */}
      <Card className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
          <FiSearch /> Check Availability
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Input
            label="Resource ID"
            type="number"
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
            placeholder="Enter resource ID"
          />

          <Input
            label="Select Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <div className="flex items-end">
            <Button
              onClick={handleCheckAvailability}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Checking...' : 'Check Availability'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Time Slots Section */}
      {timeSlots.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
            <FiClock /> Available Time Slots
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {timeSlots.map((slot, idx) => (
              <Card key={idx} className="flex flex-col items-center text-center">
                <p className="text-lg font-semibold text-white mb-3">{slot.time}</p>
                <p className="text-sm text-gray-400 mb-4">
                  {availability?.available ? 'Available' : 'Not Available'}
                </p>
                <Button
                  onClick={() => handleBookSlot(slot)}
                  variant={availability?.available ? 'success' : 'secondary'}
                  disabled={!availability?.available}
                  className="w-full"
                >
                  Book Now
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      {availability && (
        <Card className="mt-8 bg-blue-900 border-blue-700">
          <h3 className="text-lg font-bold text-white mb-2">Status</h3>
          <p className="text-gray-300">{availability.message}</p>
          <p className="text-sm text-gray-400 mt-2">
            Resource ID: {availability.resourceId} | Date: {selectedDate}
          </p>
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

export default ResourceAvailabilityPage;
