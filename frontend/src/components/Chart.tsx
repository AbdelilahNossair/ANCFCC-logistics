import React from 'react';

interface ChartProps {
  title: string;
  data: number[];
  labels: string[];
  color: string;
  subtitle?: string;
}

const Chart: React.FC<ChartProps> = ({ title, data, labels, color, subtitle }) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const avgValue = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-ancfcc-blue-800 font-semibold text-lg">{title}</h3>
          {subtitle && <p className="text-sm text-ancfcc-brown-600 mt-1">{subtitle}</p>}
        </div>
        <button className="text-ancfcc-brown-400 hover:text-ancfcc-brown-600">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>
      
      <div className="flex items-end space-x-3 h-40 mb-4">
        {data.map((value, index) => {
          // Calculate height as percentage of maxValue, with minimum height for visibility
          const heightPercentage = maxValue > 0 ? Math.max((value / maxValue) * 100, 15) : 15;
          const heightInPixels = Math.max((value / maxValue) * 160, 20); // 160px is the container height (h-40)
          
          console.log(`Bar ${index}: value=${value}, maxValue=${maxValue}, heightPercentage=${heightPercentage}%`);
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center group">
              <div className="relative w-full flex flex-col justify-end" style={{ height: '160px' }}>
                <div 
                  className={`w-full ${color} rounded-t-lg transition-all duration-500 ease-out relative`}
                  style={{ 
                    height: `${heightInPixels}px`,
                    minHeight: '20px'
                  }}
                >
                  {/* Value label on hover */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-ancfcc-brown-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow border">
                    {value}
                  </div>
                </div>
              </div>
              <span className="text-xs text-ancfcc-brown-600 mt-2 font-medium">{labels[index]}</span>
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-ancfcc-brown-600">Peak: {maxValue}</span>
        <span className="text-ancfcc-brown-600">Avg: {avgValue}</span>
        <span className="text-ancfcc-brown-600">Min: {minValue}</span>
      </div>
    </div>
  );
};

export default Chart;