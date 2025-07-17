import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, Target, Info, Calendar } from 'lucide-react';

interface FitnessInitializerProps {
  onInitialize: (fitness: number, fatigue: number, startDate: Date) => void;
}

export const FitnessInitializer: React.FC<FitnessInitializerProps> = ({ onInitialize }) => {
  const [fitness, setFitness] = useState<string>('45');
  const [fatigue, setFatigue] = useState<string>('55');
  const [selectedDate, setSelectedDate] = useState<string>('');


  
  const getNextMonday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Calculate days until next Monday
    // Sunday = 0, Monday = 1, Tuesday = 2, ..., Saturday = 6
    let daysUntilMonday;
    if (dayOfWeek === 0) { // Sunday
      daysUntilMonday = 1;
    } else if (dayOfWeek === 1) { // Monday
      daysUntilMonday = 0; // Next Monday is 7 days away
    } else { // Tuesday through Saturday
      daysUntilMonday = 8 - dayOfWeek;
    }
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toLocaleDateString();
  };

  const suggestedDate = getNextMonday();
  useEffect(() => {
  setSelectedDate(suggestedDate);
}, [suggestedDate]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fitnessValue = parseFloat(fitness) || 50;
    const fatigueValue = parseFloat(fatigue) || 30;
    const startDate = new Date(selectedDate);
    onInitialize(fitnessValue, fatigueValue, startDate);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Setup Training Plan</h3>
        <p className="text-gray-600">
          Configure your fitness baseline and plan start date
        </p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">How these metrics work:</p>
            <ul className="space-y-1">
              <li><strong>Fitness:</strong> 42-day trailing average of daily TSS (chronic training load)</li>
              <li><strong>Fatigue:</strong> 7-day trailing average of daily TSS (acute training load)</li>
              <li><strong>Form:</strong> Fitness ÷ Fatigue ratio (readiness to perform)</li>
              <li><strong>Start Date:</strong> Training plans should begin on a Monday for proper week alignment</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Zap className="w-4 h-4 mr-2 text-green-600" />
              Starting Fitness (CTL)
            </label>
            <input
              type="number"
              value={fitness}
              onChange={(e) => setFitness(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="50"
              min="0"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Typical range: 30-80 for recreational runners
            </p>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Target className="w-4 h-4 mr-2 text-red-600" />
              Starting Fatigue (ATL)
            </label>
            <input
              type="number"
              value={fatigue}
              onChange={(e) => setFatigue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="30"
              min="1"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Usually higher than fitness (recent training load)
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Preview Form Score</h4>
          <div className="text-2xl font-bold text-blue-600">
            {(parseFloat(fitness) / parseFloat(fatigue) || 0).toFixed(2)}
          </div>
          <p className="text-sm text-gray-600">
            Form = Fitness ÷ Fatigue • Higher values indicate better readiness
          </p>
        </div>

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
            Suggested: {new Date(suggestedDate).toLocaleDateString('en-US')}
          </p>
        </div>


        <button
          type="submit"
          disabled={!selectedDate}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Start Training Plan
        </button>
      </form>
    </div>
  );
};