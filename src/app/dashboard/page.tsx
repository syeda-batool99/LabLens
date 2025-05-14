'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { getUserReports } from '../../../lib/db';
import type { Report } from '../../../lib/db';

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchReports = async () => {
      try {
        const userReports = await getUserReports(user.uid);
        setReports(userReports);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, router]);

  // Format date from Firestore Timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  if (!user) {
    return null; // This will be handled by the useEffect redirect
  }

  if (loading) {
    return <div className="text-center py-10">Loading your reports...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Reports</h1>
        <p className="text-gray-600">
          View, analyze, and manage your medical lab reports
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <Link 
          href="/upload"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-block"
        >
          Upload New Report
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
          <p className="text-lg text-gray-600 mb-4">You haven&apos;t uploaded any reports yet.</p>
          <Link 
            href="/upload"
            className="text-blue-600 font-medium hover:underline"
          >
            Upload your first report
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div key={report.id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 truncate">{report.title}</h2>
                <p className="text-gray-500 text-sm mb-3">
                  Uploaded: {formatDate(report.uploadDate)}
                </p>
                <Link
                  href={`/report/${report.id}`}
                  className="text-blue-600 font-medium hover:underline block"
                >
                  View Report
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}