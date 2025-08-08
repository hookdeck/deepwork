'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-xl font-bold">
            Deep Queue
          </Link>
          {session && (
            <>
              <Link 
                href="/research" 
                className={`hover:text-gray-300 ${isActive('/research') ? 'text-blue-400' : ''}`}
              >
                Research
              </Link>
              <Link
                href="/events"
                className={`hover:text-gray-300 ${isActive('/events') ? 'text-blue-400' : ''}`}
              >
                Events
              </Link>
            </>
          )}
        </div>
        <div>
          {session ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm">{session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}