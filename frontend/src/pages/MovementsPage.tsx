import React, { useState, useEffect } from 'react';
import { Search, Filter, Truck, Package, User, Calendar, Download, ChevronDown } from 'lucide-react';
import { movementsApi, type Movement } from '../services/api';

const MovementsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Fetch movements
  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedType !== 'all') params.movement_type = selectedType.toLowerCase();

      const response = await movementsApi.getAll(params);
      setMovements(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch movements');
      console.error('Error fetching movements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [currentPage, searchTerm, selectedType]);

  const movementTypes = ['all', 'reception', 'storage', 'preparation', 'handover_amana', 'delivery', 'return'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Transit': return 'bg-orange-100 text-orange-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'storage':
      case 'preparation': return <Truck className="text-blue-600" size={16} />;
      case 'handover_amana': return <User className="text-green-600" size={16} />;
      case 'delivery': return <Package className="text-orange-600" size={16} />;
      case 'reception': return <Package className="text-purple-600" size={16} />;
      default: return <Package className="text-gray-600" size={16} />;
    }
  };

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.asset_barcode?.includes(searchTerm) ||
                         movement.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || movement.movement_type === selectedType;
    return matchesSearch && matchesType;
  });

  // Export movements to CSV
  const exportMovements = () => {
    try {
      if (filteredMovements.length === 0) {
        alert('No movements to export. Please adjust your filters or ensure there are movements in the system.');
        return;
      }

      // Prepare CSV headers
      const headers = [
        'Movement ID',
        'Asset Name',
        'Asset Barcode',
        'Movement Type',
        'From Zone',
        'To Zone',
        'Recipient',
        'User',
        'Movement Date',
        'Notes'
      ];

      // Prepare CSV data
      const csvData = filteredMovements.map(movement => [
        movement.movement_id,
        movement.asset_name || 'N/A',
        movement.asset_barcode || 'N/A',
        movement.movement_type.replace('_', ' ').toUpperCase(),
        movement.from_zone_name || 'N/A',
        movement.to_zone_name || 'N/A',
        movement.recipient_name || 'N/A',
        movement.user_name || 'N/A',
        new Date(movement.movement_date).toLocaleDateString('en-GB'),
        movement.notes || 'N/A'
      ]);

      // Combine headers and data
      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Add BOM for proper UTF-8 encoding
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename with current date and filter info
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filterSuffix = selectedType !== 'all' ? `_${selectedType}` : '';
      const searchSuffix = searchTerm ? `_filtered` : '';
      const filename = `asset_movements_${dateStr}_${timeStr}${filterSuffix}${searchSuffix}.csv`;
      link.setAttribute('download', filename);
      
      // Trigger download
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Exported ${filteredMovements.length} movements to ${filename}`);
      
      // Show success message
      const successMsg = `Successfully exported ${filteredMovements.length} movement records to ${filename}`;
      alert(successMsg);
      
    } catch (error) {
      console.error('Error exporting movements:', error);
      alert('Failed to export movements. Please try again.');
    }
  };

  // Export all movements (without filters)
  const exportAllMovements = async () => {
    try {
      // Fetch all movements without pagination
      const response = await movementsApi.getAll({ limit: 10000 }); // Large limit to get all
      const allMovements = response.data || [];
      
      if (allMovements.length === 0) {
        alert('No movements found in the system.');
        return;
      }

      // Use the same export logic but with all movements
      const headers = [
        'Movement ID',
        'Asset Name',
        'Asset Barcode',
        'Movement Type',
        'From Zone',
        'To Zone',
        'Recipient',
        'User',
        'Movement Date',
        'Notes'
      ];

      const csvData = allMovements.map(movement => [
        movement.movement_id,
        movement.asset_name || 'N/A',
        movement.asset_barcode || 'N/A',
        movement.movement_type.replace('_', ' ').toUpperCase(),
        movement.from_zone_name || 'N/A',
        movement.to_zone_name || 'N/A',
        movement.recipient_name || 'N/A',
        movement.user_name || 'N/A',
        new Date(movement.movement_date).toLocaleDateString('en-GB'),
        movement.notes || 'N/A'
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `all_asset_movements_${dateStr}_${timeStr}.csv`;
      link.setAttribute('download', filename);
      
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`Successfully exported all ${allMovements.length} movement records to ${filename}`);
      
    } catch (error) {
      console.error('Error exporting all movements:', error);
      alert('Failed to export all movements. Please try again.');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
          setShowExportDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading movements...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Asset Movements</h1>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download size={20} />
              <span>Export Report</span>
              <ChevronDown size={16} />
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-2">
                  <button
                    onClick={() => {
                      exportMovements();
                      setShowExportDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="font-medium">Export Filtered Results</div>
                    <div className="text-xs text-gray-500">
                      Export {filteredMovements.length} filtered movements
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      exportAllMovements();
                      setShowExportDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="font-medium">Export All Movements</div>
                    <div className="text-xs text-gray-500">
                      Export all movements from database
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by asset, barcode, or recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {movementTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Filter size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Asset</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Movement</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">From/To</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Recipient</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMovements.map((movement) => (
                <tr key={movement.movement_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-800">{movement.asset_name || 'Unknown Asset'}</p>
                      <p className="text-sm text-gray-500">{movement.asset_barcode || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(movement.movement_type)}
                      <span className="text-sm font-medium text-gray-800 capitalize">
                        {movement.movement_type.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {movement.from_zone_name && (
                        <p className="text-gray-600">From: {movement.from_zone_name}</p>
                      )}
                      {movement.to_zone_name && (
                        <p className="text-gray-600">To: {movement.to_zone_name}</p>
                      )}
                      {!movement.from_zone_name && !movement.to_zone_name && '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {movement.recipient_name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Calendar size={14} />
                      <span>{new Date(movement.movement_date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor('completed')}`}>
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {movement.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MovementsPage;