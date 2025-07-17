import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FitnessData {
  date: string;
  fitness: number;
  fatigue: number;
  form: number;
  tss: number;
}

interface FitnessChartProps {
  data: FitnessData[];
}

export const FitnessChart: React.FC<FitnessChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(1)}
              {entry.name === 'TSS' ? '' : entry.name === 'Form' ? '' : ' TSS'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Fitness, Fatigue & Form Progression</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis 
              yAxisId="left" 
              stroke="#666" 
              fontSize={12}
              />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#3b82f6" 
              fontSize={12}
/>
            
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="fitness" 
              yAxisId="left" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Fitness (CTL)"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="fatigue" 
              yAxisId="left"
              stroke="#ef4444" 
              strokeWidth={2}
              name="Fatigue (ATL)"
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="form" 
              yAxisId="right"
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Form"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="tss" 
              yAxisId="left"
              stroke="#8b5cf6" 
              strokeWidth={1}
              strokeDasharray="5 5"
              name="Daily TSS"
              dot={{ fill: '#8b5cf6', strokeWidth: 1, r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Fitness (CTL)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Fatigue (ATL)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Form Ratio</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Daily TSS</span>
        </div>
      </div>
    </div>
  );
};