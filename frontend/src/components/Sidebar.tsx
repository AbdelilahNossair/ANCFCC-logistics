import React from 'react';
import { Home, Package, Users, BarChart3, Settings, Truck, Archive } from 'lucide-react';
import ancfccLogo from '../assets/ancfcc-logo.jpeg';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'assets', label: 'Assets', icon: Package },
    { id: 'movements', label: 'Movements', icon: Truck },
    { id: 'recipients', label: 'Recipients', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-20 bg-gradient-to-b from-ancfcc-blue-600 to-ancfcc-orange-600 min-h-screen flex flex-col items-center py-6">
      {/* User Profile */}
      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-8 border border-white/30 overflow-hidden">
        <img 
          src={ancfccLogo} 
          alt="ANCFCC Logo" 
          className="w-16 h-16 object-contain"
        />
      </div>

      {/* Menu Items */}
      <nav className="flex flex-col space-y-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm ${
                activeTab === item.id
                  ? 'bg-white/25 text-white shadow-lg border border-white/30'
                  : 'text-white/70 hover:text-white hover:bg-white/15 border border-transparent'
              }`}
              title={item.label}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;