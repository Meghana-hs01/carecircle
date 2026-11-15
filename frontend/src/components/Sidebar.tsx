import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Clock,
  Pill,
  History,
  Calendar,
  Users2,
  Activity,
  BarChart3,
  User,
  KeyRound,
  Bell,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { currentProfile } = useProfile();

  if (!user) return null;

  // Determine role-based dashboard path
  const dashboardPath =
    user.role === 'ELDERLY'
      ? '/elderly-dashboard'
      : user.role === 'FAMILY_MEMBER'
      ? '/family-dashboard'
      : '/caretaker-dashboard';

  const navItems = [
    { label: 'Dashboard', to: dashboardPath, icon: LayoutDashboard },
    { label: 'AI Assistant', to: '/ai-assistant', icon: Sparkles },
    { label: 'Care Timeline', to: '/timeline', icon: Clock },
    { label: 'Medications', to: '/medications', icon: Pill },
    { label: 'Dose History', to: '/medication-history', icon: History },
    { label: 'Appointments', to: '/appointments', icon: Calendar },
    { label: 'Care Circle', to: '/care-circle', icon: Users2 },
    { label: 'Care Activities', to: '/activities', icon: Activity },
    { label: 'Adherence Analytics', to: '/analytics', icon: BarChart3 },
    { label: 'Healthcare Profile', to: '/profile', icon: User },
    { label: 'Join via Code', to: '/accept-invitation', icon: KeyRound },
    { label: 'Notifications', to: '/notifications', icon: Bell },
    { label: 'Accessibility', to: '/accessibility', icon: Eye },
  ];

  return (
    <aside
      className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]"
      aria-label="CareCircle Navigation Sidebar"
    >
      <div className="space-y-6">
        {/* Active Profile Banner for non-elderly */}
        {user.role !== 'ELDERLY' && currentProfile && (
          <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
              Active Patient
            </span>
            <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{currentProfile.full_name}</p>
            {currentProfile.emergency_contact_phone && (
              <p className="text-[11px] text-slate-600 truncate mt-1">
                Emergency: {currentProfile.emergency_contact_phone}
              </p>
            )}
          </div>
        )}

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Emergency Assistance Footer Banner */}
      <div className="border-t border-slate-200 pt-4 mt-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-1.5 text-rose-800 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Emergency Help</span>
          </div>
          <p className="text-rose-700 mt-1 leading-relaxed">
            In medical emergencies, call your local emergency services (911 / 112) immediately.
          </p>
        </div>
      </div>
    </aside>
  );
};
