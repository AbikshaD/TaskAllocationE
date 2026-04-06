import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { GraduationCap, Lock, User, ArrowRight, BookOpen, Shield } from 'lucide-react';

export default function Login() {
  const { user, hostLogin, adminLogin, studentLogin } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', studentId: '', password: '' });

  useEffect(() => {
    if (user) {
      if (user.role === 'host') navigate('/host', { replace: true });
      else if (user.role === 'admin') navigate('/admin', { replace: true });
      else navigate('/student', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (role === 'host') {
        await hostLogin(form.email, form.password);
        toast.success('Welcome, Host!');
      } else if (role === 'admin') {
        await adminLogin(form.email, form.password);
        toast.success('Welcome back, Admin!');
      } else {
        await studentLogin(form.studentId, form.password);
        toast.success('Welcome back!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'student', label: 'Student', icon: '🎓' },
    { id: 'admin', label: 'Admin', icon: '🛡️' },
    { id: 'host', label: 'Host', icon: '👑' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">AcadEdge</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            College Task<br />
            <span className="text-blue-400">Management</span><br />
            System
          </h1>
          <p className="text-slate-400 text-lg max-w-sm">
            A unified platform to allocate and track assignments, projects, lab tasks, and paper presentations.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { label: 'Students', value: '500+' },
            { label: 'Tasks Managed', value: '2,400+' },
            { label: 'Departments', value: '8' },
            { label: 'Academic Years', value: '4' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">AcadEdge</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Sign in</h2>
          <p className="text-slate-400 mb-8">Access your dashboard</p>

          {/* Role Toggle */}
          <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl mb-8">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  role === r.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {role === 'student' ? (
              <div>
                <label className="label">Roll Number</label>
                <div className="relative">
                  <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" required className="input pl-10" placeholder="e.g. CS2001"
                    value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
                </div>
              </div>
            ) : (
              <div>
                <label className="label">{role === 'host' ? 'Host' : 'Admin'} Email</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="email" required className="input pl-10"
                    placeholder={role === 'host' ? 'host@college.edu' : 'admin@college.edu'}
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
            )}

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="password" required className="input pl-10" placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base mt-2">
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
