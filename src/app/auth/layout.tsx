'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Don't render anything until we've checked auth
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If user is not logged in, render auth forms
  if (!user) {
    return (
      <div className="flex flex-col md:flex-row min-h-[80vh]">
        <div className="w-full md:w-1/2 flex items-center justify-center p-8">
          {children}
        </div>
        <div className="w-full md:w-1/2 bg-blue-600 text-white p-8 flex flex-col justify-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold mb-6">Understand Your Health with AI-Powered Insights</h2>
            <p className="text-xl mb-6">
              MedLab Analyzer helps you make sense of medical test results with clear explanations and personalized insights.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Upload lab reports securely</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Get instant AI-powered explanations</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Track health trends over time</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Share reports with healthcare providers</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
}