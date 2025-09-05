import React from 'react';
import { Package, Truck, QrCode, FileText, Users, Archive } from 'lucide-react';

interface QuickAccessProps {
  onActionClick: (action: string) => void;
}

const QuickAccess: React.FC<QuickAccessProps> = ({ onActionClick }) => {
  const quickActions = [
    { id: 'receive', label: 'Receive', icon: Package, color: 'bg-ancfcc-blue-100 text-ancfcc-blue-600' },
    { id: 'transfer', label: 'Transfer', icon: Truck, color: 'bg-ancfcc-orange-100 text-ancfcc-orange-600' },
    { id: 'scan', label: 'Scan Asset', icon: QrCode, color: 'bg-ancfcc-brown-100 text-ancfcc-brown-600' },
    { id: 'delivery', label: 'Delivery', icon: FileText, color: 'bg-ancfcc-orange-100 text-ancfcc-orange-700' },
    { id: 'assign', label: 'Assign', icon: Users, color: 'bg-ancfcc-blue-100 text-ancfcc-blue-700' },
    { id: 'archive', label: 'Archive', icon: Archive, color: 'bg-ancfcc-brown-100 text-ancfcc-brown-700' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-gray-800 font-semibold mb-6 text-lg">Quick Access</h3>
      <div className="grid grid-cols-6 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onActionClick(action.id)}
              className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
              </div>
              <span className="text-sm text-gray-700 font-medium text-center">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickAccess;