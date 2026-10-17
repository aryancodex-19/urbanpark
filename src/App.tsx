import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ParkingProvider } from './context/ParkingContext';
import { UserPage } from './pages/UserPage';
import { OperatorPage } from './pages/OperatorPage';

export const App: React.FC = () => {
  return (
    <ParkingProvider>
      <Routes>
        <Route path="/" element={<UserPage />} />
        <Route path="/operator" element={<OperatorPage />} />
        {/* Support legacy route names for backwards compatibility */}
        <Route path="/operator.html" element={<Navigate to="/operator" replace />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ParkingProvider>
  );
};

export default App;
