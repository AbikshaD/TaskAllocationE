import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Upload, Search, Edit2, Trash2, X, Download, Eye } from 'lucide-react';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];

function StudentModal({ student, onClose, onSave }) {
  const [form, setForm] = useState(student || { studentId: '', name: '', email: '', department: '', year: 'First Year', batch: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.department || !form.batch) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    try {
      console.log('📝 Creating student with:', form);
      let res;
      if (student) {
        res = await api.put(`/students/${student._id}`, form);
        toast.success('Student updated');
      } else {
        res = await api.post('/students', form);
        console.log('✅ Student created:', res.data);
        toast.success(`Student created! ID: ${res.data.credentials.studentId}, Password: ${res.data.credentials.defaultPassword}`);
      }
      onSave(res.data.student || res.data);
    } catch (err) {
      console.error('❌ Error:', err);
      toast.error(err.response?.data?.message || err.message || 'Error saving student');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900">
          <h2 className="text-lg font-semibold text-white">{student ? 'Edit Student' : 'Add New Student'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Student full name" />
            </div>
            <div className="col-span-2">
              <label className="label">Roll Number</label>
              <input className="input" required value={form.rollNumber || form.studentId} onChange={e => setForm({ ...form, rollNumber: e.target.value, studentId: e.target.value })} placeholder="e.g. CS1001" />
            </div>
            <div className="col-span-2">
              <label className="label">Email</label>
              <input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="student@email.com" />
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input" required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                <option value="">Select dept</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select className="input" required value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                {['First Year', 'Second Year', 'Third Year', 'Final Year'].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Batch</label>
              <input className="input" required value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} placeholder="2021-2025" />
            </div>
          </div>


          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : student ? 'Update' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkUploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return toast.error('Select a file first');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data.results);
      toast.success(res.data.message);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Bulk Upload Students</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium mb-2">Required columns:</p>
            <p className="text-xs text-slate-500 font-mono">rollNumber, name, email, department, year, batch</p>
          </div>

          <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center">
            <input type="file" accept=".xlsx,.xls,.csv" id="bulk-file"
              className="hidden" onChange={e => setFile(e.target.files[0])} />
            <label htmlFor="bulk-file" className="cursor-pointer">
              <Upload size={32} className="text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400">{file ? file.name : 'Click to upload Excel or CSV'}</p>
            </label>
          </div>

          {result && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-emerald-400">✅ {result.success.length} students created</p>
              {result.failed.length > 0 && <p className="text-xs text-red-400">❌ {result.failed.length} failed</p>}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleUpload} disabled={loading || !file} className="btn-primary flex-1">
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  const fetchStudents = async () => {
    try {
      const params = { search };
      if (yearFilter) params.year = yearFilter;
      if (departmentFilter) params.department = departmentFilter;
      const res = await api.get('/students', { params });
      setStudents(res.data);
    } catch (err) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [search, yearFilter, departmentFilter]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted');
      setStudents(students.filter(s => s._id !== id));
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('WARNING: Are you absolutely sure you want to permanently delete ALL students? This action cannot be undone!')) return;
    
    // Safety check with double confirmation
    if (prompt('Type "DELETE ALL" to confirm wiping all student data:') !== 'DELETE ALL') {
      return toast.error('Action cancelled. Did not type exactly "DELETE ALL"');
    }

    try {
      await api.delete('/students/all');
      toast.success('All students permanently deleted');
      setStudents([]);
    } catch (err) {
      toast.error('Failed to delete all students');
    }
  };

  const handleSave = (student) => {
    if (editStudent) {
      setStudents(students.map(s => s._id === student._id ? student : s));
    } else {
      setStudents([student, ...students]);
    }
    setShowModal(false);
    setEditStudent(null);
  };

  const downloadSampleCSV = async () => {
    try {
      const response = await api.get('/students/sample/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample-students.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Sample CSV downloaded');
    } catch (err) {
      toast.error('Failed to download sample');
    }
  };

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-slate-400 mt-1">{students.length} students enrolled</p>
        </div>
        <div className="flex gap-3">
          {students.length > 0 && (
            <button onClick={handleDeleteAll} className="btn-secondary flex items-center gap-2 text-red-500 border-red-500/20 hover:border-red-500 hover:bg-red-500/10 transition-colors">
              <Trash2 size={16} /> Delete All
            </button>
          )}
          <button onClick={downloadSampleCSV} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> Download Sample
          </button>
          <button onClick={() => setShowBulk(true)} className="btn-secondary flex items-center gap-2">
            <Upload size={16} /> Bulk Upload
          </button>
          <button onClick={() => { setEditStudent(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-10 w-full" placeholder="Search by name, ID, email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-48" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="input w-48" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          <option value="">All Years</option>
          {['First Year', 'Second Year', 'Third Year', 'Final Year'].map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Name</th>
              <th>Department</th>
              <th>Year</th>
              <th>Batch</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-500">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-500">No students found</td></tr>
            ) : students.map(s => (
              <tr key={s._id}>
                <td><span className="font-mono text-blue-400 text-xs">{s.studentId}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="text-slate-400 text-xs">{s.department}</td>
                <td><span className="badge-blue">{s.year}</span></td>
                <td className="text-slate-400 text-xs">{s.batch}</td>

                <td>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditStudent(s); setShowModal(true); }}
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
        <StudentModal
          student={editStudent}
          onClose={() => { setShowModal(false); setEditStudent(null); }}
          onSave={handleSave}
        />
      )}
      {showBulk && <BulkUploadModal onClose={() => setShowBulk(false)} onSuccess={fetchStudents} />}
    </div>
  );
}
