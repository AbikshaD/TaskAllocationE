import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const gradeColor = { O: 'badge-green', 'A+': 'badge-blue', A: 'badge-blue', 'B+': 'badge-purple', B: 'badge-purple', C: 'badge-yellow', F: 'badge-red' };

export default function StudentMarks() {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState('all');

  useEffect(() => {
    api.get('/marks/my').then(r => setMarks(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  const years = [...new Set(marks.map(m => m.year))].sort();
  const filtered = activeYear === 'all' ? marks : marks.filter(m => m.year === activeYear);

  const chartData = years.map(s => {
    const yearMarks = marks.filter(m => m.year === s);
    const avg = yearMarks.reduce((a, m) => a + (m.totalMarks || 0), 0) / (yearMarks.length || 1);
    return { year: s, avg: Math.round(avg), count: yearMarks.length };
  });

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="mb-8"><h1 className="text-2xl font-bold text-white">My Marks</h1><p className="text-slate-400 mt-1">{marks.length} subjects across {years.length} years</p></div>

      {chartData.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-base font-semibold text-white mb-4">Performance Overview</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={[0, 150]} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
              <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Year Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setActiveYear('all')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeYear === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>All</button>
        {years.map(s => (
          <button key={s} onClick={() => setActiveYear(s)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeYear === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16"><p className="text-slate-400">No marks available</p></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Subject</th><th>Code</th><th>Year</th><th>Type</th><th>Internal</th><th>External</th><th>Total</th><th>Grade</th><th>Academic Year</th></tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m._id}>
                  <td className="font-medium text-slate-200">{m.subject}</td>
                  <td className="font-mono text-xs text-slate-500">{m.subjectCode || '-'}</td>
                  <td><span className="badge-blue">{m.year}</span></td>
                  <td><span className="badge-purple capitalize">{m.examType}</span></td>
                  <td className="text-slate-300">{m.internalMarks}</td>
                  <td className="text-slate-300">{m.externalMarks}</td>
                  <td className="font-bold text-white text-lg">{m.totalMarks}</td>
                  <td><span className={gradeColor[m.grade] || 'badge-yellow'}>{m.grade}</span></td>
                  <td className="text-slate-500 text-xs">{m.academicYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
