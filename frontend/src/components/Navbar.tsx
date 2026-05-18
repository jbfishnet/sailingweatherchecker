import React from 'react';
import { Link } from 'react-router-dom';
import { Anchor, Settings, MapPin } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="glass-card mb-6 p-4 flex justify-between items-center sticky top-4 z-50">
      <Link to="/" className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter neon-text">
        <Anchor size={28} />
        <span>Sailing Weather</span>
      </Link>
      <div className="flex gap-6">
        <Link to="/" className="flex items-center gap-1 hover:text-neon-blue transition-colors">
          <MapPin size={20} />
          <span>Spots</span>
        </Link>
        <Link to="/settings" className="flex items-center gap-1 hover:text-neon-blue transition-colors">
          <Settings size={20} />
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
}
