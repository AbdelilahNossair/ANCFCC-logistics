import React from 'react';

interface AssetCardProps {
  title: string;
  value: string;
  change: string;
  color: string;
  icon: React.ReactNode;
}

const AssetCard: React.FC<AssetCardProps> = ({ title, value, change, color, icon }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm text-ancfcc-brown-600 font-medium">{change}</span>
      </div>
      <h3 className="text-2xl font-bold text-ancfcc-blue-800 mb-1">{value}</h3>
      <p className="text-ancfcc-brown-600 text-sm font-medium">{title}</p>
    </div>
  );
};

export default AssetCard;