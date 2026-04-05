import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { X, UserCheck, Map } from 'lucide-react';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];

export default function AssignMappingModal({ onClose }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    adminId: '',
    department: '',
    fromRoll: '',
    toRoll: ''
  });

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get('/host/admins');
      setAdmins(res.data);
    } catch (err) {
      toast.error('Failed to load faculties (admins)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.adminId || !form.department || !form.fromRoll || !form.toRoll) {
      return toast.error('Please fill all fields');
    }

    setSaving(true);
    try {
      await api.post(`/host/admins/${form.adminId}/mappings`, {
        department: form.department,
        fromRoll: form.fromRoll,
        toRoll: form.toRoll
      });
      toast.success('Mapping securely bounded to Faculty!');
      setForm({ ...form, fromRoll: '', toRoll: '' });
      fetchAdmins(); // Refresh lists
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign mapping');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMapping = async (adminId, mappingId) => {
    try {
      if (!confirm('Remove this mapping bound ruleset?')) return;
      await api.delete(`/host/admins/${adminId}/mappings/${mappingId}`);
      toast.success('Mapping successfully removed!');
      fetchAdmins();
    } catch (err) {
      toast.error('Failed to remove mapping');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-3 text-emerald-400">
            <UserCheck size={24} />
            <h2 className="text-lg font-bold text-white">Manage Faculty Mappings</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-400 mb-4">
            Bind a specific range of Roll Numbers to a Faculty. When this Faculty allocates tasks to this department, it will be strictly limited to these students.
          </p>

          <div>
            <label className="label">Select Faculty (Admin)</label>
            <select className="input" required value={form.adminId} onChange={e => setForm({ ...form, adminId: e.target.value })}>
              <option value="">-- Choose Faculty --</option>
              {admins.map(a => (
                <option key={a._id} value={a._id}>{a.name} ({a.department})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Target Department</label>
            <select className="input" required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
              <option value="">-- Limit mapping to this department --</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">From Roll Number</label>
              <input className="input border-emerald-500/30 focus:border-emerald-400 focus:bg-emerald-400/5 placeholder-slate-600 font-mono" 
                required value={form.fromRoll} onChange={e => setForm({ ...form, fromRoll: e.target.value })} 
                placeholder="e.g. CS1001" />
            </div>
            <div>
              <label className="label">To Roll Number</label>
              <input className="input border-emerald-500/30 focus:border-emerald-400 focus:bg-emerald-400/5 placeholder-slate-600 font-mono" 
                required value={form.toRoll} onChange={e => setForm({ ...form, toRoll: e.target.value })} 
                placeholder="e.g. CS1050" />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button type="submit" disabled={loading || saving} className="btn-primary bg-emerald-500 hover:bg-emerald-600 text-white flex-1 border-0">
              {saving ? 'Binding Mapping...' : 'Confirm Secure Binding'}
            </button>
          </div>
        </form>

        <div className="px-6 pb-6 border-t border-slate-800 pt-6 bg-slate-900/50">
          <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2"><Map size={18} className="text-emerald-400" /> Active Mappings</h3>
          
          {admins.filter(a => a.mappedRanges && a.mappedRanges.length > 0).length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">No active mappings configured.</div>
          ) : (
            <div className="space-y-4">
              {admins.filter(a => a.mappedRanges && a.mappedRanges.length > 0).map(admin => (
                <div key={admin._id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                  <p className="font-semibold text-white text-sm flex items-center justify-between">
                    {admin.name} <span className="text-xs text-slate-500 font-normal bg-slate-900 px-2 py-1 rounded">Faculty</span>
                  </p>
                  <div className="space-y-2 mt-3 text-sm">
                    {admin.mappedRanges.map(mapping => (
                      <div key={mapping._id} className="flex items-center justify-between bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-inner">
                        <span className="text-slate-300">{mapping.department}: <span className="text-emerald-400 font-mono bg-emerald-400/10 px-1 py-0.5 rounded">{mapping.fromRoll} ➔ {mapping.toRoll}</span></span>
                        <button onClick={() => handleRemoveMapping(admin._id, mapping._id)} className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-md transition-colors" title="Delete mapping constraint">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
