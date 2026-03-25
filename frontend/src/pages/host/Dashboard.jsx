import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Users, ShieldCheck, ClipboardList, Monitor, FlaskConical,
  FolderKanban, BookOpen, TrendingUp, Crown, Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function HostDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/host/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const countCards = [
    { label: 'Active Admins', value: stats?.counts?.admins ?? 0, icon: ShieldCheck, color: 'amber', to: '/host/admins' },
    { label: 'Total Students', value: stats?.counts?.students ?? 0, icon: Users, color: 'blue' },
    { label: 'Assignments', value: stats?.counts?.assignments ?? 0, icon: ClipboardList, color: 'violet' },
    { label: 'Presentations', value: stats?.counts?.presentations ?? 0, icon: Monitor, color: 'emerald' },
    { label: 'Lab Tasks', value: stats?.counts?.labTasks ?? 0, icon: FlaskConical, color: 'cyan' },
    { label: 'Projects', value: stats?.counts?.projects ?? 0, icon: FolderKanban, color: 'rose' },
  ];
  const colorMap = {
    amber: 'bg-amber-500/20 text-amber-400', blue: 'bg-blue-500/20 text-blue-400',
    violet: 'bg-violet-500/20 text-violet-400', emerald: 'bg-emerald-500/20 text-emerald-400',
    cyan: 'bg-cyan-500/20 text-cyan-400', rose: 'bg-rose-500/20 text-rose-400',
  };

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown size={20} className="text-amber-400" />
            <h1 className="text-2xl font-bold text-white">Host Dashboard</h1>
          </div>
          <p className="text-slate-400">System-wide overview · Welcome back, {user?.name}</p>
        </div>
        <Link to="/host/admins" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Admin
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {countCards.map((s) => {
          const Icon = s.icon;
          const card = (
            <div className="card hover:border-slate-700 transition-colors group cursor-pointer">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[s.color]}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          );
          return s.to ? <Link key={s.label} to={s.to}>{card}</Link> : <div key={s.label}>{card}</div>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dept Breakdown */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-400" /> Students by Department
          </h2>
          {stats?.deptBreakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.deptBreakdown.map(d => ({ dept: d._id?.substring(0, 10), count: d.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dept" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No student data yet</div>
          )}
        </div>

        {/* Recent Admins */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-400" /> Recent Admins
            </h2>
            <Link to="/host/admins" className="text-xs text-amber-400 hover:text-amber-300">Manage all</Link>
          </div>
          {stats?.recentAdmins?.length > 0 ? (
            <div className="space-y-2">
              {stats.recentAdmins.map((a) => (
                <div key={a._id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {a.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.email} · {a.department || 'All Depts'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {a.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShieldCheck size={32} className="text-slate-600 mb-2" />
              <p className="text-slate-500 text-sm">No admins created yet</p>
              <Link to="/host/admins" className="btn-primary mt-3 text-sm py-1.5 px-3">Add First Admin</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
