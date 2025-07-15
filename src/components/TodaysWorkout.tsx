import React from 'react';
import { Calendar, Clock, TrendingUp, Zap, Target, AlertCircle } from 'lucide-react';

interface TodaysWorkoutProps {
  data: any[];
  planStartDate: Date;
  initialFitness: number;
  initialFatigue: number;
  actualTSSData: Record<string, number>;
}

export const TodaysWorkout: React.FC<TodaysWorkoutProps> = ({ 
  data, 
  planStartDate, 
  initialFitness, 
  initialFatigue, 
  actualTSSData 
}) => {
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

  const getTodaysWorkout = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentFitness = initialFitness;
    let currentFatigue = initialFatigue;
    let dayIndex = 0;
    
    // Find today's workout and calculate fitness metrics
    for (let i = 0; i < data.length; i += 2) {
      const weekRow = data[i];
      const descriptionRow = data[i + 1];
      
      if (!weekRow || !descriptionRow) continue;
      
      // Calculate week start date based on plan start date and week index
      const weekIndex = Math.floor(i / 2);
      const weekStartDate = new Date(planStartDate);
      weekStartDate.setDate(planStartDate.getDate() + (weekIndex * 7));
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex];
        const dayDate = new Date(weekStartDate);
        dayDate.setDate(weekStartDate.getDate() + dayIndex);
        dayDate.setHours(0, 0, 0, 0);
        
        const training = weekRow[day] || '';
        const description = descriptionRow[day] || '';
        const plannedTSS = estimateTSS(training, description);
        const workoutKey = `${weekIndex}-${dayIndex}`;
        const actualTSS = actualTSSData[workoutKey];
        const effectiveTSS = actualTSS ?? plannedTSS;
        
        // Update fitness metrics
        const fitnessAlpha = 2 / (42 + 1);
        const fatigueAlpha = 2 / (7 + 1);
        
        currentFitness = currentFitness + fitnessAlpha * (effectiveTSS - currentFitness);
        currentFatigue = currentFatigue + fatigueAlpha * (effectiveTSS - currentFatigue);
        
        const form = currentFatigue > 0 ? currentFitness / currentFatigue : 0;
        
        if (dayDate.getTime() === today.getTime()) {
          return {
            found: true,
            day: day,
            date: dayDate,
            training,
            description,
            plannedTSS,
            actualTSS,
            effectiveTSS,
            fitness: currentFitness,
            fatigue: currentFatigue,
            form,
            weekNumber: weekRow['Week #'] || '',
            weekOf: weekStartDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })
          };
        }
      }
    }
    
    // Check if today is before or after the plan
    const planStart = new Date(planStartDate);
    planStart.setHours(0, 0, 0, 0);
    
    if (today < planStart) {
      return { found: false, status: 'before' };
    }
    
    // Calculate plan end date
    const totalWeeks = Math.ceil(data.length / 2);
    const planEnd = new Date(planStartDate);
    planEnd.setDate(planStartDate.getDate() + (totalWeeks * 7) - 1); // Last day of last week
    planEnd.setHours(0, 0, 0, 0);
    
    if (today > planEnd) {
      return { found: false, status: 'after' };
    }
    
    return { found: false, status: 'unknown' };
  };

  const todaysWorkout = getTodaysWorkout();
  
  const getTrainingTypeColor = (training: string): string => {
    if (training.toLowerCase().includes('x-train') || training.toLowerCase() === 'x-train') {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (training.toLowerCase() === 'rest') {
      return 'bg-gray-100 text-gray-600 border-gray-200';
    }
    if (training.toLowerCase().includes('travel')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (isNaN(Number(training))) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  if (!todaysWorkout.found) {
    return (
      <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg shadow-md border border-gray-300 p-6 mb-8">
        <div className="flex items-center mb-4">
          <Calendar className="w-8 h-8 text-gray-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Today's Workout</h2>
        </div>
        
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-lg text-gray-700 font-medium">
              {todaysWorkout.status === 'before' 
                ? "Plan has not yet begun, consider easy base training, cross-training, or rest."
                : todaysWorkout.status === 'after'
                ? "Plan finished, time for a new plan!"
                : "Today's workout not found in the current plan."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isLowForm = todaysWorkout.form < 0.75;

  return (
    <div className={`rounded-lg shadow-md border p-6 mb-8 ${
      isLowForm 
        ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' 
        : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
    }`}>
      <div className="flex items-center mb-4">
        <Calendar className="w-8 h-8 text-blue-600 mr-3" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Today's Workout</h2>
          <p className="text-gray-600">
            {todaysWorkout.day}, {todaysWorkout.date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <Clock className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Workout Details</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Training:</span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getTrainingTypeColor(todaysWorkout.training)}`}>
                {todaysWorkout.training || 'Rest'}
              </span>
            </div>
            
            {(todaysWorkout.plannedTSS > 0 || todaysWorkout.actualTSS !== undefined) && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">TSS:</span>
                <div className="space-y-1">
                  {todaysWorkout.actualTSS !== undefined ? (
                    <>
                      <span className="px-2 py-1 text-sm bg-gray-100 text-gray-500 rounded font-medium line-through block">
                        {todaysWorkout.plannedTSS}
                      </span>
                      <span className="px-2 py-1 text-sm bg-green-100 text-green-700 rounded font-medium block">
                        {todaysWorkout.actualTSS}
                      </span>
                    </>
                  ) : (
                    <span className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded font-medium">
                      {todaysWorkout.plannedTSS}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Week:</span>
              <span className="text-sm font-medium text-gray-900">
                {todaysWorkout.weekNumber}
              </span>
            </div>
          </div>
          
          {todaysWorkout.description && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 leading-relaxed">
                {todaysWorkout.description}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Fitness Metrics</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">Fitness (CTL):</span>
              </div>
              <span className="text-lg font-bold text-green-700">
                {todaysWorkout.fitness.toFixed(1)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm text-gray-600">Fatigue (ATL):</span>
              </div>
              <span className="text-lg font-bold text-red-700">
                {todaysWorkout.fatigue.toFixed(1)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm text-gray-600">Form:</span>
              </div>
              <span className={`text-lg font-bold ${
                isLowForm ? 'text-red-700' : 'text-blue-700'
              }`}>
                {todaysWorkout.form.toFixed(2)}
              </span>
            </div>
          </div>
          
          {isLowForm && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <p className="text-sm text-red-800 font-medium">
                  Low form detected - consider easier training or rest
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};