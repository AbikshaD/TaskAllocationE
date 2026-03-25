// MyPresentation.jsx
import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Upload, X, Monitor, CheckCircle, Clock, AlertCircle } from 'lucide-react';

function SubmitPPTModal({ item, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('PPT file is required');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/tasks/presentations/${item._id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Presentation submitted!');
      onSuccess(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Submit Presentation</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="p-6">
          <div className="bg-slate-800/50 rounded-xl p-4 mb-5">
            <p className="font-medium text-white">{item.title}</p>
            <p className="text-xs text-slate-400 mt-1">{item.subject}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Upload PPT File (required)</label>
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center">
                <input type="file" id="ppt-file" className="hidden"
                  accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={e => setFile(e.target.files[0])} />
                <label htmlFor="ppt-file" className="cursor-pointer">
                  <Upload size={24} className="text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">{file ? file.name : 'Upload .ppt or .pptx file'}</p>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading || !file} className="btn-primary flex-1">{loading ? 'Submitting...' : 'Submit PPT'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const statusBadge = { allocated: 'badge-yellow', submitted: 'badge-blue', approved: 'badge-green', rejected: 'badge-red' };

export function MyPresentations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitItem, setSubmitItem] = useState(null);
  const fetchData = async () => { try { const r = await api.get('/tasks/presentations/my'); setItems(r.data); } catch { toast.error('Failed'); } finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="mb-8"><h1 className="text-2xl font-bold text-white">My Presentations</h1><p className="text-slate-400 mt-1">{items.length} presentations allocated</p></div>
      {items.length === 0 ? (
        <div className="card text-center py-16"><Monitor size={48} className="text-slate-600 mx-auto mb-4" /><p className="text-slate-400">No presentations allocated yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item._id} className={`card border ${item.status === 'approved' ? 'border-emerald-500/30' : 'border-slate-800'}`}>
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="font-semibold text-white">{item.title}</h3><p className="text-xs text-slate-400 mt-1">{item.subject}</p></div>
                <span className={statusBadge[item.status]}>{item.status}</span>
              </div>
              {item.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{item.description}</p>}
              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-xs text-slate-500">Due: {new Date(item.dueDate).toLocaleDateString()}</p>
                  {item.status === 'approved' && item.obtainedMarks && <p className="text-xs text-emerald-400 font-medium mt-1">Score: {item.obtainedMarks}/{item.maxMarks}</p>}
                  {item.adminFeedback && <p className="text-xs text-slate-300 mt-1 italic">"{item.adminFeedback}"</p>}
                </div>
                {(item.status === 'allocated' || item.status === 'rejected') && (
                  <button onClick={() => setSubmitItem(item)} className="btn-primary text-xs py-2 px-4">Submit PPT</button>
                )}
                {item.status === 'submitted' && <span className="text-xs text-blue-400">Under review</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {submitItem && <SubmitPPTModal item={submitItem} onClose={() => setSubmitItem(null)} onSuccess={fetchData} />}
    </div>
  );
}

export function MyLabTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/tasks/lab-tasks/my').then(r => setTasks(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="mb-8"><h1 className="text-2xl font-bold text-white">My Lab Tasks</h1><p className="text-slate-400 mt-1">{tasks.length} lab tasks assigned</p></div>
      {tasks.length === 0 ? (
        <div className="card text-center py-16"><p className="text-slate-400">No lab tasks assigned yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(t => (
            <div key={t._id} className={`card border ${t.status === 'approved' ? 'border-emerald-500/30' : 'border-slate-800'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="badge-cyan">Lab {t.labNumber}</span>
                <span className={statusBadge[t.status] || 'badge-yellow'}>{t.status}</span>
              </div>
              <h3 className="font-semibold text-white mb-1">{t.title}</h3>
              <p className="text-xs text-slate-400">{t.subject}</p>
              {t.description && <p className="text-xs text-slate-400 mt-2 line-clamp-2">{t.description}</p>}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <p className="text-xs text-slate-500">Due: {new Date(t.dueDate).toLocaleDateString()}</p>
                {t.status === 'approved' && (
                  <>
                    {t.obtainedMarks && <p className="text-xs text-emerald-400 font-medium mt-1">Score: {t.obtainedMarks}/{t.maxMarks}</p>}
                    {t.adminFeedback && <p className="text-xs text-slate-300 mt-1 italic">"{t.adminFeedback}"</p>}
                    <p className="text-xs text-emerald-400 mt-1">✓ Approved by faculty</p>
                  </>
                )}
                {t.status === 'allocated' && (
                  <p className="text-xs text-amber-400 mt-1">⏳ Complete in lab — faculty will approve</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SKILLS = ['Python', 'Java', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'SQL', 'Machine Learning', 'Data Science', 'C++', 'PHP', 'Django', 'Spring Boot', 'Docker', 'Git'];

export function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChoose, setShowChoose] = useState(false);
  const [chosenSkills, setChosenSkills] = useState([]);
  const [choosing, setChoosing] = useState(false);

  const fetchData = async () => { try { const r = await api.get('/tasks/projects/my'); setProjects(r.data); } catch { toast.error('Failed'); } finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  const toggleSkill = (s) => setChosenSkills(prev => prev.includes(s) ? prev.filter(sk => sk !== s) : [...prev, s]);

  const handleChoose = async () => {
    if (chosenSkills.length === 0) return toast.error('Select at least one skill');
    setChoosing(true);
    try {
      const r = await api.post('/tasks/projects/choose', { chosenSkills });
      toast.success(`Project allocated: ${r.data.project.title}`);
      setShowChoose(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'No matching project'); }
    finally { setChoosing(false); }
  };

  const hasProject = projects.some(p => p.status !== 'available');
  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-white">My Projects</h1><p className="text-slate-400 mt-1">Skill-based project allocation</p></div>
        {!hasProject && <button onClick={() => setShowChoose(true)} className="btn-primary flex items-center gap-2">🎯 Choose Project by Skills</button>}
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-300 font-medium mb-2">No project allocated yet</p>
          <p className="text-slate-500 text-sm mb-6">Choose your skills and we'll match you with the best project</p>
          <button onClick={() => setShowChoose(true)} className="btn-primary mx-auto">Choose Project by Skills</button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map(p => (
            <div key={p._id} className={`card border ${p.status === 'approved' ? 'border-emerald-500/30' : 'border-slate-800'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg">{p.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{p.description}</p>
                </div>
                <span className={statusBadge[p.status] || 'badge-yellow'}>{p.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-1">{p.requiredSkills?.map(s => <span key={s} className="badge-rose text-xs">{s}</span>)}</div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">Your Skills</p>
                  <div className="flex flex-wrap gap-1">{p.studentChosenSkills?.map(s => <span key={s} className="badge-purple text-xs">{s}</span>)}</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <p className="text-xs text-slate-500">Due: {new Date(p.dueDate).toLocaleDateString()}</p>
                {p.status === 'approved' && p.obtainedMarks && <p className="text-sm text-emerald-400 font-semibold">Score: {p.obtainedMarks}/{p.maxMarks}</p>}
                {p.status === 'allocated' && <p className="text-xs text-amber-400">⏳ In progress — faculty will review and approve</p>}
              </div>
              {p.adminFeedback && <p className="text-xs text-slate-300 mt-2 italic bg-slate-800/50 rounded-lg p-3">💬 "{p.adminFeedback}"</p>}
            </div>
          ))}
        </div>
      )}

      {showChoose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Select Your Skills</h2>
              <button onClick={() => setShowChoose(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400">Choose your skills — we'll find the best matching project for you!</p>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map(s => (
                  <button key={s} onClick={() => toggleSkill(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${chosenSkills.includes(s) ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    {s}
                  </button>
                ))}
              </div>
              {chosenSkills.length > 0 && (
                <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3">
                  <p className="text-xs text-violet-400">Selected: {chosenSkills.join(', ')}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowChoose(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleChoose} disabled={choosing || chosenSkills.length === 0} className="btn-primary flex-1">
                  {choosing ? 'Finding match...' : '🎯 Find My Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
