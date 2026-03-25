import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ClipboardList, Monitor, FlaskConical, FolderKanban, Award, TrendingUp } from 'lucide-react';

const gradePoints = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, F: 0 };

export default function StudentDashboard() {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [labTasks, setLabTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [mRes, aRes, pRes, lRes, prRes] = await Promise.all([
          api.get('/marks/my'),
          api.get('/tasks/assignments/my'),
          api.get('/tasks/presentations/my'),
          api.get('/tasks/lab-tasks/my'),
          api.get('/tasks/projects/my'),
        ]);
        setMarks(mRes.data);
        setAssignments(aRes.data);
        setPresentations(pRes.data);
        setLabTasks(lRes.data);
        setProjects(prRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  // Build year-wise chart data
  const yearData = marks.reduce((acc, m) => {
    const key = m.year;
    if (!acc[key]) acc[key] = { year: key, total: 0, count: 0 };
    acc[key].total += m.totalMarks || 0;
    acc[key].count += 1;
    return acc;
  }, {});
  const chartData = Object.values(yearData).map(s => ({ ...s, avg: Math.round(s.total / s.count) }));

  // Skills radar
  const skills = user?.studentData?.skills || [];
  const skillData = skills.slice(0, 6).map(s => ({ subject: s, value: Math.floor(Math.random() * 40) + 60 }));

  const taskSummary = [
    { label: 'Assignments', total: assignments.length, done: assignments.filter(a => a.status === 'approved').length, icon: ClipboardList, color: 'blue', to: '/student/assignments' },
    { label: 'Presentations', total: presentations.length, done: presentations.filter(a => a.status === 'approved').length, icon: Monitor, color: 'emerald', to: '/student/presentations' },
    { label: 'Lab Tasks', total: labTasks.length, done: labTasks.filter(a => a.status === 'approved').length, icon: FlaskConical, color: 'cyan', to: '/student/lab-tasks' },
    { label: 'Projects', total: projects.length, done: projects.filter(a => a.status === 'approved').length, icon: FolderKanban, color: 'rose', to: '/student/projects' },
  ];

  const colorBg = { blue: 'bg-blue-500/20 text-blue-400', emerald: 'bg-emerald-500/20 text-emerald-400', cyan: 'bg-cyan-500/20 text-cyan-400', rose: 'bg-rose-500/20 text-rose-400' };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 p-8 overflow-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-slate-400 mt-1">{user?.studentData?.department} · {user?.studentData?.year} · {user?.studentData?.batch}</p>
        </div>
        <div className="text-right">
          <span className="font-mono text-blue-400 text-lg font-bold">{user?.studentId}</span>
          <p className="text-xs text-slate-500 mt-1">Student ID</p>
        </div>
      </div>

      {/* Task Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {taskSummary.map((t) => {
          const Icon = t.icon;
          const pct = t.total ? Math.round((t.done / t.total) * 100) : 0;
          return (
            <Link key={t.label} to={t.to} className="card hover:border-slate-700 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorBg[t.color]}`}>
                <Icon size={20} />
              </div>
              <p className="text-sm font-medium text-slate-300">{t.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{t.done}<span className="text-slate-500 text-sm font-normal">/{t.total}</span></p>
              <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{pct}% complete</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Marks Chart */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-400" /> Academic Performance
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 150]} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
                <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Marks" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No marks data yet</div>
          )}
        </div>

        {/* Skills Radar */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Award size={18} className="text-violet-400" /> Skill Profile
          </h2>
          {skills.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={skillData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Radar dataKey="value" fill="#8b5cf6" fillOpacity={0.3} stroke="#8b5cf6" />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map(s => <span key={s} className="badge-purple text-xs">{s}</span>)}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No skills listed</div>
          )}
        </div>
      </div>

      {/* Recent Marks */}
      {marks.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Recent Marks</h2>
            <Link to="/student/marks" className="text-xs text-blue-400 hover:text-blue-300">View all</Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Subject</th><th>Year</th><th>Internal</th><th>External</th><th>Total</th><th>Grade</th></tr></thead>
              <tbody>
                {marks.slice(0, 5).map(m => (
                  <tr key={m._id}>
                    <td className="font-medium text-slate-200">{m.subject}</td>
                    <td><span className="badge-blue">{m.year}</span></td>
                    <td className="text-slate-300">{m.internalMarks}</td>
                    <td className="text-slate-300">{m.externalMarks}</td>
                    <td className="font-bold text-white">{m.totalMarks}</td>
                    <td><span className={m.grade === 'F' ? 'badge-red' : m.grade === 'O' ? 'badge-green' : 'badge-blue'}>{m.grade}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
