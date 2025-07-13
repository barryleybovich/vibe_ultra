import React, { useState } from 'react';
import { useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { FitnessInitializer } from './components/FitnessInitializer';
import { TodaysWorkout } from './components/TodaysWorkout';
import { TrainingPlanParser } from './components/TrainingPlanParser';
import { TrainingStats } from './components/TrainingStats';
import { FitnessChart } from './components/FitnessChart';
import { Mountain, AlertCircle } from 'lucide-react';

const STORAGE_KEYS = {
  TRAINING_DATA: 'ultramarathon_training_data',
  FITNESS_INITIALIZED: 'ultramarathon_fitness_initialized',
  INITIAL_FITNESS: 'ultramarathon_initial_fitness',
  INITIAL_FATIGUE: 'ultramarathon_initial_fatigue'
};

function App() {
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [fitnessInitialized, setFitnessInitialized] = useState(false);
  const [initialFitness, setInitialFitness] = useState(50);
  const [initialFatigue, setInitialFatigue] = useState(30);
  const [error, setError] = useState<string>('');

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const savedTrainingData = localStorage.getItem(STORAGE_KEYS.TRAINING_DATA);
      const savedFitnessInitialized = localStorage.getItem(STORAGE_KEYS.FITNESS_INITIALIZED);
      const savedInitialFitness = localStorage.getItem(STORAGE_KEYS.INITIAL_FITNESS);
      const savedInitialFatigue = localStorage.getItem(STORAGE_KEYS.INITIAL_FATIGUE);

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
    } catch (error) {
      console.error('Error loading saved data:', error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEYS.TRAINING_DATA);
      localStorage.removeItem(STORAGE_KEYS.FITNESS_INITIALIZED);
      localStorage.removeItem(STORAGE_KEYS.INITIAL_FITNESS);
      localStorage.removeItem(STORAGE_KEYS.INITIAL_FATIGUE);
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

  const handleDataParsed = (data: any[]) => {
    setTrainingData(data);
    setError('');
    setFitnessInitialized(false); // Reset fitness initialization when new data is loaded
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTrainingData([]);
    setFitnessInitialized(false);
  };

  const handleReset = () => {
    setTrainingData([]);
    setFitnessInitialized(false);
    setError('');
    // Clear localStorage when resetting
    localStorage.removeItem(STORAGE_KEYS.TRAINING_DATA);
    localStorage.removeItem(STORAGE_KEYS.FITNESS_INITIALIZED);
    localStorage.removeItem(STORAGE_KEYS.INITIAL_FITNESS);
    localStorage.removeItem(STORAGE_KEYS.INITIAL_FATIGUE);
  };

  const handleFitnessInitialize = (fitness: number, fatigue: number) => {
    setInitialFitness(fitness);
    setInitialFatigue(fatigue);
    setFitnessInitialized(true);
  };

  const generateChartData = () => {
    if (!fitnessInitialized || trainingData.length === 0) return [];
    
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
    
    for (let i = 0; i < trainingData.length; i += 2) {
      const weekRow = trainingData[i];
      const descriptionRow = trainingData[i + 1];
      
      if (!weekRow || !descriptionRow) continue;
      
      const weekOfStr = weekRow['Week of'] || '';
      const weekStartDate = new Date(weekOfStr);
      
      if (isNaN(weekStartDate.getTime())) continue;
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      days.forEach((day, dayIndex) => {
        const training = weekRow[day] || '';
        const description = descriptionRow[day] || '';
        const tss = estimateTSS(training, description);
        
        const dayDate = new Date(weekStartDate);
        dayDate.setDate(weekStartDate.getDate() + dayIndex);
        
        const fitnessAlpha = 2 / (42 + 1);
        const fatigueAlpha = 2 / (7 + 1);
        
        currentFitness = currentFitness + fitnessAlpha * (tss - currentFitness);
        currentFatigue = currentFatigue + fatigueAlpha * (tss - currentFatigue);
        
        const form = currentFatigue > 0 ? currentFitness / currentFatigue : 0;
        
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
            {trainingData.length > 0 && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200"
              >
                Upload New Plan
              </button>
            )}
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
          <div className="text-center py-12">
            <Mountain className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to your Training Plan Parser
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Upload your ultramarathon training plan to get started. 
              We'll parse your workouts and display them in an easy-to-read format.
            </p>
            <FileUploader onDataParsed={handleDataParsed} onError={handleError} />
          </div>
        ) : (
          !fitnessInitialized ? (
            <FitnessInitializer onInitialize={handleFitnessInitialize} />
          ) : (
            <div className="space-y-8">
              <FitnessChart data={generateChartData()} />
              <TodaysWorkout 
                data={trainingData}
                initialFitness={initialFitness}
                initialFatigue={initialFatigue}
              />
            <TrainingStats data={trainingData} />
              <TrainingPlanParser 
                data={trainingData} 
                initialFitness={initialFitness}
                initialFatigue={initialFatigue}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default App;