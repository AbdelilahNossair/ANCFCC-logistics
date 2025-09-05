import React, { useState, useEffect } from 'react';
import { Download, Calendar, BarChart3, PieChart, TrendingUp, FileText } from 'lucide-react';
import { reportsApi, ReportStats } from '../services/api';

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await reportsApi.getReportStats(selectedPeriod);
        setReportStats(response.data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch report data');
      } finally {
        setLoading(false);
      }
    };

    fetchReportStats();
  }, [selectedPeriod]);

  const reportTypes = [
    {
      id: 'asset-summary',
      title: 'Asset Summary Report',
      description: 'Complete overview of all assets by category and status',
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-600',
      lastGenerated: '2024-01-15'
    },
    {
      id: 'movement-analysis',
      title: 'Movement Analysis',
      description: 'Detailed analysis of asset movements and transfers',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600',
      lastGenerated: '2024-01-14'
    },
    {
      id: 'inventory-status',
      title: 'Inventory Status',
      description: 'Current inventory levels and warehouse capacity',
      icon: PieChart,
      color: 'bg-purple-100 text-purple-600',
      lastGenerated: '2024-01-13'
    },
    {
      id: 'delivery-report',
      title: 'Delivery Report',
      description: 'Status and performance of deliveries via Amana',
      icon: FileText,
      color: 'bg-orange-100 text-orange-600',
      lastGenerated: '2024-01-12'
    }
  ];

  const quickStats = reportStats?.quickStats || [
    { label: 'Total Assets', value: '0', change: '0%', color: 'text-blue-600' },
    { label: 'Active Movements', value: '0', change: '0%', color: 'text-green-600' },
    { label: 'Pending Deliveries', value: '0', change: '0%', color: 'text-orange-600' },
    { label: 'Archived Items', value: '0', change: '0%', color: 'text-gray-600' }
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors">
            <Download size={20} />
            <span>Export All</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error loading reports: {error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {quickStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{stat.label}</span>
                  <span className={`text-sm font-medium ${stat.color}`}>{stat.change}</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            ))}
          </div>
        </>
      )}

          {/* Report Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <div key={report.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${report.color} flex items-center justify-center`}>
                      <Icon size={24} />
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      Generate
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-gray-800 text-lg mb-2">{report.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{report.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last generated: {report.lastGenerated}</span>
                    <button className="text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-gray-800 font-semibold mb-6">Recent Reports</h3>
            <div className="space-y-4">
              {[
                { name: 'Monthly Asset Summary - January 2024', date: '2024-01-15', size: '2.3 MB', type: 'PDF' },
                { name: 'Weekly Movement Report - Week 2', date: '2024-01-14', size: '1.8 MB', type: 'Excel' },
                { name: 'Inventory Status Report', date: '2024-01-13', size: '1.2 MB', type: 'PDF' },
                { name: 'Delivery Performance Analysis', date: '2024-01-12', size: '3.1 MB', type: 'PDF' }
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-gray-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{report.name}</p>
                      <p className="text-sm text-gray-500">{report.date} • {report.size} • {report.type}</p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700">
                    <Download size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;