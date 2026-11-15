import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

export const Sidebar: React.FC = () => {
  const { user, login } = useAuth();
  const { currentProfile } = useProfile();
  const navigate = useNavigate();

  const handleDemoSwitch = async (email: string) => {
    try {
      const loggedUser = await login(email, 'CareCircle2026!');
      if (loggedUser.role === 'ELDERLY') {
        navigate('/elderly-dashboard');
      } else if (loggedUser.role === 'FAMILY_MEMBER') {
        navigate('/family-dashboard');
      } else {
        navigate('/caretaker-dashboard');
      }
    } catch (err) {
      console.error('Demo switch error', err);
    }
  };

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
    { label: 'Clinical Drug Safety', to: '/medications', icon: ShieldCheck },
    { label: 'Patient Details', to: '/profile', icon: User },
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

      {/* Demo Persona Switcher & Emergency Assistance */}
      <div className="border-t border-slate-200 pt-3 mt-4 space-y-3">
        {/* Indian Personas Quick Switcher */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Demo Personas
          </span>
          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={() => handleDemoSwitch('kausalya@carecircle.demo')}
              className={`w-full text-left px-2 py-1 rounded text-[11px] font-bold transition flex items-center justify-between ${
                user?.email === 'kausalya@carecircle.demo' || user?.email === 'eleanor@carecircle.demo'
                  ? 'bg-teal-600 text-white'
                  : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Kausalya Sharma</span>
              <span className="text-[9px] opacity-80 uppercase">Patient</span>
            </button>
            <button
              onClick={() => handleDemoSwitch('pooja@carecircle.demo')}
              className={`w-full text-left px-2 py-1 rounded text-[11px] font-bold transition flex items-center justify-between ${
                user?.email === 'pooja@carecircle.demo' || user?.email === 'sarah@carecircle.demo'
                  ? 'bg-teal-600 text-white'
                  : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Pooja Sharma</span>
              <span className="text-[9px] opacity-80 uppercase">Family</span>
            </button>
            <button
              onClick={() => handleDemoSwitch('rajesh@carecircle.demo')}
              className={`w-full text-left px-2 py-1 rounded text-[11px] font-bold transition flex items-center justify-between ${
                user?.email === 'rajesh@carecircle.demo' || user?.email === 'marcus@carecircle.demo'
                  ? 'bg-teal-600 text-white'
                  : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Rajesh Kumar, RN</span>
              <span className="text-[9px] opacity-80 uppercase">Nurse</span>
            </button>
            <button
              onClick={() => handleDemoSwitch('ramesh@carecircle.demo')}
              className={`w-full text-left px-2 py-1 rounded text-[11px] font-bold transition flex items-center justify-between ${
                user?.email === 'ramesh@carecircle.demo' || user?.email === 'doctor@carecircle.demo'
                  ? 'bg-teal-600 text-white'
                  : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Dr. Ramesh Rao, MD</span>
              <span className="text-[9px] opacity-80 uppercase">Doctor</span>
            </button>
          </div>
        </div>

        {/* Emergency Assistance Footer Banner */}
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-[11px]">
          <div className="flex items-center gap-1.5 text-rose-800 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Emergency Services</span>
          </div>
          <p className="text-rose-700 mt-1 leading-snug">
            National: <span className="font-bold">112</span> | Ambulance: <span className="font-bold">108</span> | Elderline: <span className="font-bold">14567</span>
          </p>
        </div>
      </div>
    </aside>
  );
};
