import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Users, BookOpen, ClipboardList, Monitor, FlaskConical, FolderKanban, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, marks: 0, assignments: 0, presentations: 0, labTasks: 0, projects: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [gradeData, setGradeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studRes, marksRes, assignRes, presRes, labRes, projRes] = await Promise.all([
          api.get('/students'),
          api.get('/marks'),
          api.get('/tasks/assignments'),
          api.get('/tasks/presentations'),
          api.get('/tasks/lab-tasks'),
          api.get('/tasks/projects'),
        ]);
        setStats({
          students: studRes.data.length,
          marks: marksRes.data.length,
          assignments: assignRes.data.length,
          presentations: presRes.data.length,
          labTasks: labRes.data.length,
          projects: projRes.data.length,
        });
        setRecentStudents(studRes.data.slice(0, 5));

        // Build grade distribution
        const gradeCounts = {};
        marksRes.data.forEach(m => {
          gradeCounts[m.grade] = (gradeCounts[m.grade] || 0) + 1;
        });
        const gradeOrder = ['O', 'A+', 'A', 'B+', 'B', 'C', 'F'];
        setGradeData(gradeOrder.filter(g => gradeCounts[g]).map(g => ({ grade: g, count: gradeCounts[g] })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Students', value: stats.students, icon: Users, color: 'blue', to: '/admin/students' },
    { label: 'Marks Entries', value: stats.marks, icon: BookOpen, color: 'violet', to: '/admin/marks' },
    { label: 'Assignments', value: stats.assignments, icon: ClipboardList, color: 'amber', to: '/admin/tasks/assignments' },
    { label: 'Presentations', value: stats.presentations, icon: Monitor, color: 'emerald', to: '/admin/tasks/presentations' },
    { label: 'Lab Tasks', value: stats.labTasks, icon: FlaskConical, color: 'cyan', to: '/admin/tasks/lab-tasks' },
    { label: 'Projects', value: stats.projects, icon: FolderKanban, color: 'rose', to: '/admin/tasks/projects' },
  ];

  const colorMap = {
    blue: 'bg-blue-500/20 text-blue-400',
    violet: 'bg-violet-500/20 text-violet-400',
    amber: 'bg-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    rose: 'bg-rose-500/20 text-rose-400',
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Overview of student performance and task allocation</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} to={s.to} className="card hover:border-slate-700 transition-colors group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[s.color]}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-400" /> Grade Distribution
          </h2>
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="grade" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
              No marks data yet
            </div>
          )}
        </div>

        {/* Recent Students */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Users size={18} className="text-violet-400" /> Recent Students
            </h2>
            <Link to="/admin/students" className="text-xs text-blue-400 hover:text-blue-300">View all</Link>
          </div>
          {recentStudents.length > 0 ? (
            <div className="space-y-2">
              {recentStudents.map((s) => (
                <div key={s._id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg hover:bg-slate-800/60 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.studentId} · {s.department}</p>
                  </div>
                  <span className="badge-blue text-xs">{s.year}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle size={32} className="text-slate-600 mb-2" />
              <p className="text-slate-500 text-sm">No students added yet</p>
              <Link to="/admin/students" className="btn-primary mt-3 text-sm py-1.5 px-3">Add Students</Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 card">
        <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/students" className="btn-secondary text-sm flex items-center gap-2">
            <Users size={15} /> Add Student
          </Link>
          <Link to="/admin/marks" className="btn-secondary text-sm flex items-center gap-2">
            <BookOpen size={15} /> Enter Marks
          </Link>
          <Link to="/admin/tasks/assignments" className="btn-secondary text-sm flex items-center gap-2">
            <ClipboardList size={15} /> Allocate Assignment
          </Link>
          <Link to="/admin/tasks/projects" className="btn-secondary text-sm flex items-center gap-2">
            <FolderKanban size={15} /> Create Project
          </Link>
        </div>
      </div>
    </div>
  );
}
