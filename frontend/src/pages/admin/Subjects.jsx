import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, BookOpen } from 'lucide-react';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];

function SubjectModal({ subject, onClose, onSave }) {
  const [form, setForm] = useState(subject || { name: '', code: '', department: '', year: 'First Year' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (subject) {
        res = await api.put(`/subjects/${subject._id}`, form);
        toast.success('Subject updated');
      } else {
        res = await api.post('/subjects', form);
        toast.success('Subject created');
      }
      onSave(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{subject ? 'Edit Subject' : 'Add New Subject'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Subject Name</label>
            <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Data Structures" />
          </div>
          <div>
            <label className="label">Subject Code</label>
            <input className="input" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS301" />
          </div>
          <div>
            <label className="label">Department</label>
            <select className="input" required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
              <option value="">Select Department</option>
              {[...new Set(DEPARTMENTS)].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select className="input" required value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
              {['First Year', 'Second Year', 'Third Year', 'Final Year'].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : subject ? 'Update' : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editSubject, setEditSubject] = useState(null);

  const fetchSubjects = async () => {
    try {
      const params = { search };
      if (departmentFilter) params.department = departmentFilter;
      if (yearFilter) params.year = yearFilter;
      const res = await api.get('/subjects', { params });
      setSubjects(res.data);
    } catch (err) {
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, [search, departmentFilter, yearFilter]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      toast.success('Subject deleted');
      setSubjects(subjects.filter(s => s._id !== id));
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleSave = (subject) => {
    if (editSubject) {
      setSubjects(subjects.map(s => s._id === subject._id ? subject : s));
    } else {
      setSubjects([subject, ...subjects]);
    }
    setShowModal(false);
    setEditSubject(null);
  };

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Subjects</h1>
          <p className="text-slate-400 mt-1">Manage subjects for different departments and years</p>
        </div>
        <button onClick={() => { setEditSubject(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Subject
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-10 w-full" placeholder="Search by name or code..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-48" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
          <option value="">All Departments</option>
          {[...new Set(DEPARTMENTS)].map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="input w-48" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          <option value="">All Years</option>
          {['First Year', 'Second Year', 'Third Year', 'Final Year'].map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Subject Name</th>
              <th>Department</th>
              <th>Year</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-500">Loading...</td></tr>
            ) : subjects.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-500">No subjects found</td></tr>
            ) : subjects.map(s => (
              <tr key={s._id}>
                <td><span className="font-mono text-blue-400 text-xs">{s.code}</span></td>
                <td className="font-medium text-slate-200">{s.name}</td>
                <td className="text-slate-400 text-xs">{s.department}</td>
                <td><span className="badge-blue">{s.year}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditSubject(s); setShowModal(true); }}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(s._id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <SubjectModal
          subject={editSubject}
          onClose={() => { setShowModal(false); setEditSubject(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
