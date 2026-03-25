import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Plus, Search, Edit2, Trash2, RefreshCw, ShieldCheck, X, Eye, EyeOff, Crown
} from 'lucide-react';

function AdminModal({ admin, onClose, onSaved }) {
  const isEdit = !!admin?._id;
  const [form, setForm] = useState({
    name: admin?.name || '', email: admin?.email || '',
    password: '', department: admin?.department || '', phone: admin?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, department: form.department, phone: form.phone };
      if (!isEdit) payload.password = form.password;
      if (isEdit) {
        await api.put(`/host/admins/${admin._id}`, payload);
        toast.success('Admin updated');
      } else {
        await api.post('/host/admins', { ...payload, password: form.password });
        toast.success('Admin created successfully');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-400" />
            {isEdit ? 'Edit Admin' : 'Create New Admin'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" required placeholder="Dr. Rajesh Kumar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input className="input" type="email" required placeholder="admin@college.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          {!isEdit && (
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPass ? 'text' : 'password'} required minLength={6}
                  placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="label">Department (optional)</label>
            <input className="input" placeholder="Computer Science / All Departments" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : isEdit ? 'Save Changes' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ admin, onClose }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/host/admins/${admin._id}/reset-password`, { newPassword: password });
      toast.success('Password reset successfully');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <RefreshCw size={18} className="text-amber-400" /> Reset Password
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-sm text-slate-400 mb-4">Reset password for <span className="text-white font-medium">{admin.name}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input className="input pr-10" type={showPass ? 'text' : 'password'} required minLength={6}
                placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Reset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { type: 'create'|'edit'|'reset', admin? }

  const fetchAdmins = () => {
    setLoading(true);
    api.get('/host/admins').then(r => setAdmins(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleToggleActive = async (admin) => {
    try {
      await api.put(`/host/admins/${admin._id}`, { isActive: !admin.isActive });
      toast.success(admin.isActive ? 'Admin deactivated' : 'Admin activated');
      fetchAdmins();
    } catch { toast.error('Failed to update'); }
  };

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    (a.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Crown size={20} className="text-amber-400" /> Manage Admins
          </h1>
          <p className="text-slate-400 mt-1">Create and manage administrator accounts</p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Admin
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-10 w-full" placeholder="Search by name, email, department..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck size={48} className="text-slate-700 mb-4" />
          <p className="text-slate-400 text-lg font-medium mb-1">No admins found</p>
          <p className="text-slate-600 text-sm mb-4">Create the first admin to get started</p>
          <button onClick={() => setModal({ type: 'create' })} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Create Admin
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((admin) => (
            <div key={admin._id} className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                {admin.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-white truncate">{admin.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${admin.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-slate-400 truncate">{admin.email}</p>
                <p className="text-xs text-slate-600">{admin.department || 'All Departments'}{admin.phone ? ` · ${admin.phone}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setModal({ type: 'edit', admin })} title="Edit"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => setModal({ type: 'reset', admin })} title="Reset Password"
                  className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors">
                  <RefreshCw size={15} />
                </button>
                <button onClick={() => handleToggleActive(admin)} title={admin.isActive ? 'Deactivate' : 'Activate'}
                  className={`p-2 rounded-lg transition-colors ${admin.isActive ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'create' && (
        <AdminModal onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAdmins(); }} />
      )}
      {modal?.type === 'edit' && (
        <AdminModal admin={modal.admin} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAdmins(); }} />
      )}
      {modal?.type === 'reset' && (
        <ResetPasswordModal admin={modal.admin} onClose={() => { setModal(null); fetchAdmins(); }} />
      )}
    </div>
  );
}
