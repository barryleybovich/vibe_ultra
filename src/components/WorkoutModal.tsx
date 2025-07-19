import React, { useState, useEffect } from 'react';
import { X, Calendar, Target, TrendingUp, Zap } from 'lucide-react';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: {
    day: string;
    training: string;
    description: string;
    plannedTSS: number;
    actualTSS?: number;
    fitness: number;
    fatigue: number;
    form: number;
  };
  weekNumber: string;
  weekOf: string;
  onSaveActualTSS: (actualTSS: number | null) => void;
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  isOpen,
  onClose,
  workout,
  weekNumber,
  weekOf,
  onSaveActualTSS
}) => {
  const [actualTSSInput, setActualTSSInput] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setActualTSSInput(workout.actualTSS?.toString() || '');
    }
  }, [isOpen, workout.actualTSS]);

  const handleSave = () => {
    const actualTSS = actualTSSInput.trim() === '' ? null : parseFloat(actualTSSInput);
    if (actualTSS !== null && (isNaN(actualTSS) || actualTSS < 0)) {
      alert('Please enter a valid TSS value (0 or greater)');
      return;
    }
    onSaveActualTSS(actualTSS);
    onClose();
  };

  const handleClear = () => {
    setActualTSSInput('');
    onSaveActualTSS(null);
    onClose();
  };

  if (!isOpen) return null;

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

  const effectiveTSS = workout.actualTSS ?? workout.plannedTSS;
  const isLowForm = workout.form < -0.25;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{workout.day} Workout</h2>
            <p className="text-sm text-gray-600">{weekNumber} • {weekOf}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Workout Details */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-600" />
              Workout Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Training:</span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getTrainingTypeColor(workout.training)}`}>
                  {workout.training ? (
                    !isNaN(Number(workout.training)) 
                      ? `${workout.training} miles`
                      : workout.training
                  ) : 'Rest'}
                </span>
              </div>
              {workout.description && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {workout.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* TSS Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Target className="w-4 h-4 mr-2 text-orange-600" />
              Training Stress Score
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Planned TSS:</span>
                <span className={`px-2 py-1 text-sm rounded font-medium ${
                  workout.actualTSS !== undefined 
                    ? 'bg-gray-100 text-gray-500 line-through' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {workout.plannedTSS}
                </span>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Actual TSS:
                </label>
                <input
                  type="number"
                  value={actualTSSInput}
                  onChange={(e) => setActualTSSInput(e.target.value)}
                  placeholder="Enter actual TSS"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use planned TSS
                </p>
              </div>

              {workout.actualTSS !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Effective TSS:</span>
                  <span className="px-2 py-1 text-sm bg-green-100 text-green-700 rounded font-medium">
                    {effectiveTSS}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Fitness Metrics */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
              Fitness Metrics
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm text-gray-600">Fitness (CTL):</span>
                </div>
                <span className="text-lg font-bold text-green-700">
                  {workout.fitness.toFixed(1)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm text-gray-600">Fatigue (ATL):</span>
                </div>
                <span className="text-lg font-bold text-red-700">
                  {workout.fatigue.toFixed(1)}
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
                  {(workout.form * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            
            {isLowForm && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">
                  Low form detected - consider easier training or rest
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Actual TSS
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};