import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { useProfile } from '../context/ProfileContext';
import { analyticsService } from '../services/api';
import { AdherenceStats } from '../types';
import { StatCard } from '../components/StatCard';

export const AnalyticsPage: React.FC = () => {
  const { currentProfile } = useProfile();
  const [stats, setStats] = useState<AdherenceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [windowDays, setWindowDays] = useState(14);

  useEffect(() => {
    if (!currentProfile) return;
    setLoading(true);
    analyticsService
      .getAdherence(currentProfile.id, windowDays)
      .then((data) => setStats(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [currentProfile, windowDays]);

  const adherenceRate = stats?.adherence_percentage ?? 100;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-teal-600" />
            <span>Medication Adherence Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real mathematical adherence computed from actual PostgreSQL/SQLite dose records for {currentProfile?.full_name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            className="text-xs font-bold p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Adherence Formula Explanation Card */}
      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
        <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-sm">Mathematical Adherence Formulation:</span>
          Adherence percentage is calculated strictly from past, evaluated doses:{' '}
          <code className="bg-white px-2 py-0.5 rounded border border-teal-300 font-mono font-bold">
            (Taken Doses / (Taken + Missed + Skipped)) × 100
          </code>
          . Still-upcoming and future scheduled doses are strictly excluded so the score reflects actual past compliance.
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Adherence"
          value={`${adherenceRate}%`}
          subtitle={`Over past ${windowDays} days`}
          icon={TrendingUp}
          colorScheme={adherenceRate >= 80 ? 'emerald' : adherenceRate >= 60 ? 'amber' : 'rose'}
          trend={adherenceRate >= 80 ? 'Excellent' : 'Needs Follow-up'}
        />
        <StatCard
          title="Taken Doses"
          value={stats?.taken ?? 0}
          subtitle="Administered on time"
          icon={CheckCircle2}
          colorScheme="teal"
        />
        <StatCard
          title="Missed Doses"
          value={stats?.missed ?? 0}
          subtitle="Unconfirmed after grace"
          icon={AlertTriangle}
          colorScheme={stats?.missed ? 'rose' : 'blue'}
        />
        <StatCard
          title="Skipped Doses"
          value={stats?.skipped ?? 0}
          subtitle="Clinically documented skips"
          icon={Clock}
          colorScheme="amber"
        />
      </div>

      {/* Recharts Graphs */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500 mt-2">Computing adherence curves...</p>
        </div>
      ) : !stats || stats.daily_trends.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl text-xs text-slate-500">
          No dose records available in this period to graph.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Daily Trend Line Chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-1">
              Daily Adherence Percentage Trend
            </h2>
            <p className="text-xs text-slate-400 mb-6">Percentage of scheduled doses successfully taken per day</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.daily_trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="adherence_percentage"
                    name="Adherence %"
                    stroke="#0d9488"
                    strokeWidth={3}
                    dot={{ fill: '#0d9488', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dose Breakdown Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-1">
              Daily Dose Distribution (Taken vs Missed vs Skipped)
            </h2>
            <p className="text-xs text-slate-400 mb-6">Volume of scheduled dose outcomes by calendar date</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.daily_trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="taken" name="Taken" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="missed" name="Missed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="skipped" name="Skipped" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
