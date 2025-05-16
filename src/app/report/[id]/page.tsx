'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../lib/auth';
import { getReport, getPublicReport, addReportAnalysis, updateReport } from '../../../../lib/db';
import type { Report, TestResult, ReportAnalysis } from '../../../../lib/db';
import ReactMarkdown from 'react-markdown';

import { Timestamp } from 'next/dist/server/lib/cache-handlers/types';

export default function ReportDetailPage() {
    const params = useParams();
  const id = params?.id as string;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [sharing, setSharing] = useState<boolean>(false);
  const [showShareLink, setShowShareLink] = useState<boolean>(false);
  const [shareLink, setShareLink] = useState<string>('');

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;

      try {
        // Try to get report as authenticated user first
        if (user) {
          const reportData = await getReport(id as string);
          if (reportData) {
            setReport(reportData);
            return;
          }
        }

        // If not found or not authenticated, try to get as public report
        const publicReport = await getPublicReport(id as string);
        if (publicReport) {
          setReport(publicReport);
        } else {
          // If neither works, either report doesn't exist or user doesn't have access
          setError('Report not found or you do not have permission to view it');
          if (user) {
            setTimeout(() => router.push('/dashboard'), 3000);
          } else {
            setTimeout(() => router.push('/auth/login'), 3000);
          }
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, user, router]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  const analyzeReport = async () => {
  if (!report || !user) return;

  setAnalyzing(true);

  try {
    const prompts = report.content.testResults.map(test => {
      return `Explain what a ${test.name} value of ${test.value} ${test.unit} means in plain English. Include normal range (${
        test.referenceRange || 'not provided'
      }), possible causes of abnormal levels, and questions a patient might ask their doctor.`;
    });

    const sonarResponse = await fetch('/api/analyze-with-sonar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompts })
    });

    const { analysisSummary, recommendations } = await sonarResponse.json();

    const analysis: Omit<ReportAnalysis, 'createdAt'> = {
      summary: analysisSummary,
      abnormalResults: [], // You can optionally still compute this if needed
      recommendations
    };

    await addReportAnalysis(report.id, analysis);

    setReport(prevReport => {
      if (!prevReport) return null;
      return {
        ...prevReport,
        analysis: {
          ...analysis,
          createdAt: Date.now()
        }
      };
    });

  } catch (err) {
    console.error('Sonar analysis failed:', err);
    setError('Failed to get AI analysis. Please try again.');
  } finally {
    setAnalyzing(false);
  }
};


  const togglePublicStatus = async () => {
    if (!report || !user) return;
    
    setSharing(true);
    
    try {
      const updatedReport: Partial<Report> = {
        isPublic: !report.isPublic
      };
      
      await updateReport(report.id, updatedReport);
      
      // Update local state
      setReport(prevReport => {
        if (!prevReport) return null;
        return {
          ...prevReport,
          isPublic: !prevReport.isPublic
        };
      });
      
      // Show share link if making public
      if (!report.isPublic) {
        generateShareLink();
      } else {
        setShowShareLink(false);
      }
      
    } catch (err) {
      console.error('Error updating report visibility:', err);
      setError('Failed to update report sharing settings. Please try again.');
    } finally {
      setSharing(false);
    }
  };
  
  const generateShareLink = () => {
    // Create a shareable link
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/report/${report?.id}`;
    setShareLink(link);
    setShowShareLink(true);
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return <div className="text-center py-10">Loading report...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <p className="mt-2">Redirecting you shortly...</p>
      </div>
    );
  }

  if (!report) {
    return <div className="text-center py-10">Report not found</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{report.title}</h1>
            <p className="text-gray-500">Uploaded: {formatDate(report.uploadDate)}</p>
          </div>
          
          {user && user.uid === report.userId && (
            <div className="mt-4 md:mt-0">
              <button
                onClick={togglePublicStatus}
                disabled={sharing}
                className={`px-4 py-2 rounded-md ${
                  report.isPublic 
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {sharing 
                  ? 'Updating...' 
                  : report.isPublic 
                    ? 'Make Private' 
                    : 'Share Report'}
              </button>
              
              {report.isPublic && (
                <button
                  onClick={generateShareLink}
                  className="ml-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                >
                  Get Link
                </button>
              )}
            </div>
          )}
        </div>
        
        {showShareLink && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md border">
            <p className="mb-2 font-medium">Share this link with others:</p>
            <div className="flex">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md bg-white"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Patient Information */}
        {report.content.patientInfo && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Patient Information</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              {report.content.patientInfo.name && (
                <p className="mb-1"><span className="font-medium">Name:</span> {report.content.patientInfo.name}</p>
              )}
              {report.content.patientInfo.age && (
                <p className="mb-1"><span className="font-medium">Age:</span> {report.content.patientInfo.age}</p>
              )}
              {report.content.patientInfo.gender && (
                <p className="mb-1"><span className="font-medium">Gender:</span> {report.content.patientInfo.gender}</p>
              )}
              {report.content.patientInfo.patientId && (
                <p><span className="font-medium">Patient ID:</span> {report.content.patientInfo.patientId}</p>
              )}
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Test Results</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left border-b">Test</th>
                  <th className="py-2 px-4 text-left border-b">Result</th>
                  <th className="py-2 px-4 text-left border-b">Unit</th>
                  <th className="py-2 px-4 text-left border-b">Reference Range</th>
                  <th className="py-2 px-4 text-left border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.content.testResults.map((test, index) => {
                  // Determine if result is out of range
                  let status = 'Normal';
                  let statusClass = 'text-green-600';
                  
                  if (test.referenceRange && test.value) {
                    const value = Number(test.value);
                    if (!isNaN(value)) {
                      // Parse reference range in format "min-max" or "< max" or "> min"
                      if (test.referenceRange.includes('-')) {
                        const [min, max] = test.referenceRange.split('-').map(parseFloat);
                        if (value < min) {
                          status = 'Low';
                          statusClass = 'text-red-600 font-medium';
                        } else if (value > max) {
                          status = 'High';
                          statusClass = 'text-red-600 font-medium';
                        }
                      } else if (test.referenceRange.includes('<')) {
                        const max = parseFloat(test.referenceRange.replace('<', '').trim());
                        if (value >= max) {
                          status = 'High';
                          statusClass = 'text-red-600 font-medium';
                        }
                      } else if (test.referenceRange.includes('>')) {
                        const min = parseFloat(test.referenceRange.replace('>', '').trim());
                        if (value <= min) {
                          status = 'Low';
                          statusClass = 'text-red-600 font-medium';
                        }
                      }
                    }
                  }
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{test.name}</td>
                      <td className="py-2 px-4 border-b font-medium">{test.value}</td>
                      <td className="py-2 px-4 border-b">{test.unit}</td>
                      <td className="py-2 px-4 border-b">{test.referenceRange}</td>
                      <td className={`py-2 px-4 border-b ${statusClass}`}>{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctor's Notes */}
        {report.content.doctorNotes && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Doctor&apos;s Notes</h2>
            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
              {report.content.doctorNotes}
            </div>
          </div>
        )}
        
        {/* Analysis Section */}
        <div className="border-t pt-4 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">AI Analysis</h2>
            
            {user && !report.analysis && (
              <button
                onClick={analyzeReport}
                disabled={analyzing}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Report'}
              </button>
            )}
          </div>
          
          {report.analysis ? (
            <div>
              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <p className="font-medium text-lg mb-2">Summary</p>
                <div className="prose prose-sm max-w-none text-gray-800">
  <ReactMarkdown>{report.analysis.summary}</ReactMarkdown>
</div>
                <p className="text-sm text-gray-500 mt-2">
                  Analysis generated on {formatDate(report.analysis.createdAt)}
                </p>
              </div>
              
              {report.analysis.abnormalResults && report.analysis.abnormalResults.length > 0 && (
                <div className="mb-4">
                  <p className="font-medium mb-2">Abnormal Results</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {report.analysis.abnormalResults.map((result, index) => (
                      <li key={index}>
                        <span className="font-medium">{result.name}:</span> {result.value} {result.unit}
                        {result.referenceRange && <span className="text-gray-600"> (Reference: {result.referenceRange})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {report.analysis.recommendations && (
                <div>
                  <p className="font-medium mb-2">Recommendations</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {report.analysis.recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-md text-center">
              {analyzing ? (
                <p>Analyzing your report... This may take a moment.</p>
              ) : (
                <p>
                  {user 
                    ? 'Click "Analyze Report" to get AI-powered insights about your test results' 
                    : 'Log in to analyze this report'
                  }
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}