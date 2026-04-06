import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import AllocateModal from '../../../components/tasks/AllocateModal';
import { Shuffle, Eye, CheckCircle, XCircle, X, Download, Edit, Trash2, AlertCircle } from 'lucide-react';

const statusBadge = { allocated:'badge-yellow', submitted:'badge-blue', approved:'badge-green', rejected:'badge-red' };

function ReviewModal({ item, onClose, onApprove }) {
  const [feedback, setFeedback] = useState(item.adminFeedback || '');
  const [marks, setMarks] = useState(item.obtainedMarks || '');
  const [loading, setLoading] = useState(false);
  const fileUrl = item.submittedFile ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/${item.submittedFile}` : null;

  const handle = async (status) => {
    if (!marks && marks !== 0) { toast.error('Enter marks'); return; }
    setLoading(true);
    try { await onApprove(item._id, status, feedback, marks); onClose(); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Review Presentation</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="font-semibold text-white text-sm mb-1">{item.title}</p>
            <p className="text-xs text-slate-400">{item.subject} · {item.department}</p>
            <p className="text-xs text-slate-500 mt-2">Student: <span className="text-slate-300">{item.allocatedTo?.name}</span> ({item.allocatedTo?.studentId})</p>
          </div>
          {fileUrl && (
            <div className="flex gap-2">
              <a href={fileUrl} target="_blank" rel="noreferrer" className="flex-1 text-xs text-blue-400 bg-blue-400/10 border border-blue-500/30 px-3 py-2 rounded-lg flex items-center gap-1 justify-center"><Eye size={13}/> Open File</a>
              <a href={fileUrl} download className="flex-1 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-500/30 px-3 py-2 rounded-lg flex items-center gap-1 justify-center"><Download size={13}/> Download</a>
            </div>
          )}
          <div>
            <label className="label">Feedback</label>
            <textarea className="input resize-none" rows={3} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Provide feedback..." />
          </div>
          <div>
            <label className="label">Marks (out of {item.maxMarks})</label>
            <input className="input" type="number" min="0" max={item.maxMarks} value={marks} onChange={e => setMarks(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => handle('rejected')} disabled={loading} className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"><XCircle size={15}/> Reject</button>
            <button onClick={() => handle('approved')} disabled={loading} className="flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"><CheckCircle size={15}/> Approve</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPresentations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllocate, setShowAllocate] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', department: '', year: '', search: '' });
  const [deleting, setDeleting] = useState(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.year) params.year = filters.year;
      if (filters.status !== 'all') params.status = filters.status;
      const res = await api.get('/tasks/presentations', { params });
      setItems(res.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filters.status, filters.department, filters.year]);

  const handleApprove = async (id, status, feedback, marks) => {
    const res = await api.put(`/tasks/presentations/${id}/approve`, { status, adminFeedback: feedback, obtainedMarks: marks });
    setItems(a => a.map(x => x._id === id ? res.data : x));
    toast.success(`Presentation ${status}`);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/tasks/presentations/${id}`);
      setItems(a => a.filter(x => x._id !== id));
      toast.success('Presentation deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.delete('/tasks/presentations');
      setItems([]);
      setShowDeleteAll(false);
      toast.success('All presentations deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const counts = { all: items.length, allocated: 0, submitted: 0, approved: 0, rejected: 0 };
  items.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });

  const filtered = items.filter(a =>
    !filters.search || a.title.toLowerCase().includes(filters.search.toLowerCase()) ||
    a.allocatedTo?.name?.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Presentations</h1>
          <p className="text-slate-400 mt-1">Allocate paper presentation topics department-wise</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAllocate(true)} className="btn-primary flex items-center gap-2"><Shuffle size={16}/> Allocate</button>
          {items.length > 0 && (
            <button onClick={() => setShowDeleteAll(true)} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
              <Trash2 size={16} /> Delete All
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[['Total',counts.all,'text-white'],['Pending',counts.allocated,'text-amber-400'],['Submitted',counts.submitted,'text-blue-400'],['Approved',counts.approved,'text-emerald-400']].map(([l,v,c]) => (
          <div key={l} className="card text-center"><p className={`text-2xl font-bold ${c}`}>{v}</p><p className="text-xs text-slate-500 mt-1">{l}</p></div>
        ))}
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input className="input flex-1 min-w-48" placeholder="Search..." value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))} />
        <select className="input w-48" value={filters.department} onChange={e => setFilters(f => ({...f, department: e.target.value}))}>
          <option value="">All Departments</option>
          {['Computer Science','Information Technology','Electronics & Communication','Electrical Engineering','Mechanical Engineering','Civil Engineering'].map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="input w-48" value={filters.year} onChange={e => setFilters(f => ({...f, year: e.target.value}))}>
          <option value="">All Years</option>
          {['First Year', 'Second Year', 'Third Year', 'Final Year'].map(y => <option key={y}>{y}</option>)}
        </select>
        <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl">
          {['all','allocated','submitted','approved','rejected'].map(s => (
            <button key={s} onClick={() => setFilters(f => ({...f, status: s}))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filters.status === s ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Topic</th><th>Subject</th><th>Department</th><th>Student</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-10 text-slate-500">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-slate-500">No presentations found</td></tr>
              : filtered.map(a => (
                <tr key={a._id}>
                  <td className="font-medium text-slate-200 max-w-[160px] truncate">{a.title}</td>
                  <td className="text-xs text-slate-400">{a.subject || '—'}</td>
                  <td className="text-xs text-slate-400">{a.department || '—'}</td>
                  <td><p className="text-sm text-slate-200">{a.allocatedTo?.name}</p><p className="text-xs text-slate-500">{a.allocatedTo?.studentId}</p></td>
                  <td className="text-xs text-slate-400">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}</td>
                  <td><span className={statusBadge[a.status]}>{a.status}</span></td>
                  <td className="flex items-center gap-2">
                    {a.status === 'submitted' && <button onClick={() => setReviewing(a)} className="flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded"><Eye size={12}/> Review</button>}
                    <button 
                      onClick={() => handleDelete(a._id)} 
                      disabled={deleting === a._id}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-400/10 px-2 py-1 rounded disabled:opacity-50">
                      <Trash2 size={12} /> Delete
                    </button>
                    {a.status !== 'submitted' && (
                      <>
                        {a.status === 'approved' && <span className="text-xs text-emerald-400">✓</span>}
                        {a.status === 'rejected' && <span className="text-xs text-red-400">✗</span>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showAllocate && <AllocateModal type="presentation" onClose={() => setShowAllocate(false)} onSuccess={fetch} />}
      {reviewing && <ReviewModal item={reviewing} onClose={() => setReviewing(null)} onApprove={handleApprove} />}
      
      {showDeleteAll && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xhr w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mx-auto mb-4">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-2">Delete All Presentations</h3>
              <p className="text-sm text-slate-400 text-center mb-6">
                This will permanently delete all {items.length} presentation records. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteAll(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-medium">
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAll}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium">
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
