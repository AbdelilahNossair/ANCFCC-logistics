import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Package, Edit, Trash2, Eye } from 'lucide-react';
import { assetsApi, generalApi, type Asset, type AssetCategory } from '../services/api';

const AssetsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch assets
  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'all') params.category_id = parseInt(selectedCategory);
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const response = await assetsApi.getAll(params);
      setAssets(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await generalApi.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [currentPage, searchTerm, selectedCategory, selectedStatus]);

  // Filter assets based on search criteria
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchTerm || 
      asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      asset.category_id === parseInt(selectedCategory);
    
    const matchesStatus = selectedStatus === 'all' || 
      asset.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAssets();
  };

  if (loading && assets.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ancfcc-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading assets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={fetchAssets}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold bg-ancfcc-gradient bg-clip-text text-transparent">Assets Management</h1>
        <button className="bg-ancfcc-gradient text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-lg transition-all duration-300">
          <Plus size={20} />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ancfcc-brown-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-ancfcc-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ancfcc-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-ancfcc-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ancfcc-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.category_id || 'unknown'} value={category.category_id ? category.category_id.toString() : 'unknown'}>
                {category.category_name}
              </option>
            ))}
          </select>
          <button className="p-2 border border-ancfcc-brown-200 rounded-lg hover:bg-ancfcc-blue-50">
            <Filter size={20} className="text-ancfcc-brown-600" />
          </button>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-ancfcc-blue-50 to-ancfcc-orange-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-ancfcc-blue-700">Asset</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-ancfcc-blue-700">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-ancfcc-blue-700">Details</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-ancfcc-blue-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-ancfcc-blue-700">Zone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-ancfcc-blue-700">Value</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-ancfcc-blue-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ancfcc-brown-200">
              {filteredAssets.map((asset, index) => (
                <tr key={asset.asset_id || `asset-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-ancfcc-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="text-ancfcc-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-ancfcc-blue-800">{asset.asset_name}</p>
                        <p className="text-sm text-ancfcc-brown-600">{asset.barcode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-ancfcc-brown-700">{asset.category_name || 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-ancfcc-blue-800">{asset.brand} {asset.model}</p>
                      <p className="text-ancfcc-brown-600">SN: {asset.serial_number || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-ancfcc-brown-700">{asset.zone_name || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-ancfcc-blue-800">
                    {asset.acquisition_value ? `${asset.acquisition_value.toLocaleString()} MAD` : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-ancfcc-brown-400 hover:text-ancfcc-blue-600">
                        <Eye size={16} />
                      </button>
                      <button className="p-1 text-ancfcc-brown-400 hover:text-ancfcc-orange-600">
                        <Edit size={16} />
                      </button>
                      <button className="p-1 text-ancfcc-brown-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
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

export default AssetsPage;