import React, { useState } from 'react';
import { BookOpen, Download, Info } from 'lucide-react';

interface PlanLibraryProps {
  onPlanSelected: (data: any[]) => void;
  onError: (error: string) => void;
}

interface LibraryPlan {
  id: string;
  name: string;
  description: string;
  filePath: string;
}

const LIBRARY_PLANS: LibraryPlan[] = [
  {
    id: 'swap-50-64',
    name: 'SWAP 50 Mile - Peak 64 MPW',
    description: '12-week 50-mile ultramarathon plan peaking at 64 miles per week',
    filePath: '/plans/SWAP 50 Mile - Peak 64 MPW.csv'
  },
  {
    id: 'swap-50-75',
    name: 'SWAP 50 Mile - Peak 75 MPW',
    description: '12-week 50-mile ultramarathon plan peaking at 75 miles per week',
    filePath: '/plans/SWAP 50 Mile - Peak 75 MPW.csv'
  }
];

export const PlanLibrary: React.FC<PlanLibraryProps> = ({ onPlanSelected, onError }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [showSWAPModal, setShowSWAPModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedPlanData, setParsedPlanData] = useState<any[] | null>(null);

  const handlePlanSelection = async () => {
    if (!selectedPlan) return;

    const plan = LIBRARY_PLANS.find(p => p.id === selectedPlan);
    if (!plan) return;

    setIsLoading(true);
    
    try {
      const response = await fetch(plan.filePath);
      if (!response.ok) {
        throw new Error(`Failed to load plan: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      
      // Parse CSV manually (simple parsing for our format)
      const lines = csvText.split('\n').filter(line => line.trim());
      const data = lines.map(line => {
        const values = line.split(',');
        const obj: any = {};
        
        // Assuming first line has headers
        if (lines.indexOf(line) === 0) {
          values.forEach((value, index) => {
            obj[value.trim()] = value.trim();
          });
        } else {
          // Map values to headers from first line
          const headers = lines[0].split(',');
          headers.forEach((header, index) => {
            obj[header.trim()] = values[index] ? values[index].trim() : '';
          });
        }
        
        return obj;
      });
      
      // Remove header row
      const parsedData = data.slice(1);
      
      // Store parsed data and show modal
      setParsedPlanData(parsedData);
      setShowSWAPModal(true);
      
    } catch (error) {
      onError(`Error loading plan: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalAcknowledge = () => {
    setShowSWAPModal(false);
    if (parsedPlanData) {
      onPlanSelected(parsedPlanData);
      setParsedPlanData(null);
    }
  };

  const SWAPModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Info className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-bold text-gray-900">SWAP Training Plan</h3>
          </div>
          
          <p className="text-gray-700 leading-relaxed mb-4">
            Some Work All Play (SWAP) Plans are designed by David Roche & Megan Roche, MD,{' '}
            <a 
              href="https://swaprunning.com/training-plans" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              SWAP Running
            </a>
            . Run like a puppy, train like a rockstar.
          </p>
          
          <div className="flex justify-end">
            <button
              onClick={handleModalAcknowledge}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {showSWAPModal && <SWAPModal />}
      
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Training Plan Library</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Choose from our curated collection of ultramarathon training plans
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a Plan
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a training plan...</option>
              {LIBRARY_PLANS.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedPlan && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {LIBRARY_PLANS.find(p => p.id === selectedPlan)?.description}
              </p>
            </div>
          )}
          
          <button
            onClick={handlePlanSelection}
            disabled={!selectedPlan || isLoading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading Plan...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Use This Plan
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};