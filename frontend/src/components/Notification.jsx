import React from 'react';
import { FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';

const Notification = ({ type = 'success', message, onClose }) => {
  const colors = {
    success: 'bg-green-600 border-green-700',
    error: 'bg-red-600 border-red-700',
    warning: 'bg-yellow-600 border-yellow-700',
    info: 'bg-blue-600 border-blue-700',
  };

  const icons = {
    success: <FiCheck size={20} />,
    error: <FiX size={20} />,
    warning: <FiAlertCircle size={20} />,
    info: <FiAlertCircle size={20} />,
  };

  return (
    <div className={`fixed top-4 right-4 flex items-center gap-3 px-6 py-4 rounded shadow-lg border ${colors[type]} text-white max-w-md animate-pulse`}>
      {icons[type]}
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-bold">×</button>
    </div>
  );
};

export default Notification;
