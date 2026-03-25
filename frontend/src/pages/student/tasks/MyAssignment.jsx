import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Upload, X, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

function SubmitModal({ assignment, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('submissionText', text);
      await api.post(`/tasks/assignments/${assignment._id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Assignment submitted!');
      onSuccess();
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Submit Assignment</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="p-6">
          <div className="bg-slate-800/50 rounded-xl p-4 mb-5">
            <p className="font-medium text-white">{assignment.title}</p>
            <p className="text-xs text-slate-400 mt-1">{assignment.subject}</p>
            {assignment.description && <p className="text-xs text-slate-300 mt-2">{assignment.description}</p>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Upload File (optional)</label>
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center">
                <input type="file" id="asgmt-file" className="hidden" onChange={e => setFile(e.target.files[0])} />
                <label htmlFor="asgmt-file" className="cursor-pointer">
                  <Upload size={24} className="text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">{file ? file.name : 'Click to upload (PDF, DOC, etc.)'}</p>
                </label>
              </div>
            </div>
            <div>
              <label className="label">Notes / Comments</label>
              <textarea className="input resize-none" rows={4} value={text} onChange={e => setText(e.target.value)} placeholder="Add any notes about your submission..." />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Submitting...' : 'Submit Assignment'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const statusConfig = {
  allocated: { label: 'Pending', icon: Clock, color: 'text-amber-400', badge: 'badge-yellow' },
  submitted: { label: 'Submitted', icon: FileText, color: 'text-blue-400', badge: 'badge-blue' },
  approved: { label: 'Approved ✓', icon: CheckCircle, color: 'text-emerald-400', badge: 'badge-green' },
  rejected: { label: 'Rejected', icon: AlertCircle, color: 'text-red-400', badge: 'badge-red' },
};

export default function MyAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitAssignment, setSubmitAssignment] = useState(null);

  const fetchData = async () => {
    try { const r = await api.get('/tasks/assignments/my'); setAssignments(r.data); }
    catch { toast.error('Failed to fetch'); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Assignments</h1>
        <p className="text-slate-400 mt-1">{assignments.length} assignments allocated</p>
      </div>

      {assignments.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No assignments allocated yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map(a => {
            const cfg = statusConfig[a.status] || statusConfig.allocated;
            const StatusIcon = cfg.icon;
            const isOverdue = new Date(a.dueDate) < new Date() && a.status === 'allocated';
            return (
              <div key={a._id} className={`card border ${a.status === 'approved' ? 'border-emerald-500/30' : isOverdue ? 'border-red-500/30' : 'border-slate-800'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{a.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{a.subject}</p>
                  </div>
                  <span className={cfg.badge}>{a.status}</span>
                </div>
                {a.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{a.description}</p>}
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <p className="text-xs text-slate-500">Due: {new Date(a.dueDate).toLocaleDateString()}</p>
                    {isOverdue && <p className="text-xs text-red-400 font-medium">⚠ Overdue</p>}
                    {a.status === 'approved' && a.obtainedMarks && (
                      <p className="text-xs text-emerald-400 font-medium mt-1">Score: {a.obtainedMarks}/{a.maxMarks}</p>
                    )}
                    {a.adminFeedback && <p className="text-xs text-slate-300 mt-1 italic">"{a.adminFeedback}"</p>}
                  </div>
                  {a.status === 'allocated' && (
                    <button onClick={() => setSubmitAssignment(a)} className="btn-primary text-xs py-2 px-4">
                      Submit
                    </button>
                  )}
                  {a.status === 'submitted' && <span className="text-xs text-blue-400">Awaiting review</span>}
                  {a.status === 'rejected' && (
                    <button onClick={() => setSubmitAssignment(a)} className="btn-secondary text-xs py-2 px-4">Resubmit</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {submitAssignment && <SubmitModal assignment={submitAssignment} onClose={() => setSubmitAssignment(null)} onSuccess={fetchData} />}
    </div>
  );
}
