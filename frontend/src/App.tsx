import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/Settings';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) ?? 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <BrowserRouter>
        {/* Navbar is always constrained */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 pt-4 md:pt-8">
          <Navbar />
        </div>
        <Routes>
          {/* Dashboard manages its own width so the map can be full-bleed */}
          <Route path="/" element={<Dashboard />} />
          {/* Settings stays in the standard container */}
          <Route path="/settings" element={
            <div className="max-w-4xl mx-auto px-4 md:px-8 pb-8">
              <SettingsPage />
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}

export default App;
