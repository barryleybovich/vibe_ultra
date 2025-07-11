import React from 'react';
import { TrendingUp, Calendar, Target, Activity } from 'lucide-react';

interface TrainingStatsProps {
  data: any[];
}

interface WorkoutDay {
  day: string;
  training: string;
  description: string;
  tss: number;
}

interface TrainingWeek {
  weekNumber: string;
  weekOf: string;
  weeklyTotal: string;
  totalTSS: number;
  workouts: WorkoutDay[];
}
export const TrainingStats: React.FC<TrainingStatsProps> = ({ data }) => {
  const estimateTSS = (training: string, description: string): number => {
    if (training.toLowerCase() === 'rest' || training.toLowerCase().includes('travel')) {
      return 0;
    }
    
    if (training.toLowerCase().includes('x-train') || training.toLowerCase() === 'x-train') {
      return 22.5;
    }
    
    const miles = parseFloat(training);
    if (!isNaN(miles) && miles > 0) {
      const desc = description.toLowerCase();
      const hardKeywords = ['hard', 'threshold', 'tempo', '10k', '5k', 'vo2', 'fast', 'hills', 'ladder'];
      const moderateKeywords = ['aerobic', 'hm effort', 'race pace', 'fartlek'];
      
      const isHard = hardKeywords.some(keyword => desc.includes(keyword));
      const isModerate = moderateKeywords.some(keyword => desc.includes(keyword)) && !isHard;
      
      if (desc.includes('up,') || desc.includes('down') || desc.includes('easy,')) {
        if (isHard) {
          return Math.round(miles * 0.3 * 8 + miles * 0.7 * 11);
        } else if (isModerate) {
          return Math.round(miles * 0.3 * 8 + miles * 0.7 * 9.5);
        }
      }
      
      if (isHard) {
        return Math.round(miles * 11);
      } else if (isModerate) {
        return Math.round(miles * 9.5);
      } else {
        return Math.round(miles * 8);
      }
    }
    
    if (description.toLowerCase().includes('50k')) {
      return 350;
    }
    if (description.toLowerCase().includes('100k')) {
      return 600;
    }
    
    return 0;
  };

  const calculateStats = () => {
    const weeks = Math.ceil(data.length / 2);
    let totalMiles = 0;
    let totalTSS = 0;
    let crossTrainingDays = 0;
    let restDays = 0;
    
    for (let i = 0; i < data.length; i += 2) {
      const weekRow = data[i];
      const descriptionRow = data[i + 1];
      if (!weekRow) continue;
      
      const weeklyTotal = weekRow['Weekly Total'];
      if (weeklyTotal && !isNaN(Number(weeklyTotal))) {
        totalMiles += Number(weeklyTotal);
      }
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      days.forEach(day => {
        const training = weekRow[day] || '';
        const description = descriptionRow ? descriptionRow[day] || '' : '';
        
        totalTSS += estimateTSS(training, description);
        
        if (training.toLowerCase().includes('x-train')) {
          crossTrainingDays++;
        } else if (training.toLowerCase() === 'rest') {
          restDays++;
        }
      });
    }
    
    return { weeks, totalMiles, totalTSS, crossTrainingDays, restDays };
  };

  const stats = calculateStats();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center">
          <Calendar className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.weeks}</p>
            <p className="text-sm text-gray-600">Weeks</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center">
          <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalMiles}</p>
            <p className="text-sm text-gray-600">Total Miles</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center">
          <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalTSS}</p>
            <p className="text-sm text-gray-600">Total TSS</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center">
          <Activity className="w-8 h-8 text-purple-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.crossTrainingDays}</p>
            <p className="text-sm text-gray-600">X-Train Days</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center">
          <Target className="w-8 h-8 text-red-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.restDays}</p>
            <p className="text-sm text-gray-600">Rest Days</p>
          </div>
        </div>
      </div>
    </div>
  );
};