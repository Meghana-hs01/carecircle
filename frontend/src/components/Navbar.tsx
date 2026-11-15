import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Bell,
  LogOut,
  Type,
  Eye,
  Users,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useProfile } from '../context/ProfileContext';
import { notificationService } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, login, logout } = useAuth();
  const { highContrast, largeText, toggleHighContrast, toggleLargeText } = useAccessibility();
  const { profiles, currentProfile, setCurrentProfileId } = useProfile();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      notificationService.listNotifications(10).then((notifs) => {
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
      }).catch(() => {});
    }
  }, [user]);

  const handleDemoSwitch = async (email: string) => {
    try {
      const loggedUser = await login(email, 'CareCircle2026!');
      if (loggedUser.role === 'ELDERLY') {
        navigate('/dashboard/elderly');
      } else if (loggedUser.role === 'FAMILY_MEMBER') {
        navigate('/dashboard/family');
      } else if (loggedUser.role === 'CARETAKER') {
        navigate('/dashboard/caretaker');
      }
    } catch (err) {
      console.error('Demo switch error', err);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group" aria-label="CareCircle Home">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 group-hover:bg-teal-700 transition">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                CareCircle
              </span>
              <span className="hidden sm:block text-xs font-medium text-teal-700 tracking-wide">
                Better Care. Together.
              </span>
            </div>
          </Link>
        </div>

        {/* Profile Switcher (for Family & Caretakers) */}
        {user && user.role !== 'ELDERLY' && profiles.length > 0 && (
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
            <Users className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Viewing:</span>
            <select
              aria-label="Select Elderly Profile to View"
              value={currentProfile?.id || ''}
              onChange={(e) => setCurrentProfileId(Number(e.target.value))}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 1-Click Demo Persona Switcher (For Evaluators & Hackathon Demos) */}
        <div className="hidden xl:flex items-center gap-1.5 bg-amber-50/90 border border-amber-200 rounded-xl px-2.5 py-1 text-xs text-amber-900 shadow-xs">
          <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Demo Persona:
          </span>
          <button
            onClick={() => handleDemoSwitch('eleanor@carecircle.demo')}
            className={`px-2 py-0.5 rounded-md font-medium transition ${
              user?.email === 'eleanor@carecircle.demo'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'hover:bg-amber-100 text-amber-900'
            }`}
            title="Instant Switch to Eleanor Vance (Elderly Persona)"
          >
            👵 Elderly
          </button>
          <span className="text-amber-300">|</span>
          <button
            onClick={() => handleDemoSwitch('sarah@carecircle.demo')}
            className={`px-2 py-0.5 rounded-md font-medium transition ${
              user?.email === 'sarah@carecircle.demo'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'hover:bg-amber-100 text-amber-900'
            }`}
            title="Instant Switch to Sarah Vance (Family Member Persona)"
          >
            👩‍💼 Family
          </button>
          <span className="text-amber-300">|</span>
          <button
            onClick={() => handleDemoSwitch('marcus@carecircle.demo')}
            className={`px-2 py-0.5 rounded-md font-medium transition ${
              user?.email === 'marcus@carecircle.demo'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'hover:bg-amber-100 text-amber-900'
            }`}
            title="Instant Switch to Marcus Chen, RN (Caretaker Persona)"
          >
            👨‍⚕️ Caretaker
          </button>
        </div>

        {/* Action Controls & User menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Accessibility Toggles */}
          <button
            onClick={toggleLargeText}
            title={largeText ? 'Disable Large Text' : 'Enable Large Text'}
            aria-pressed={largeText}
            className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition ${
              largeText
                ? 'bg-teal-100 border-teal-500 text-teal-900'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Type className="w-4 h-4" />
            <span className="hidden lg:inline">{largeText ? 'Large Text On' : 'Text Size'}</span>
          </button>

          <button
            onClick={toggleHighContrast}
            title={highContrast ? 'Disable High Contrast' : 'Enable High Contrast'}
            aria-pressed={highContrast}
            className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition ${
              highContrast
                ? 'bg-black border-yellow-400 text-yellow-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden lg:inline">{highContrast ? 'High Contrast' : 'Contrast'}</span>
          </button>

          {/* Notifications Bell */}
          {user && (
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              aria-label={`Notification Centre. ${unreadCount} unread`}
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* User info & Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{user.full_name}</p>
                <span className="inline-block text-[11px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                aria-label="Log Out of CareCircle"
                className="p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 rounded-lg transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
