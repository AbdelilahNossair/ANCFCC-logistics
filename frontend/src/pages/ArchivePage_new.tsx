import React, { useState, useEffect } from 'react';
import { Search, Filter, Archive, RotateCcw, Trash2, Calendar, Package } from 'lucide-react';
import { archiveApi, ArchivedAsset } from '../services/api';

const ArchivePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [archivedAssets, setArchivedAssets] = useState<ArchivedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchArchivedAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await archiveApi.getArchivedAssets({
          page,
          limit: 10,
          search: searchTerm || undefined,
          category: selectedCategory === 'all' ? undefined : selectedCategory
        });
        setArchivedAssets(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch archived assets');
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedAssets();
  }, [page, searchTerm, selectedCategory]);

  const handleRestore = async (id: number) => {
    try {
      await archiveApi.restoreAsset(id);
      // Refresh the list
      setArchivedAssets(prev => prev.filter(asset => asset.asset_id !== id));
    } catch (err) {
      alert('Failed to restore asset: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this asset? This action cannot be undone.')) {
      return;
    }

    try {
      await archiveApi.deleteAsset(id);
      // Refresh the list
      setArchivedAssets(prev => prev.filter(asset => asset.asset_id !== id));
    } catch (err) {
      alert('Failed to delete asset: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const categories = ['all', 'IT Equipment', 'Furniture', 'Office Supplies', 'Documents'];

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'damaged': return 'bg-red-100 text-red-800';
      case 'new': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Archive Management</h1>
        <div className="flex items-center space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Bulk Restore
          </button>
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            Permanent Delete
          </button>
        </div>
      </div>

      {/* Archive Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Archived</span>
            <Archive className="text-gray-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-800">{archivedAssets.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">This Month</span>
            <Calendar className="text-blue-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {archivedAssets.filter(asset => {
              const assetDate = new Date(asset.updated_at);
              const thisMonth = new Date();
              return assetDate.getMonth() === thisMonth.getMonth() && assetDate.getFullYear() === thisMonth.getFullYear();
            }).length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Restorable</span>
            <RotateCcw className="text-green-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {archivedAssets.filter(asset => asset.condition_state !== 'damaged').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Value</span>
            <Package className="text-purple-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {archivedAssets.reduce((sum, asset) => sum + (asset.acquisition_value || 0), 0).toLocaleString()} MAD
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search archived assets..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to first page when searching
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1); // Reset to first page when filtering
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Filter size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error loading archived assets: {error}</p>
        </div>
      )}

      {/* Archived Assets Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Asset</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Condition</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Archived Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Reason</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Value</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {archivedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No archived assets found
                    </td>
                  </tr>
                ) : (
                  archivedAssets.map((asset) => (
                    <tr key={asset.asset_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Archive className="text-gray-600" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{asset.asset_name}</p>
                            <p className="text-sm text-gray-500">{asset.barcode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{asset.category_name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConditionColor(asset.condition_state)}`}>
                          {asset.condition_state}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(asset.updated_at)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {asset.archive_reason || 'No reason provided'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {asset.acquisition_value ? `${asset.acquisition_value.toLocaleString()} MAD` : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleRestore(asset.asset_id)}
                            className="p-1 text-gray-400 hover:text-green-600" 
                            title="Restore"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(asset.asset_id)}
                            className="p-1 text-gray-400 hover:text-red-600" 
                            title="Permanent Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ArchivePage;
