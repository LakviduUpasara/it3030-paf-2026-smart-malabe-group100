import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ResourceAvailabilityPage from './pages/ResourceAvailabilityPage';
import CreateBookingPage from './pages/CreateBookingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ResourceAvailabilityPage />} />
          <Route path="/bookings" element={<MyBookingsPage />} />
          <Route path="/booking/create" element={<CreateBookingPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
