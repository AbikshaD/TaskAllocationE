import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, X, Trash2, Edit2, BookOpen } from 'lucide-react';

function MarksModal({ mark, students, onClose, onSave }) {
  const [form, setForm] = useState(mark || { student: '', subject: '', subjectCode: '', semester: 1, internalMarks: 0, externalMarks: 0, examType: 'internal', academicYear: '2024-25' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (mark) {
        res = await api.put(`/marks/${mark._id}`, form);
        toast.success('Marks updated');
      } else {
        res = await api.post('/marks', form);
        toast.success('Marks entered');
      }
      onSave(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{mark ? 'Edit Marks' : 'Enter Marks'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Student</label>
            <select className="input" required value={form.student} onChange={e => setForm({ ...form, student: e.target.value })}>
              <option value="">Select student</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Subject Name</label>
              <input className="input" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Data Structures" />
            </div>
            <div>
              <label className="label">Subject Code</label>
              <input className="input" value={form.subjectCode} onChange={e => setForm({ ...form, subjectCode: e.target.value })} placeholder="CS301" />
            </div>
            <div>
              <label className="label">Semester</label>
              <select className="input" value={form.semester} onChange={e => setForm({ ...form, semester: Number(e.target.value) })}>
                {[1,2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Exam Type</label>
              <select className="input" value={form.examType} onChange={e => setForm({ ...form, examType: e.target.value })}>
                <option value="internal">Internal</option>
                <option value="external">External</option>
                <option value="practical">Practical</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
            <div>
              <label className="label">Internal Marks (max 50)</label>
              <input className="input" type="number" min="0" max="50" value={form.internalMarks} onChange={e => setForm({ ...form, internalMarks: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">External Marks (max 100)</label>
              <input className="input" type="number" min="0" max="100" value={form.externalMarks} onChange={e => setForm({ ...form, externalMarks: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <label className="label">Academic Year</label>
              <input className="input" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} placeholder="2024-25" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Save Marks'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const gradeColor = { O: 'badge-green', 'A+': 'badge-blue', A: 'badge-blue', 'B+': 'badge-purple', B: 'badge-purple', C: 'badge-yellow', F: 'badge-red' };

export default function Marks() {
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMark, setEditMark] = useState(null);
  const [filterStudent, setFilterStudent] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [mRes, sRes] = await Promise.all([
          api.get('/marks', { params: filterStudent ? { student: filterStudent } : {} }),
          api.get('/students'),
        ]);
        setMarks(mRes.data);
        setStudents(sRes.data);
      } catch (err) { toast.error('Failed to fetch'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [filterStudent]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this marks entry?')) return;
    try {
      await api.delete(`/marks/${id}`);
      toast.success('Deleted');
      setMarks(marks.filter(m => m._id !== id));
    } catch { toast.error('Failed'); }
  };

  const handleSave = (mark) => {
    if (editMark) {
      setMarks(marks.map(m => m._id === mark._id ? mark : m));
    } else {
      setMarks([mark, ...marks]);
    }
    setShowModal(false);
    setEditMark(null);
  };

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Marks & Grades</h1>
          <p className="text-slate-400 mt-1">{marks.length} entries</p>
        </div>
        <button onClick={() => { setEditMark(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Enter Marks
        </button>
      </div>

      <div className="mb-6">
        <select className="input max-w-xs" value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
          <option value="">All Students</option>
          {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Subject</th>
              <th>Code</th>
              <th>Semester</th>
              <th>Internal</th>
              <th>External</th>
              <th>Total</th>
              <th>Grade</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-10 text-slate-500">Loading...</td></tr>
            ) : marks.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-10 text-slate-500">No marks entries yet</td></tr>
            ) : marks.map(m => (
              <tr key={m._id}>
                <td>
                  <p className="text-sm font-medium text-slate-200">{m.student?.name}</p>
                  <p className="text-xs text-slate-500">{m.student?.studentId}</p>
                </td>
                <td className="text-slate-300">{m.subject}</td>
                <td className="text-slate-400 font-mono text-xs">{m.subjectCode}</td>
                <td><span className="badge-blue">Sem {m.semester}</span></td>
                <td className="text-slate-300">{m.internalMarks}</td>
                <td className="text-slate-300">{m.externalMarks}</td>
                <td className="font-semibold text-white">{m.totalMarks}</td>
                <td><span className={gradeColor[m.grade] || 'badge-yellow'}>{m.grade}</span></td>
                <td><span className="badge-purple capitalize">{m.examType}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditMark(m); setShowModal(true); }}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(m._id)}
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
        <MarksModal mark={editMark} students={students}
          onClose={() => { setShowModal(false); setEditMark(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
