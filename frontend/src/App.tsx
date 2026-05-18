import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
