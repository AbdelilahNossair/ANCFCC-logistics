import React, { useState, useEffect } from 'react';
import { MapPin, Package, TrendingUp } from 'lucide-react';
import { warehousesApi, type Warehouse } from '../services/api';

const WarehouseCards: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await warehousesApi.getAll();
        if (response.success && response.data) {
          setWarehouses(response.data);
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-ancfcc-blue-800 font-semibold mb-6">Warehouse Status</h3>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border border-ancfcc-brown-200 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
      <h3 className="text-ancfcc-blue-800 font-semibold mb-6">Warehouse Status</h3>
      <div className="space-y-4">
        {warehouses.map((warehouse) => {
          // Simulate capacity and occupancy based on asset count
          const assetCount = warehouse.asset_count || 0;
          const estimatedCapacity = Math.max(assetCount + 100, 500); // Estimated capacity
          const occupancyRate = estimatedCapacity > 0 
            ? Math.round((assetCount / estimatedCapacity) * 100) 
            : 0;
          
          return (
            <div key={warehouse.warehouse_id} className="border border-ancfcc-brown-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-white to-ancfcc-blue-50/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-ancfcc-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="text-ancfcc-blue-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-ancfcc-blue-800">{warehouse.warehouse_name}</h4>
                    <p className="text-sm text-ancfcc-brown-600">{warehouse.warehouse_code}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-ancfcc-blue-600">
                  <div className="w-2 h-2 bg-ancfcc-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium">Active</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ancfcc-brown-600">Assets</span>
                  <span className="font-medium">{assetCount} / {estimatedCapacity}</span>
                </div>
                
                <div className="w-full bg-ancfcc-brown-200 rounded-full h-2">
                  <div 
                    className="bg-ancfcc-gradient h-2 rounded-full transition-all duration-300"
                    style={{ width: `${occupancyRate}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-ancfcc-brown-500">
                    <MapPin size={14} />
                    <span className="text-xs">{warehouse.city}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-ancfcc-orange-600">
                    <TrendingUp size={14} />
                    <span className="text-xs font-medium">{occupancyRate}% Full</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WarehouseCards;