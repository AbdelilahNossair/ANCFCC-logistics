import React, { useState, useEffect } from 'react';
import { Download, BarChart3, PieChart, TrendingUp, FileText, Calendar, Settings } from 'lucide-react';
import { reportsApi, ReportStats } from '../services/api';

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  // Custom report generation state
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customReportType, setCustomReportType] = useState('asset-summary');
  const [generatingCustomReport, setGeneratingCustomReport] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Only fetch report stats
        const statsResponse = await reportsApi.getReportStats(selectedPeriod);
        setReportStats(statsResponse.data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch report data');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
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

  // Generate and download a specific report
  const generateAndDownloadReport = async (reportType: string, reportTitle: string, period?: string) => {
    try {
      setGeneratingReport(reportType);
      
      const reportPeriod = period || selectedPeriod;
      
      let reportData;
      switch (reportType) {
        case 'asset-summary':
          reportData = await reportsApi.generateAssetSummaryReport(reportPeriod);
          break;
        case 'movement-analysis':
          reportData = await reportsApi.generateMovementAnalysisReport(reportPeriod);
          break;
        case 'inventory-status':
          reportData = await reportsApi.generateInventoryStatusReport(reportPeriod);
          break;
        case 'delivery-report':
          reportData = await reportsApi.generateDeliveryReport(reportPeriod);
          break;
        default:
          throw new Error('Unknown report type');
      }

      if (!reportData.data) {
        throw new Error('No data received for report');
      }

      // Generate CSV content based on report type
      const csvContent = generateCSVContent(reportData.data, reportType);
      
      // Create and download file
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `${reportType.replace('-', '_')}_${dateStr}_${timeStr}.csv`;
      link.setAttribute('download', filename);
      
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`${reportTitle} generated and downloaded successfully!`);
      
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error);
      alert(`Failed to generate ${reportTitle}. Please try again.`);
    } finally {
      setGeneratingReport(null);
    }
  };

  // Generate CSV content based on report type
  const generateCSVContent = (data: any, reportType: string): string => {
    let headers: string[] = [];
    let rows: any[][] = [];

    switch (reportType) {
      case 'asset-summary':
        headers = ['Asset ID', 'Barcode', 'Asset Name', 'Category', 'Brand', 'Model', 'Condition', 'Status', 'Acquisition Date', 'Value (MAD)', 'Zone', 'Warehouse'];
        rows = (data.assets || []).map((asset: any) => [
          asset.asset_id,
          asset.barcode,
          asset.asset_name,
          asset.category_name || 'N/A',
          asset.brand || 'N/A',
          asset.model || 'N/A',
          asset.condition_state,
          asset.status,
          asset.acquisition_date || 'N/A',
          asset.acquisition_value || 0,
          asset.zone_name || 'N/A',
          asset.warehouse_name || 'N/A'
        ]);
        break;

      case 'movement-analysis':
        headers = ['Movement ID', 'Asset Name', 'Asset Barcode', 'Movement Type', 'From Zone', 'To Zone', 'Recipient', 'User', 'Movement Date', 'Notes'];
        rows = (data.movements || []).map((movement: any) => [
          movement.movement_id,
          movement.asset_name || 'N/A',
          movement.barcode || 'N/A',
          movement.movement_type,
          movement.from_zone || 'N/A',
          movement.to_zone || 'N/A',
          movement.recipient_name || 'N/A',
          movement.user_name || 'N/A',
          new Date(movement.movement_date).toLocaleDateString(),
          movement.notes || 'N/A'
        ]);
        break;

      case 'inventory-status':
        headers = ['Warehouse', 'Zone', 'Capacity', 'Current Count', 'Occupancy %'];
        rows = (data.zoneOccupancy || []).map((zone: any) => [
          zone.warehouse_name,
          zone.zone_name,
          zone.capacity,
          zone.current_count,
          zone.occupancy_percentage || 0
        ]);
        break;

      case 'delivery-report':
        headers = ['Delivery ID', 'Tracking Number', 'Asset Name', 'Asset Barcode', 'Recipient', 'Status', 'Handover Date', 'Delivery Date', 'Delivery Days'];
        rows = (data.deliveries || []).map((delivery: any) => [
          delivery.delivery_id,
          delivery.tracking_number || 'N/A',
          delivery.asset_name || 'N/A',
          delivery.barcode || 'N/A',
          delivery.recipient_name || 'N/A',
          delivery.delivery_status,
          delivery.handover_date ? new Date(delivery.handover_date).toLocaleDateString() : 'N/A',
          delivery.delivery_date ? new Date(delivery.delivery_date).toLocaleDateString() : 'N/A',
          delivery.delivery_days || 'N/A'
        ]);
        break;

      default:
        headers = ['Data'];
        rows = [['No data available']];
    }

    // Combine headers and data
    return [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  };

  // Export all reports as a comprehensive package
  const exportAllReports = async () => {
    try {
      alert('Generating comprehensive report package. This may take a moment...');
      
      const reports = [
        { type: 'asset-summary', title: 'Asset Summary Report' },
        { type: 'movement-analysis', title: 'Movement Analysis Report' },
        { type: 'inventory-status', title: 'Inventory Status Report' },
        { type: 'delivery-report', title: 'Delivery Report' }
      ];

      for (const report of reports) {
        await generateAndDownloadReport(report.type, report.title);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      alert('All reports have been generated and downloaded successfully!');
    } catch (error) {
      console.error('Error exporting all reports:', error);
      alert('Failed to export all reports. Please try again.');
    }
  };

  // Generate custom report with date range
  const generateCustomReport = async () => {
    if (!customStartDate || !customEndDate) {
      alert('Please select both start and end dates.');
      return;
    }

    if (new Date(customStartDate) > new Date(customEndDate)) {
      alert('Start date must be before end date.');
      return;
    }

    try {
      setGeneratingCustomReport(true);
      
      const reportTypeMap = {
        'asset-summary': { 
          title: 'Asset Summary Report', 
          api: reportsApi.generateCustomAssetSummaryReport 
        },
        'movement-analysis': { 
          title: 'Movement Analysis Report', 
          api: reportsApi.generateCustomMovementAnalysisReport 
        },
        'inventory-status': { 
          title: 'Inventory Status Report', 
          api: reportsApi.generateCustomInventoryStatusReport 
        },
        'delivery-report': { 
          title: 'Delivery Report', 
          api: reportsApi.generateCustomDeliveryReport 
        }
      };

      const selectedReport = reportTypeMap[customReportType as keyof typeof reportTypeMap];
      
      // Call the custom API with date range
      const reportData = await selectedReport.api(customStartDate, customEndDate);

      if (!reportData.data) {
        throw new Error('No data received for report');
      }

      // Generate CSV content based on report type
      const csvContent = generateCSVContent(reportData.data, customReportType);
      
      // Create and download file
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const startDateStr = customStartDate.replace(/-/g, '');
      const endDateStr = customEndDate.replace(/-/g, '');
      const filename = `${customReportType.replace('-', '_')}_${startDateStr}_to_${endDateStr}.csv`;
      link.setAttribute('download', filename);
      
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`${selectedReport.title} for ${customStartDate} to ${customEndDate} generated and downloaded successfully!`);
      
    } catch (error) {
      console.error('Error generating custom report:', error);
      alert('Failed to generate custom report. Please try again.');
    } finally {
      setGeneratingCustomReport(false);
    }
  };

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
          <button 
            onClick={exportAllReports}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
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
                    <button 
                      onClick={() => generateAndDownloadReport(report.id, report.title)}
                      disabled={generatingReport === report.id}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingReport === report.id ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-gray-800 text-lg mb-2">{report.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{report.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last generated: {report.lastGenerated}</span>
                    <button 
                      onClick={() => generateAndDownloadReport(report.id, report.title)}
                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reports Generation */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-800 font-semibold">Custom Reports Generation</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Generate reports with custom date ranges</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Date Range Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={customReportType}
                  onChange={(e) => setCustomReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="asset-summary">Asset Summary Report</option>
                  <option value="movement-analysis">Movement Analysis Report</option>
                  <option value="inventory-status">Inventory Status Report</option>
                  <option value="delivery-report">Delivery Report</option>
                </select>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end">
                <button
                  onClick={generateCustomReport}
                  disabled={generatingCustomReport || !customStartDate || !customEndDate}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {generatingCustomReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Generate & Download Report</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Settings className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">How to use:</h4>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Select a start date and end date for your report</li>
                        <li>Choose the type of report you want to generate</li>
                        <li>Click "Generate & Download Report" to create your custom report</li>
                        <li>The report will include only data within your selected date range</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Report Generation
          <div className="bg-white rounded-2xl p-6 shadow-sm mt-8">
            <h3 className="text-gray-800 font-semibold mb-4">Generate Custom Report</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={customReportType}
                onChange={(e) => setCustomReportType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="asset-summary">Asset Summary Report</option>
                <option value="movement-analysis">Movement Analysis Report</option>
                <option value="inventory-status">Inventory Status Report</option>
                <option value="delivery-report">Delivery Report</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={generateCustomReport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
              >
                {generatingCustomReport && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-200 mr-2"></div>
                )}
                <span>Generate Custom Report</span>
              </button>
            </div>
            
          </div>
           */}
        </>
      )}
    </div>
  );
};

export default ReportsPage;
