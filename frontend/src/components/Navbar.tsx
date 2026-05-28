import React from 'react';
import { Link } from 'react-router-dom';
import { Anchor, Settings, MapPin, Sun, Moon } from 'lucide-react';
import { useTheme } from '../App';

export default function Navbar() {
  const { theme, toggle } = useTheme();

  return (
    <nav className="glass-card mb-6 p-4 flex justify-between items-center sticky top-4 z-50">
      <Link to="/" className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter neon-text">
        <Anchor size={28} />
        <span>Sailing Weather</span>
      </Link>
      <div className="flex gap-4 items-center">
        <Link to="/" className="flex items-center gap-1 hover:text-neon-blue transition-colors text-sm">
          <MapPin size={18} />
          <span className="hidden sm:inline">Spots</span>
        </Link>
        <Link to="/settings" className="flex items-center gap-1 hover:text-neon-blue transition-colors text-sm">
          <Settings size={18} />
          <span className="hidden sm:inline">Settings</span>
        </Link>
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Switch to day mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-neon-blue" />}
        </button>
      </div>
    </nav>
  );
}
