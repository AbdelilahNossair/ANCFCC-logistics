import React, { useState } from 'react';
import { Search, Filter, Archive, RotateCcw, Trash2, Calendar, Package } from 'lucide-react';

const ArchivePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const archivedAssets = [
    {
      id: 1,
      barcode: '1234567894',
      name: 'Old Desktop Computer',
      category: 'IT Equipment',
      brand: 'Dell',
      model: 'OptiPlex 3020',
      archivedDate: '2023-12-15',
      archivedBy: 'Admin User',
      reason: 'End of life cycle',
      originalValue: '8500.00',
      condition: 'Poor'
    },
    {
      id: 2,
      barcode: '1234567895',
      name: 'Wooden Office Desk',
      category: 'Furniture',
      brand: 'IKEA',
      model: 'BEKANT',
      archivedDate: '2023-12-10',
      archivedBy: 'Warehouse Manager',
      reason: 'Damaged beyond repair',
      originalValue: '2500.00',
      condition: 'Damaged'
    },
    {
      id: 3,
      barcode: '1234567896',
      name: 'Laser Printer HP 1020',
      category: 'IT Equipment',
      brand: 'HP',
      model: 'LaserJet 1020',
      archivedDate: '2023-12-05',
      archivedBy: 'IT Manager',
      reason: 'Obsolete technology',
      originalValue: '1200.00',
      condition: 'Fair'
    },
    {
      id: 4,
      barcode: '1234567897',
      name: 'Filing Cabinet Metal',
      category: 'Furniture',
      brand: 'Steelcase',
      model: 'Series 9000',
      archivedDate: '2023-11-28',
      archivedBy: 'Admin User',
      reason: 'Office reorganization',
      originalValue: '1800.00',
      condition: 'Good'
    }
  ];

  const categories = ['all', 'IT Equipment', 'Furniture', 'Office Supplies', 'Documents'];

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Good': return 'bg-green-100 text-green-800';
      case 'Fair': return 'bg-yellow-100 text-yellow-800';
      case 'Poor': return 'bg-orange-100 text-orange-800';
      case 'Damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAssets = archivedAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.barcode.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <p className="text-2xl font-bold text-gray-800">105</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">This Month</span>
            <Calendar className="text-blue-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-800">12</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Restorable</span>
            <RotateCcw className="text-green-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-800">78</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Value</span>
            <Package className="text-purple-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-800">245K MAD</p>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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

      {/* Archived Assets Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
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
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Archive className="text-gray-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{asset.name}</p>
                        <p className="text-sm text-gray-500">{asset.barcode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{asset.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConditionColor(asset.condition)}`}>
                      {asset.condition}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{asset.archivedDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{asset.reason}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{asset.originalValue} MAD</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-gray-400 hover:text-green-600" title="Restore">
                        <RotateCcw size={16} />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600" title="Permanent Delete">
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

export default ArchivePage;