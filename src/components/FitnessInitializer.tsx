import React, { useState } from 'react';
import { TrendingUp, Zap, Target, Info, Calendar } from 'lucide-react';

interface FitnessInitializerProps {
  onInitialize: (fitness: number, fatigue: number, raceDate: Date) => void;
}

export const FitnessInitializer: React.FC<FitnessInitializerProps> = ({ onInitialize }) => {
  const getNextSaturday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Calculate days until next Saturday (0=Sun,...6=Sat)
    const daysUntilSaturday = 6 - dayOfWeek >= 0 ? 6 - dayOfWeek : 0;
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);

  return `${year}-${month}-${day}`;
    // Format as YYYY-MM-DD in local time
    const year = nextSaturday.getFullYear();
    const month = String(nextSaturday.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(nextSaturday.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const [fitness, setFitness] = useState<string>('45');
  const [fatigue, setFatigue] = useState<string>('55');
  const [selectedRaceDate, setSelectedRaceDate] = useState<string>(() => getNextSaturday());
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fitnessValue = parseFloat(fitness) || 50;
    const fatigueValue = parseFloat(fatigue) || 30;
    const raceDate = new Date(selectedRaceDate);
    onInitialize(fitnessValue, fatigueValue, raceDate);
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
          Configure your fitness baseline and race date
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
              <li><strong>Form:</strong> (Fitness - Fatigue)/Fitness ratio (readiness to perform)</li>
              <li><strong>Race Date:</strong> Plans will work backwards from this date</li>
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
          <h4 className="font-medium text-gray-900 mb-2">Form Score</h4>
          <div className="text-2xl font-bold text-blue-600">
  {(parseFloat(fitness) > 0)
    ? `${(((parseFloat(fitness) - parseFloat(fatigue)) / parseFloat(fitness)) * 100).toFixed(0)}%`
    : '0%'}
</div>
          <p className="text-sm text-gray-600">
            Values below -30% indicate injury potential, values above -10% indicate maintenance or detraining.
          </p>
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
            Race Date
          </label>
          <input
            type="date"
            value={selectedRaceDate}
            onChange={(e) => setSelectedRaceDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            For best results, please select a Saturday as your starting date.
          </p>
        </div>


        <button
          type="submit"
          disabled={!selectedRaceDate}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Start Training Plan
        </button>
      </form>
    </div>
  );
};