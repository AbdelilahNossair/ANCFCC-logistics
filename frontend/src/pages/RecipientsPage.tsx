import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, User, Phone, Mail, Building, Edit, Trash2, Eye } from 'lucide-react';
import { recipientsApi, type Recipient } from '../services/api';

const RecipientsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch recipients
  const fetchRecipients = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedDepartment !== 'all') params.department = selectedDepartment;

      const response = await recipientsApi.getAll(params);
      setRecipients(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipients');
      console.error('Error fetching recipients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, [currentPage, searchTerm, selectedDepartment]);

  const departments = ['all', 'IT Department', 'Finance Department', 'HR Department', 'Operations', 'Administration'];

  const filteredRecipients = recipients.filter(recipient => {
    const fullName = `${recipient.first_name} ${recipient.last_name}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) ||
      (recipient.cin && recipient.cin.toLowerCase().includes(searchTerm.toLowerCase())) ||
      recipient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || recipient.department_name === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading recipients...</div>
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
        <h1 className="text-3xl font-bold text-gray-800">Recipients Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          <span>Add Recipient</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, CIN, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Filter size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Recipients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipients.map((recipient) => (
          <div key={recipient.recipient_id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="text-blue-600" size={24} />
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-400 hover:text-blue-600">
                  <Eye size={16} />
                </button>
                <button className="p-1 text-gray-400 hover:text-green-600">
                  <Edit size={16} />
                </button>
                <button className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">
                  {recipient.first_name} {recipient.last_name}
                </h3>
                <p className="text-sm text-gray-500">CIN: {recipient.cin}</p>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Building size={14} />
                <span>{recipient.department_name}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone size={14} />
                <span>{recipient.phone}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail size={14} />
                <span className="truncate">{recipient.email}</span>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Address</span>
                  <span className="text-gray-500 truncate">{recipient.address}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Created</span>
                  <span className="text-gray-500">{new Date(recipient.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipientsPage;