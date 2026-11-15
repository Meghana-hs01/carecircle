import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

export const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Loading CareCircle...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 relative">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Care Assistant Pill */}
      {location.pathname !== '/ai-assistant' && (
        <Link
          to="/ai-assistant"
          aria-label="Open CareCircle AI Care Assistant"
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-full shadow-xl shadow-teal-700/30 border border-teal-400/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition group"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          </div>
          <span className="tracking-wide">CareCircle AI</span>
        </Link>
      )}
    </div>
  );
};
