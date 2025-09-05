import React from 'react';
import { Package, Truck, UserPlus, Archive, AlertTriangle, CheckCircle } from 'lucide-react';

const RecentTransactions: React.FC = () => {
  const transactions = [
    {
      id: 1,
      type: 'Asset Received',
      description: 'Dell Laptop Model XPS',
      time: 'August 05, 2020',
      amount: 'NEW',
      status: 'positive',
      icon: Package,
      color: 'bg-ancfcc-orange-100 text-ancfcc-orange-600'
    },
    {
      id: 2,
      type: 'Transfer',
      description: 'Office Chair to Zone A2',
      time: 'August 04, 2020',
      amount: 'MOVED',
      status: 'neutral',
      icon: Truck,
      color: 'bg-ancfcc-blue-100 text-ancfcc-blue-600'
    },
    {
      id: 3,
      type: 'Assignment',
      description: 'IT Equipment to M. Hassan',
      time: 'August 04, 2020',
      amount: 'ASSIGNED',
      status: 'positive',
      icon: UserPlus,
      color: 'bg-ancfcc-brown-100 text-ancfcc-brown-600'
    },
    {
      id: 4,
      type: 'Delivery',
      description: 'Furniture Set via Amana',
      time: 'August 04, 2020',
      amount: 'DELIVERED',
      status: 'neutral',
      icon: CheckCircle,
      color: 'bg-ancfcc-orange-100 text-ancfcc-orange-600'
    },
    {
      id: 5,
      type: 'Maintenance',
      description: 'Printer Repair Required',
      time: 'August 04, 2020',
      amount: 'REPAIR',
      status: 'negative',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600'
    },
    {
      id: 6,
      type: 'Archive',
      description: 'Old Documents Storage',
      time: 'August 04, 2020',
      amount: 'ARCHIVED',
      status: 'neutral',
      icon: Archive,
      color: 'bg-gray-100 text-gray-600'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-ancfcc-blue-800 font-semibold">Recent Transactions</h3>
        <button className="text-ancfcc-brown-400 hover:text-ancfcc-brown-600">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        {transactions.map((transaction) => {
          const Icon = transaction.icon;
          return (
            <div key={transaction.id} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`w-10 h-10 rounded-lg ${transaction.color} flex items-center justify-center`}>
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ancfcc-blue-800">{transaction.type}</p>
                <p className="text-xs text-ancfcc-brown-600">{transaction.description}</p>
                <p className="text-xs text-ancfcc-brown-500">{transaction.time}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${
                  transaction.status === 'positive' ? 'text-ancfcc-blue-600' :
                  transaction.status === 'negative' ? 'text-red-600' : 'text-ancfcc-brown-600'
                }`}>
                  {transaction.amount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentTransactions;