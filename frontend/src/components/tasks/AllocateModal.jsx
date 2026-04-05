import { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { X, Upload, Plus, Trash2, Download, FileSpreadsheet, Info } from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Chemical Engineering', 'Biotechnology',
];

/**
 * Generic allocation modal for Assignment / Presentation / Project / Lab Task
 *
 * Props:
 *   type: 'assignment' | 'presentation' | 'project' | 'lab'
 *   onClose: fn
 *   onSuccess: fn
 */
export default function AllocateModal({ type, onClose, onSuccess }) {
  const isLab = type === 'lab';

  const getExpectedBatch = (studyingYear) => {
    const d = new Date();
    let startYear = d.getFullYear();
    if (d.getMonth() < 5) startYear--; 
    let offset = 0;
    if (studyingYear === '2') offset = 1;
    else if (studyingYear === '3') offset = 2;
    else if (studyingYear === '4') offset = 3;
    const joinYear = startYear - offset;
    return `${joinYear}-${joinYear + 4}`;
  };

  const [form, setForm] = useState({
    subject: '',
    dueDate: '',
    department: '',
    batch: getExpectedBatch('1'),
    year: '1',
    studentsPerTopic: '',
    maxMarks: '100',
  });

  // Topic entry: manual list OR file upload
  const [inputMode, setInputMode] = useState('manual'); // 'manual' | 'file'
  const [topics, setTopics] = useState([{ title: '', description: '' }]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const fileRef = useRef();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/subjects');
        setSubjects(res.data);
      } catch (err) {
        console.error('Failed to fetch subjects');
      }
    };
    fetchSubjects();
  }, []);

  const endpoint = {
    assignment: '/tasks/assignments/allocate',
    presentation: '/tasks/presentations/allocate',
    project: '/tasks/projects/allocate',
    lab: '/tasks/lab-tasks/allocate',
  }[type];

  const label = {
    assignment: 'Assignments', presentation: 'Presentations',
    project: 'Projects', lab: 'Lab Tasks',
  }[type];

  const topicLabel = isLab ? 'Lab Tasks' : 'Topics';

  const addTopic = () => setTopics(t => [...t, { title: '', description: '' }]);
  const removeTopic = (i) => setTopics(t => t.filter((_, idx) => idx !== i));
  const updateTopic = (i, field, val) =>
    setTopics(t => t.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/tasks/template/topics', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'topics-template.xlsx'; a.click();
    } catch { toast.error('Failed to download template'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.department) { toast.error('Please select a department'); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      // append fields
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });

      if (inputMode === 'file' && file) {
        fd.append('topicsFile', file);
      } else {
        // send as JSON string for manual
        const key = isLab ? 'tasks' : 'topics';
        fd.append(key, JSON.stringify(topics.filter(t => t.title.trim())));
      }

      const res = await api.post(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success(res.data.message);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Allocation failed');
    } finally { setLoading(false); }
  };

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Allocated Successfully!</h3>
          <div className="bg-slate-800/60 rounded-xl p-4 mb-6 text-left space-y-2">
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Total records created:</span>{' '}
              <span className="font-semibold text-white">{result.count}</span>
            </p>
            {result.topics && (
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">{topicLabel}:</span>{' '}
                <span className="font-semibold text-white">{result.topics}</span>
              </p>
            )}
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Students in {form.department}:</span>{' '}
              <span className="font-semibold text-white">{result.students}</span>
            </p>
            {result.perTopic && (
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Students per topic:</span>{' '}
                <span className="font-semibold text-white">{result.perTopic}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="btn-primary w-full">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <h2 className="text-lg font-semibold text-white">Allocate {label}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Core fields */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Basic Info</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Department *</label>
                <select className="input" required value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value, subject: '' })}>
                  <option value="">Select department...</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Year *</label>
                <select className="input" required value={form.year}
                  onChange={e => {
                    setForm({ ...form, year: e.target.value, subject: '', batch: getExpectedBatch(e.target.value) });
                  }}>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">Final Year</option>
                </select>
              </div>
              {type !== 'project' && (
                <div>
                  <label className="label">Subject *</label>
                  <select className="input" required value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}>
                    <option value="">Select subject...</option>
                    {subjects
                      .filter(s => s.department === form.department && s.year === form.year)
                      .map(s => <option key={s._id} value={s.name}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Due Date *</label>
                <input className="input" type="date" required value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>

              <div>
                <label className="label">Batch / Academic Year *</label>
                <input className="input" placeholder="e.g. 2022-2026" required value={form.batch || getExpectedBatch(form.year)}
                  onChange={e => setForm({ ...form, batch: e.target.value })} />
              </div>
              <div>
                <label className="label">Max Marks</label>
                <input className="input" type="number" min="1" value={form.maxMarks}
                  onChange={e => setForm({ ...form, maxMarks: e.target.value })} />
              </div>
              {!isLab && (
                <div>
                  <label className="label">Students per Topic</label>
                  <input className="input" type="number" min="1" placeholder="Auto (even split)"
                    value={form.studentsPerTopic}
                    onChange={e => setForm({ ...form, studentsPerTopic: e.target.value })} />
                </div>
              )}
            </div>
          </div>

          {/* Allocation info box */}
          <div className={`rounded-xl p-3 border text-xs ${isLab ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-blue-500/10 border-blue-500/30 text-blue-300'}`}>
            {isLab
              ? '🧪 Lab tasks will be allocated to EVERY student in the selected department. Each student gets all lab tasks.'
              : `📋 Each topic will be assigned to ${form.studentsPerTopic || 'N'} students (auto-calculated if left blank). Students are shuffled randomly within the department.`}
          </div>

          {/* Section 2: Topics input */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{topicLabel}</p>
              <div className="flex gap-2">
                <button type="button" onClick={handleDownloadTemplate}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg">
                  <Download size={12} /> Template
                </button>
                <button type="button"
                  onClick={() => setInputMode(inputMode === 'manual' ? 'file' : 'manual')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg">
                  {inputMode === 'manual' ? <><FileSpreadsheet size={12} /> Upload Excel</> : <><Plus size={12} /> Manual</>}
                </button>
              </div>
            </div>

            {inputMode === 'file' ? (
              <div>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors">
                  <FileSpreadsheet size={32} className="text-slate-600 mx-auto mb-2" />
                  {file ? (
                    <p className="text-sm text-emerald-400 font-medium">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-slate-400">Click to upload Excel or CSV</p>
                      <p className="text-xs text-slate-600 mt-1">Columns: title, description</p>
                    </>
                  )}
                  <input ref={fileRef} type="file" className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={e => setFile(e.target.files[0])} />
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <Info size={11} /> Download the template above to see the required format.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topics.map((topic, i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-medium">{isLab ? 'Lab Task' : 'Topic'} {i + 1}</span>
                      {topics.length > 1 && (
                        <button type="button" onClick={() => removeTopic(i)} className="text-red-400 hover:text-red-300">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <input className="input mb-2" required value={topic.title}
                      onChange={e => updateTopic(i, 'title', e.target.value)}
                      placeholder={isLab ? `Lab ${i + 1}: Experiment title` : `Topic ${i + 1} title`} />
                    <textarea className="input resize-none" rows={2} value={topic.description}
                      onChange={e => updateTopic(i, 'description', e.target.value)}
                      placeholder="Description / objective (optional)" />
                  </div>
                ))}
                <button type="button" onClick={addTopic}
                  className="w-full border-2 border-dashed border-slate-700 rounded-xl py-3 text-sm text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors flex items-center justify-center gap-2">
                  <Plus size={15} /> Add {isLab ? 'Lab Task' : 'Topic'}
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Allocating...</>
                : <><Upload size={15} /> Allocate {label}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
