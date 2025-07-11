import React, { useCallback } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  onDataParsed: (data: any[]) => void;
  onError: (error: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onDataParsed, onError }) => {
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      handleCSVFile(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      handleExcelFile(file);
    } else if (fileName.endsWith('.pdf')) {
      onError('PDF parsing is not yet supported. Please use CSV or Excel files.');
    } else {
      onError('Unsupported file type. Please upload a CSV, Excel, or PDF file.');
    }
  }, [onDataParsed, onError]);

  const handleCSVFile = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        if (results.errors.length > 0) {
          onError('Error parsing CSV file: ' + results.errors[0].message);
          return;
        }
        onDataParsed(results.data as any[]);
      },
      header: true,
      skipEmptyLines: true,
      error: (error) => {
        onError('Error reading CSV file: ' + error.message);
      }
    });
  };

  const handleExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Convert to format similar to CSV with headers
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = (row as any[])[index] || '';
          });
          return obj;
        });
        
        onDataParsed(rows);
      } catch (error) {
        onError('Error parsing Excel file: ' + (error as Error).message);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors duration-300">
        <label className="flex flex-col items-center justify-center p-8 cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <span className="text-lg font-medium text-gray-700 mb-2">Upload Training Plan</span>
          <span className="text-sm text-gray-500 text-center">
            Drag and drop or click to select<br />
            Supports CSV, Excel (.xlsx), and PDF files
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Expected File Format</h3>
            <p className="text-sm text-blue-800">
              Your file should have alternating rows: week data (with mileage/cross-training) 
              followed by description rows for each workout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};