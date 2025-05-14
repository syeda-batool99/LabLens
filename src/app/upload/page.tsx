'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { addReport } from '../../../lib/db';
import type { TestResult, ReportContent } from '../../../lib/db';


export default function UploadPage() {
  const [title, setTitle] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: '', value: '', unit: '', referenceRange: '' }
  ]);
  const [patientName, setPatientName] = useState<string>('');
  const [patientAge, setPatientAge] = useState<string>('');
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handleTestResultChange = (index: number, field: keyof TestResult, value: string) => {
    const updatedResults = [...testResults];
    updatedResults[index] = { ...updatedResults[index], [field]: value };
    setTestResults(updatedResults);
  };

  const addTestResultField = () => {
    setTestResults([...testResults, { name: '', value: '', unit: '', referenceRange: '' }]);
  };

  const removeTestResultField = (index: number) => {
    if (testResults.length > 1) {
      const updatedResults = testResults.filter((_, i) => i !== index);
      setTestResults(updatedResults);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!title.trim()) {
      setError('Please provide a title for the report');
      return;
    }

    // Validate at least one test result has name and value
    const validResults = testResults.filter(result => 
      result.name.trim() && (result.value.toString().trim())
    );
    
    if (validResults.length === 0) {
      setError('Please add at least one test result with name and value');
      return;
    }

    setLoading(true);

    try {
      // Build report content
      const reportContent: ReportContent = {
        testResults: validResults,
        patientInfo: {
          name: patientName || undefined,
          age: patientAge ? parseInt(patientAge) : undefined
        },
        doctorNotes: doctorNotes || undefined
      };

      // Add report to database
      const reportId = await addReport(user!.uid, {
        title,
        content: reportContent,
        isPublic,
        userId: user!.uid
      });

      setSuccess(true);
      
      // Reset form
      setTitle('');
      setTestResults([{ name: '', value: '', unit: '', referenceRange: '' }]);
      setPatientName('');
      setPatientAge('');
      setDoctorNotes('');
      setIsPublic(false);
      
      // Redirect to the new report after a delay
      setTimeout(() => {
        router.push(`/report/${reportId}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error uploading report:', err);
      setError('Failed to upload report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // This will be handled by the useEffect redirect
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Upload Medical Report</h1>
        <p className="text-gray-600">
          Enter your lab test results for AI-powered analysis
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Report uploaded successfully! Redirecting to report...
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Report Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g., Annual Blood Work - May 2023"
            required
          />
        </div>
        
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-3">Patient Information (Optional)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name
              </label>
              <input
                id="patientName"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="patientAge" className="block text-sm font-medium text-gray-700 mb-1">
                Patient Age
              </label>
              <input
                id="patientAge"
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="0"
                max="120"
              />
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-3">Test Results *</h2>
          
          {testResults.map((result, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 pb-4 border-b">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Name
                </label>
                <input
                  type="text"
                  value={result.name}
                  onChange={(e) => handleTestResultChange(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Hemoglobin"
                  required={index === 0}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Result Value
                </label>
                <input
                  type="text"
                  value={result.value}
                  onChange={(e) => handleTestResultChange(index, 'value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 14.2"
                  required={index === 0}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={result.unit}
                  onChange={(e) => handleTestResultChange(index, 'unit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., g/dL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Range
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={result.referenceRange}
                    onChange={(e) => handleTestResultChange(index, 'referenceRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 12.0-15.5"
                  />
                  
                  <button
                    type="button"
                    onClick={() => removeTestResultField(index)}
                    className="ml-2 bg-red-50 text-red-500 p-2 rounded hover:bg-red-100"
                    title="Remove test"
                    disabled={testResults.length === 1}
                  >
                    X
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addTestResultField}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
          >
            + Add Another Test
          </button>
        </div>
        
        <div className="border-t pt-4">
          <label htmlFor="doctorNotes" className="block text-sm font-medium text-gray-700 mb-1">
            Doctor&apos;s Notes (Optional)
          </label>
          <textarea
            id="doctorNotes"
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={4}
          />
        </div>
        
        <div className="flex items-center">
          <input
            id="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
            Make this report shareable (public link)
          </label>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Uploading...' : 'Upload Report'}
          </button>
        </div>
      </form>
    </div>
  );
}