import React, { useState } from 'react';
import { Calendar, Info } from 'lucide-react';

interface PlanDateSelectorProps {
  onDateSelected: (startDate: Date) => void;
}

export const PlanDateSelector: React.FC<PlanDateSelectorProps> = ({ onDateSelected }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate) {
      const startDate = new Date(selectedDate);
      onDateSelected(startDate);
    }
  };

  const getNextMonday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // If Sunday (0), next Monday is 1 day away
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  };

  const suggestedDate = getNextMonday();

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Set Plan Start Date</h3>
        <p className="text-gray-600">
          Choose when your training plan begins
        </p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Important:</p>
            <ul className="space-y-1">
              <li>• Training plans should start on a <strong>Monday</strong></li>
              <li>• This ensures proper week alignment in your schedule</li>
              <li>• The suggested date below is the next Monday</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
            Plan Start Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Suggested: {new Date(suggestedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedDate(suggestedDate)}
          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 mb-2"
        >
          Use Next Monday ({new Date(suggestedDate).toLocaleDateString()})
        </button>

        <button
          type="submit"
          disabled={!selectedDate}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Continue with This Date
        </button>
      </form>
    </div>
  );
};