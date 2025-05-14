'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';

export default function Navigation() {
  const { user, logOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">
          MedLab Analyzer
        </Link>
        <div className="flex space-x-4">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/upload" className="hover:text-blue-600">
                Upload Report
              </Link>
              <button
                onClick={handleLogout}
                className="hover:text-blue-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-blue-600">
                Login
              </Link>
              <Link href="/auth/signup" className="hover:text-blue-600">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}