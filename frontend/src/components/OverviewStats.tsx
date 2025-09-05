import React, { useState, useEffect } from 'react';
import { generalApi, type DashboardStats } from '../services/api';

const OverviewStats: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await generalApi.getDashboardStats();
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching overview stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500">No data available</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  const statsData = [
    {
      title: 'Assets Overview',
      subtitle: 'Total assets in system',
      value: stats.totalAssets.toLocaleString(),
      change: '+12% from last month',
      items: stats.assetsByStatus.slice(0, 2).map(item => ({
        label: `${item.count} ${item.status}`,
        value: item.count.toString(),
        color: item.status === 'available' ? 'text-green-500' : 'text-blue-500'
      }))
    },
    {
      title: 'Movement Overview',
      subtitle: 'Total movements recorded',
      value: stats.totalMovements?.toString() || '0',
      change: '+15% from last week',
      items: stats.movementsByType.slice(0, 2).map(item => ({
        label: `${item.count} ${item.movement_type.replace('_', ' ')}`,
        value: item.count.toString(),
        color: 'text-green-500'
      }))
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      {statsData.map((stat, index) => (
        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-800 font-semibold">{stat.title}</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.subtitle}</p>
          </div>
          
          <div className="space-y-3">
            {stat.items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{item.label}</p>
                </div>
                <span className={`text-sm font-medium ${item.color}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OverviewStats;