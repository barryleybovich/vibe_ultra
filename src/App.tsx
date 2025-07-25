import React, { useState } from 'react';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthStatus } from './components/AuthStatus';
import { EmailSubscription } from './components/EmailSubscription';
import { FileUploader } from './components/FileUploader';
import { PlanLibrary } from './components/PlanLibrary';
import { FitnessInitializer } from './components/FitnessInitializer';
import { TodaysWorkout } from './components/TodaysWorkout';
import { TrainingPlanParser } from './components/TrainingPlanParser';
import { TrainingStats } from './components/TrainingStats';
import { FitnessChart } from './components/FitnessChart';
import { CalendarExport } from './components/CalendarExport';
import { Mountain, AlertCircle } from 'lucide-react';
import { estimateTSS } from './lib/workoutUtils';
import type { Session } from '@supabase/supabase-js';
import {
  upsertTrainingPlan,
  upsertFitnessSettings,
  upsertDailyTSS,
  deleteDailyTSS
} from './lib/database';

const STORAGE_KEYS = {
  TRAINING_DATA: 'ultramarathon_training_data',
  ACTUAL_TSS_DATA: 'ultramarathon_actual_tss_data',
  FITNESS_INITIALIZED: 'ultramarathon_fitness_initialized',
  INITIAL_FITNESS: 'ultramarathon_initial_fitness',
  INITIAL_FATIGUE: 'ultramarathon_initial_fatigue',
  PLAN_START_DATE: 'ultramarathon_plan_start_date'
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [planStartDate, setPlanStartDate] = useState<Date | null>(null);
  const [fitnessInitialized, setFitnessInitialized] = useState(false);
  const [initialFitness, setInitialFitness] = useState(50);
  const [initialFatigue, setInitialFatigue] = useState(30);
  const [actualTSSData, setActualTSSData] = useState<Record<string, number>>({});
  const [error, setError] = useState<string>('');

    // Persist locally stored plan data to Supabase once a session exists
  useEffect(() => {
    if (!session) return;

    const persistData = async () => {
      console.log('Persisting data to Supabase for user:', session.user.id);
      
      try {
        if (trainingData.length > 0) {
          console.log('Upserting training plan...');
          const { error } = await upsertTrainingPlan(session.user.id, 'default', trainingData);
          if (error) {
            console.error('Failed to upsert training plan:', error);
          } else {
            console.log('Successfully upserted training plan');
          }
        }

        if (fitnessInitialized && planStartDate) {
          console.log('Upserting fitness settings...', {
            userId: session.user.id,
            initialFitness,
            initialFatigue,
            planStartDate: planStartDate.toISOString().split('T')[0]
          });
          const { error } = await upsertFitnessSettings(
            session.user.id,
            initialFitness,
            initialFatigue,
            planStartDate.toISOString().split('T')[0]
          );
          if (error) {
            console.error('Failed to upsert fitness settings:', error);
          } else {
            console.log('Successfully upserted fitness settings');
          }
        }

        if (planStartDate && fitnessInitialized) {
          console.log('Upserting actual TSS data...', Object.keys(actualTSSData).length, 'records');
          for (const [workoutKey, tss] of Object.entries(actualTSSData)) {
            try {
              const [weekIndexStr, dayIndexStr] = workoutKey.split('-');
              const weekIndex = parseInt(weekIndexStr, 10);
              const dayIndex = parseInt(dayIndexStr, 10);
              const date = new Date(planStartDate);
              date.setDate(planStartDate.getDate() + weekIndex * 7 + dayIndex);
              const isoDate = date.toISOString().split('T')[0];
              console.log('Upserting TSS record:', { workoutKey, tss, isoDate });
              const { error } = await upsertDailyTSS(session.user.id, isoDate, tss);
              if (error) {
                console.error('Failed to upsert TSS record:', { workoutKey, tss, isoDate, error });
              }
            } catch (tssError) {
              console.error('Error processing TSS record:', { workoutKey, tss, error: tssError });
            }
          }
        }
      } catch (error) {
        console.error('Error in persistData function:', error);
      }
    };

    persistData();
  }, [session, trainingData, fitnessInitialized, planStartDate, initialFitness, initialFatigue, actualTSSData]);

  // Handle authentication state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const savedTrainingData = localStorage.getItem(STORAGE_KEYS.TRAINING_DATA);
      const savedFitnessInitialized = localStorage.getItem(STORAGE_KEYS.FITNESS_INITIALIZED);
      const savedInitialFitness = localStorage.getItem(STORAGE_KEYS.INITIAL_FITNESS);
      const savedInitialFatigue = localStorage.getItem(STORAGE_KEYS.INITIAL_FATIGUE);
      const savedPlanStartDate = localStorage.getItem(STORAGE_KEYS.PLAN_START_DATE);
      const savedActualTSSData = localStorage.getItem(STORAGE_KEYS.ACTUAL_TSS_DATA);

      if (savedTrainingData) {
        const parsedData = JSON.parse(savedTrainingData);
        setTrainingData(parsedData);
      }

      if (savedFitnessInitialized === 'true') {
        setFitnessInitialized(true);
      }

      if (savedInitialFitness) {
        setInitialFitness(parseFloat(savedInitialFitness));
      }

      if (savedInitialFatigue) {
        setInitialFatigue(parseFloat(savedInitialFatigue));
      }

      if (savedPlanStartDate) {
        setPlanStartDate(new Date(savedPlanStartDate));
      }

      if (savedActualTSSData) {
        setActualTSSData(JSON.parse(savedActualTSSData));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEYS.TRAINING_DATA);
      localStorage.removeItem(STORAGE_KEYS.FITNESS_INITIALIZED);
      localStorage.removeItem(STORAGE_KEYS.INITIAL_FITNESS);
      localStorage.removeItem(STORAGE_KEYS.INITIAL_FATIGUE);
      localStorage.removeItem(STORAGE_KEYS.PLAN_START_DATE);
      localStorage.removeItem(STORAGE_KEYS.ACTUAL_TSS_DATA);
    }
  }, []);

  // Save training data to localStorage whenever it changes
  useEffect(() => {
    if (trainingData.length > 0) {
      localStorage.setItem(STORAGE_KEYS.TRAINING_DATA, JSON.stringify(trainingData));
    }
  }, [trainingData]);

  // Save fitness settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FITNESS_INITIALIZED, fitnessInitialized.toString());
  }, [fitnessInitialized]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INITIAL_FITNESS, initialFitness.toString());
  }, [initialFitness]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INITIAL_FATIGUE, initialFatigue.toString());
  }, [initialFatigue]);

  useEffect(() => {
    if (planStartDate) {
      localStorage.setItem(STORAGE_KEYS.PLAN_START_DATE, planStartDate.toISOString());
    }
  }, [planStartDate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTUAL_TSS_DATA, JSON.stringify(actualTSSData));
  }, [actualTSSData]);
  
  const handleDataParsed = (data: any[]) => {
    setTrainingData(data);
    setError('');
    setFitnessInitialized(false);
    setPlanStartDate(null); // Reset date selection when new data is loaded
     if (session) {
      upsertTrainingPlan(session.user.id, 'default', data);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTrainingData([]);
    setFitnessInitialized(false);
  };

  const handleReset = () => {
    setTrainingData([]);
    setPlanStartDate(null);
    setFitnessInitialized(false);
    setActualTSSData({});
    setError('');
    // Clear localStorage when resetting
    localStorage.removeItem(STORAGE_KEYS.TRAINING_DATA);
    localStorage.removeItem(STORAGE_KEYS.FITNESS_INITIALIZED);
    localStorage.removeItem(STORAGE_KEYS.INITIAL_FITNESS);
    localStorage.removeItem(STORAGE_KEYS.INITIAL_FATIGUE);
    localStorage.removeItem(STORAGE_KEYS.PLAN_START_DATE);
    localStorage.removeItem(STORAGE_KEYS.ACTUAL_TSS_DATA);
  };

  const handleFitnessInitialize = (fitness: number, fatigue: number, raceDate: Date) => {
    console.log('Initializing fitness settings:', { fitness, fatigue, raceDate });
    setInitialFitness(fitness);
    setInitialFatigue(fatigue);
    
    const totalWeeks = Math.ceil(trainingData.length / 2);
    const startDate = new Date(raceDate);
    const raceDay = startDate.getDay();
    const diffToMonday = raceDay === 0 ? 6 : raceDay - 1;
    startDate.setDate(startDate.getDate() - diffToMonday - (totalWeeks - 1) * 7);
    startDate.setHours(0, 0, 0, 0);

    console.log('Calculated plan start date:', startDate);
    setPlanStartDate(startDate);
    setFitnessInitialized(true);
    
    if (session) {
      console.log('User is logged in, immediately persisting fitness settings');
      upsertFitnessSettings(
        session.user.id,
        fitness,
        fatigue,
        startDate.toISOString().split('T')[0]
      ).then(({ error }) => {
        if (error) {
          console.error('Failed to immediately persist fitness settings:', error);
        } else {
          console.log('Successfully immediately persisted fitness settings');
        }
      });
    } else {
      console.log('User not logged in, fitness settings will be persisted when they log in');
    }
  };

  const handleActualTSSUpdate = (workoutKey: string, actualTSS: number | null) => {
    setActualTSSData(prev => {
      const updated = { ...prev };
      if (actualTSS === null) {
        delete updated[workoutKey];
      } else {
        updated[workoutKey] = actualTSS;
      }
      return updated;
    });
  
    // Only persist to database if user is authenticated and plan is initialized
    if (session && planStartDate && fitnessInitialized) {
      const [weekIndexStr, dayIndexStr] = workoutKey.split('-');
      const weekIndex = parseInt(weekIndexStr, 10);
      const dayIndex = parseInt(dayIndexStr, 10);
      const date = new Date(planStartDate);
      date.setDate(planStartDate.getDate() + weekIndex * 7 + dayIndex);
      const isoDate = date.toISOString().split('T')[0];

      console.log('Persisting TSS update:', { workoutKey, actualTSS, isoDate, userId: session.user.id });

      if (actualTSS === null) {
        deleteDailyTSS(session.user.id, isoDate);
      } else {
        upsertDailyTSS(session.user.id, isoDate, actualTSS);
      }
    }
  };

  const generateChartData = () => {
    if (!fitnessInitialized || trainingData.length === 0 || !planStartDate) return [];
    
    const chartData: Array<{
      date: string;
      fitness: number;
      fatigue: number;
      form: number;
      tss: number;
    }> = [];
    
    let currentFitness = initialFitness;
    let currentFatigue = initialFatigue;
    
    // Helper function to estimate TSS (duplicate from TrainingPlanParser)
    const getEffectiveTSS = (training: string, description: string, weekIndex: number, dayIndex: number): number => {
      const workoutKey = `${weekIndex}-${dayIndex}`;
      const actualTSS = actualTSSData[workoutKey];
      return actualTSS !== undefined ? actualTSS : estimateTSS(training, description);
    };
    
    for (let i = 0; i < trainingData.length; i += 2) {
      const weekRow = trainingData[i];
      const descriptionRow = trainingData[i + 1];
      
      if (!weekRow || !descriptionRow) continue;
      
      // Calculate week start date based on plan start date and week index
      const weekIndex = Math.floor(i / 2);
      const weekStartDate = new Date(planStartDate);
      weekStartDate.setDate(planStartDate.getDate() + (weekIndex * 7));
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      days.forEach((day, dayIndex) => {
        const training = weekRow[day] || '';
        const description = descriptionRow[day] || '';
        const tss = getEffectiveTSS(training, description, weekIndex, dayIndex);
        
        const dayDate = new Date(weekStartDate);
        dayDate.setDate(weekStartDate.getDate() + dayIndex);
        
        const fitnessAlpha = 2 / (42 + 1);
        const fatigueAlpha = 2 / (7 + 1);
        
        currentFitness = currentFitness + fitnessAlpha * (tss - currentFitness);
        currentFatigue = currentFatigue + fatigueAlpha * (tss - currentFatigue);
        
        const form = currentFatigue > 0 ? (currentFitness - currentFatigue) / currentFitness: 0;
        
        chartData.push({
          date: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fitness: currentFitness,
          fatigue: currentFatigue,
          form,
          tss
        });
      });
    }
    
    return chartData;
  };

  // Show loading spinner while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Mountain className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">
                Ultramarathon Training Plan
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {session && <AuthStatus user={session.user} />}
              {trainingData.length > 0 && (
                <div className="flex items-center space-x-3">
                  {fitnessInitialized && planStartDate && (
                    <CalendarExport 
                      data={trainingData}
                      planStartDate={planStartDate}
                      actualTSSData={actualTSSData}
                    />
                  )}
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                  >
                    Upload New Plan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {trainingData.length === 0 ? (
          <div className="text-center py-4">
            <Mountain className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to your Training Plan Parser
            </h2>
            <p className="text-gray-600 mb-6">
              Upload a training plan to get started with your ultramarathon training analysis
            </p>
           
            <div className="max-w-2xl mx-auto space-y-8">
              <PlanLibrary onPlanSelected={handleDataParsed} onError={handleError} />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">or</span>
                </div>
              </div>
              
              <FileUploader onDataParsed={handleDataParsed} onError={handleError} />
            </div>
          </div>
        ) : (
          !fitnessInitialized ? (
            <FitnessInitializer onInitialize={handleFitnessInitialize} />
          ) : (
            <div className="space-y-8">
              <FitnessChart data={generateChartData()} />
              
              <EmailSubscription 
                session={session}
                onAuthSuccess={() => {
                  console.log('User authenticated for email notifications');
                }}
              />
              
              <TodaysWorkout 
                data={trainingData}
                planStartDate={planStartDate}
                initialFitness={initialFitness}
                initialFatigue={initialFatigue}
                actualTSSData={actualTSSData}
              />
              
            <TrainingStats data={trainingData} />
              <TrainingPlanParser 
                data={trainingData} 
                planStartDate={planStartDate}
                initialFitness={initialFitness}
                initialFatigue={initialFatigue}
                actualTSSData={actualTSSData}
                onActualTSSUpdate={handleActualTSSUpdate}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default App;