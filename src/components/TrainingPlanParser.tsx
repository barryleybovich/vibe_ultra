import React from 'react';
import { useState } from 'react';
import { TrendingUp, Zap, Target } from 'lucide-react';
import { WorkoutModal } from './WorkoutModal';

interface WorkoutDay {
  day: string;
  training: string;
  description: string;
  tss: number;
  fitness: number;
  fatigue: number;
  form: number;
}

interface TrainingWeek {
  weekNumber: string;
  weekOf: string;
  weeklyTotal: string;
  totalTSS: number;
  workouts: WorkoutDay[];
}

interface TrainingPlanParserProps {
  data: any[];
  planStartDate: Date;
  initialFitness: number;
  initialFatigue: number;
  actualTSSData: Record<string, number>;
  onActualTSSUpdate: (workoutKey: string, actualTSS: number | null) => void;
}

export const TrainingPlanParser: React.FC<TrainingPlanParserProps> = ({ 
  data, 
  planStartDate, 
  initialFitness, 
  initialFatigue, 
  actualTSSData, 
  onActualTSSUpdate 
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState<{
    workout: WorkoutDay & { plannedTSS: number; actualTSS?: number };
    weekNumber: string;
    weekOf: string;
    workoutKey: string;
  } | null>(null);

  const estimateTSS = (training: string, description: string): number => {
    // Handle rest days and travel
    if (training.toLowerCase() === 'rest' || training.toLowerCase().includes('travel')) {
      return 0;
    }
    
    // Handle cross-training (estimate as moderate effort)
    if (training.toLowerCase().includes('x-train') || training.toLowerCase() === 'x-train') {
      return 22.5; // Cross-training session
    }
    
    // Handle numeric mileage
    const miles = parseFloat(training);
    if (!isNaN(miles) && miles > 0) {
      const desc = description.toLowerCase();
      
      // Determine intensity based on description keywords
      const hardKeywords = ['hard', 'threshold', 'tempo', '10k', '5k', 'vo2', 'fast', 'hills', 'ladder'];
      const moderateKeywords = ['aerobic', 'hm effort', 'race pace', 'fartlek'];
      
      const isHard = hardKeywords.some(keyword => desc.includes(keyword));
      const isModerate = moderateKeywords.some(keyword => desc.includes(keyword)) && !isHard;
      
      // Special handling for mixed workouts (warmup/cooldown + intervals)
      if (desc.includes('up,') || desc.includes('down') || desc.includes('easy,')) {
        // Mixed workout - assume 30% easy, 70% at target intensity
        if (isHard) {
          return Math.round(miles * 0.3 * 8 + miles * 0.7 * 11);
        } else if (isModerate) {
          return Math.round(miles * 0.3 * 8 + miles * 0.7 * 9.5);
        }
      }
      
      // Calculate TSS based on intensity
      if (isHard) {
        return Math.round(miles * 11);
      } else if (isModerate) {
        return Math.round(miles * 9.5);
      } else {
        // Default to easy
        return Math.round(miles * 8);
      }
    }
    
    // Handle special cases like races
    if (description.toLowerCase().includes('50k')) {
      return 350; // Estimate for 50K race
    }
    if (description.toLowerCase().includes('100k')) {
      return 600; // Estimate for 100K race
    }
    
    return 0;
  };

  const calculateFitnessMetrics = () => {
    const allDays: Array<{
      date: Date;
      plannedTSS: number;
      actualTSS?: number;
      effectiveTSS: number;
      fitness: number;
      fatigue: number;
      form: number;
    }> = [];
    
    let currentFitness = initialFitness;
    let currentFatigue = initialFatigue;
    
    // Process each week
    for (let i = 0; i < data.length; i += 2) {
      const weekRow = data[i];
      const descriptionRow = data[i + 1];
      
      if (!weekRow || !descriptionRow) continue;
      
      // Calculate week start date based on plan start date and week index
      const weekIndex = Math.floor(i / 2);
      const weekStartDate = new Date(planStartDate);
      weekStartDate.setDate(planStartDate.getDate() + (weekIndex * 7));
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      days.forEach((day, dayIndex) => {
        const training = weekRow[day] || '';
        const description = descriptionRow[day] || '';
        const plannedTSS = estimateTSS(training, description);
        const workoutKey = `${weekIndex}-${dayIndex}`;
        const actualTSS = actualTSSData[workoutKey];
        const effectiveTSS = actualTSS ?? plannedTSS;
        
        // Calculate date for this day
        const dayDate = new Date(weekStartDate);
        dayDate.setDate(weekStartDate.getDate() + dayIndex);
        
        // Update fitness and fatigue using exponential moving averages
        // Fitness: 42-day EMA (e^(-1/42))
        // Fatigue: 7-day EMA (e^(-1/7))
        const fitnessAlpha = 0.976472;
        const fatigueAlpha = 0.866878;
        
        currentFitness = currentFitness * fitnessAlpha + effectiveTSS * (1 - fitnessAlpha);
        currentFatigue = currentFatigue * fatigueAlpha + effectiveTSS * (1 - fatigueAlpha);
        
        const form = currentFatigue > 0 ? currentFitness / currentFatigue : 0;
        
        allDays.push({
          date: dayDate,
          plannedTSS,
          actualTSS,
          effectiveTSS,
          fitness: currentFitness,
          fatigue: currentFatigue,
          form
        });
      });
    }
    
    return allDays;
  };
  const parseTrainingPlan = (): TrainingWeek[] => {
    const fitnessData = calculateFitnessMetrics();
    let dayIndex = 0;
    let weekStartDate: Date;
    
    const weeks: TrainingWeek[] = [];
    
    for (let i = 0; i < data.length; i += 2) {
      const weekRow = data[i];
      const descriptionRow = data[i + 1];
      
      if (!weekRow || !descriptionRow) continue;
      
      // Calculate week start date based on plan start date and week index
      const weekIndex = Math.floor(i / 2);
      weekStartDate = new Date(planStartDate);
      weekStartDate.setDate(planStartDate.getDate() + (weekIndex * 7));
      
      // Calculate "week of" date (Sunday) without modifying weekStartDate
      const weekOfDate = new Date(weekStartDate);
      weekOfDate.setDate(weekStartDate.getDate() + 6); // Add 6 days to get Sunday
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const workouts: WorkoutDay[] = [];
      let weeklyTSS = 0;
      
      days.forEach(day => {
        const training = weekRow[day] || '';
        const description = descriptionRow[day] || '';
        const plannedTSS = estimateTSS(training, description);
        const workoutKey = `${weekIndex}-${dayIndex}`;
        const actualTSS = actualTSSData[workoutKey];
        const effectiveTSS = actualTSS ?? plannedTSS;
        const dayData = fitnessData[dayIndex] || { fitness: 0, fatigue: 0, form: 0 };
        weeklyTSS += effectiveTSS;
        dayIndex++;
        
        if (training || description) {
          workouts.push({
            day,
            training,
            description,
            tss: effectiveTSS,
            fitness: dayData.fitness,
            fatigue: dayData.fatigue,
            form: dayData.form
          });
        } else {
          // Include empty days for fitness tracking
          workouts.push({
            day,
            training: '',
            description: '',
            tss: effectiveTSS,
            fitness: dayData.fitness,
            fatigue: dayData.fatigue,
            form: dayData.form
          });
        }
      });
      
      weeks.push({
        weekNumber: weekRow['Week #'] || '',
        weekOf: weekOfDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        weeklyTotal: weekRow['Weekly Total'] || '',
        totalTSS: weeklyTSS,
        workouts
      });
    }
    
    return weeks;
  };

  const weeks = parseTrainingPlan();
  
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

  const handleWorkoutClick = (workout: WorkoutDay, weekNumber: string, weekOf: string, weekIndex: number, dayIndex: number) => {
    const workoutKey = `${weekIndex}-${dayIndex}`;
    const plannedTSS = estimateTSS(workout.training, workout.description);
    const actualTSS = actualTSSData[workoutKey];
    
    // Calculate the actual date for this specific workout day
    const weekStartDate = new Date(planStartDate);
    weekStartDate.setDate(planStartDate.getDate() + (weekIndex * 7));
    const workoutDate = new Date(weekStartDate);
    workoutDate.setDate(weekStartDate.getDate() + dayIndex);
    
    setSelectedWorkout({
      workout: {
        ...workout,
        plannedTSS,
        actualTSS
      },
      weekNumber,
      weekOf: workoutDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      workoutKey
    });
  };

  const handleSaveActualTSS = (actualTSS: number | null) => {
    if (selectedWorkout) {
      onActualTSSUpdate(selectedWorkout.workoutKey, actualTSS);
    }
  };

  if (weeks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No training data found. Please check your file format.</p>
      </div>
    );
  }

  return (
    <>
      {selectedWorkout && (
        <WorkoutModal
          isOpen={true}
          onClose={() => setSelectedWorkout(null)}
          workout={selectedWorkout.workout}
          weekNumber={selectedWorkout.weekNumber}
          weekOf={selectedWorkout.weekOf}
          onSaveActualTSS={handleSaveActualTSS}
        />
      )}
      
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Training Plan Overview</h2>
        <p className="text-gray-600">
          {weeks.length} week{weeks.length !== 1 ? 's' : ''} of ultramarathon training
        </p>
      </div>
      
      {weeks.map((week, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{week.weekNumber}</h3>
                <p className="text-blue-100">{week.weekOf}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{week.weeklyTotal}</p>
                <p className="text-blue-100 text-sm">Total Miles</p>
                <p className="text-xl font-semibold mt-1">{week.totalTSS}</p>
                <p className="text-blue-100 text-sm">TSS</p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName, dayIndex) => {
                const workout = week.workouts.find(w => w.day === dayName);
                const isLowForm = workout && workout.form < 0.75;
                const workoutKey = `${index}-${dayIndex}`;
                const plannedTSS = workout ? estimateTSS(workout.training, workout.description) : 0;
                const actualTSS = actualTSSData[workoutKey];
                const hasActualTSS = actualTSS !== undefined;
                return (
                  <div key={dayName} className="min-h-[80px]">
                    <div className="text-center mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm md:text-base">{dayName}</h4>
                    </div>
                    {workout ? (
                      <div 
                        className={`border rounded-lg p-2 md:p-3 hover:shadow-md transition-shadow duration-200 h-full cursor-pointer hover:bg-gray-50 ${
                        isLowForm ? 'bg-red-50 border-red-200' : ''
                        }`}
                        onClick={() => handleWorkoutClick(workout, week.weekNumber, week.weekOf, index, dayIndex)}
                      >
                        <div className="text-center mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTrainingTypeColor(workout.training)}`}>
                            {workout.training}
                          </span>
                          <div className="mt-1 space-y-1">
                            {(plannedTSS > 0 || hasActualTSS) && (
                              <div className="space-y-0.5">
                                {hasActualTSS ? (
                                  <>
                                    <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded line-through block">
                                      {plannedTSS} TSS
                                    </span>
                                    <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded block">
                                      {actualTSS} TSS
                                    </span>
                                  </>
                                ) : (
                                  <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                                    {plannedTSS} TSS
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex flex-col space-y-0.5">
                              <div className="flex items-center justify-center space-x-1">
                                <TrendingUp className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-green-700 font-medium">
                                  {workout.fitness.toFixed(0)}
                                </span>
                              </div>
                              <div className="flex items-center justify-center space-x-1">
                                <Zap className="w-3 h-3 text-red-600" />
                                <span className="text-xs text-red-700 font-medium">
                                  {workout.fatigue.toFixed(0)}
                                </span>
                              </div>
                              <div className="flex items-center justify-center space-x-1">
                                <Target className="w-3 h-3 text-blue-600" />
                                <span className={`text-xs font-medium ${
                                  isLowForm ? 'text-red-700' : 'text-blue-700'
                                }`}>
                                  {workout.form.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {workout.description && (
                          <p className="text-xs md:text-sm text-gray-600 leading-relaxed text-center">
                            {workout.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div 
                        className={`border rounded-lg p-2 md:p-3 h-full cursor-pointer hover:bg-gray-50 ${
                        isLowForm ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                        }`}
                        onClick={() => {
                          const emptyWorkout: WorkoutDay = {
                            day: dayName,
                            training: '',
                            description: '',
                            tss: 0,
                            fitness: week.workouts.find(w => w.day === dayName)?.fitness || 0,
                            fatigue: week.workouts.find(w => w.day === dayName)?.fatigue || 0,
                            form: week.workouts.find(w => w.day === dayName)?.form || 0
                          };
                          handleWorkoutClick(emptyWorkout, week.weekNumber, week.weekOf, index, dayIndex);
                        }}
                      >
                        <div className="text-center">
                          <span className="px-2 py-1 text-xs font-medium rounded-full border bg-gray-100 text-gray-500">
                            -
                          </span>
                          <div className="mt-1 space-y-0.5">
                            <div className="flex items-center justify-center space-x-1">
                              <TrendingUp className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">
                                {(week.workouts.find(w => w.day === dayName)?.fitness || 0).toFixed(0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-center space-x-1">
                              <Zap className="w-3 h-3 text-red-600" />
                              <span className="text-xs text-red-700 font-medium">
                                {(week.workouts.find(w => w.day === dayName)?.fatigue || 0).toFixed(0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-center space-x-1">
                              <Target className="w-3 h-3 text-blue-600" />
                              <span className={`text-xs font-medium ${
                                isLowForm ? 'text-red-700' : 'text-blue-700'
                              }`}>
                                {(week.workouts.find(w => w.day === dayName)?.form || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
    </>
  );
};