import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { X, CheckCircle, Circle } from 'lucide-react';

export default function ReviewProgressModal({ project, onClose, onSuccess }) {
  const hasReviewProgress = !!project.reviewProgress;
  const [mode, setMode] = useState(hasReviewProgress ? 'view' : 'create');
  const [startDate, setStartDate] = useState('');
  const [totalDuration, setTotalDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [phaseFeedback, setPhaseFeedback] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!startDate || !totalDuration) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/tasks/projects/${project._id}/review-progress`, {
        startDate: new Date(startDate),
        totalDuration: Number(totalDuration),
      });
      toast.success('Review progress created');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create review progress');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  };

  const handleMarkComplete = async (phaseNumber, feedback) => {
    setLoading(true);
    try {
      await api.put(`/tasks/projects/${project._id}/review-progress/${phaseNumber}`, {
        status: 'completed',
        feedback,
      });
      toast.success(`Phase ${phaseNumber} marked as completed`);
      onSuccess();
      setEditingPhase(null);
      setPhaseFeedback('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update phase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Review Progress</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Project Info */}
          <div>
            <p className="text-sm text-slate-400">Project:</p>
            <p className="text-white font-semibold">{project.title}</p>
            <p className="text-xs text-slate-400 mt-1">Student: {project.allocatedTo?.name}</p>
          </div>

          {/* Mode Tabs */}
          {hasReviewProgress && (
            <div className="flex gap-2">
              <button
                onClick={() => { setMode('view'); setStartDate(''); setTotalDuration(''); }}
                className={`flex-1 py-2 rounded font-medium text-sm ${mode === 'view' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                View
              </button>
              <button
                onClick={() => { setMode('create'); setStartDate(''); setTotalDuration(''); }}
                className={`flex-1 py-2 rounded font-medium text-sm ${mode === 'create' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                Create New
              </button>
            </div>
          )}

          {/* CREATE FORM */}
          {mode === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Total Duration (days)</label>
                <input
                  type="number"
                  min="1"
                  value={totalDuration}
                  onChange={(e) => setTotalDuration(e.target.value)}
                  placeholder="30"
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {startDate && totalDuration && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-xs text-green-300 font-semibold mb-2">✓ Preview - 3 Phases:</p>
                  {[1, 2, 3].map((p) => {
                    const interval = Math.ceil(Number(totalDuration) / 3);
                    const day = p === 1 ? interval : p === 2 ? interval * 2 : Number(totalDuration);
                    const date = new Date(new Date(startDate).getTime() + day * 24 * 60 * 60 * 1000);
                    return (
                      <div key={p} className="text-xs text-slate-200 flex justify-between">
                        <span>Phase {p}: Day {day}</span>
                        <span className="text-slate-400">{formatDate(date)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW MODE */}
          {mode === 'view' && project.reviewProgress && (
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Duration</div>
                <div className="text-white font-semibold">{project.reviewProgress.totalDuration} days</div>
      </div>

              <div className="space-y-2">
                {project.reviewProgress.phases.map((phase) => (
                  <div key={phase.phaseNumber} className={`rounded-lg p-3 border ${phase.status === 'completed' ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">Phase {phase.phaseNumber}</span>
                      <span className={`text-xs px-2 py-1 rounded ${phase.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
                        {phase.status === 'completed' ? '✓ Completed' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">Due: {formatDate(phase.dueDate)}</p>

                    {phase.feedback && <p className="text-xs text-slate-300 mb-2">{phase.feedback}</p>}

                    {phase.status === 'pending' && editingPhase !== phase.phaseNumber && (
                      <button onClick={() => setEditingPhase(phase.phaseNumber)} className="text-xs bg-green-500/20 text-green-300 hover:bg-green-500/30 px-2 py-1 rounded">
                        Mark Complete
                      </button>
                    )}

                    {editingPhase === phase.phaseNumber && (
                      <div className="space-y-2">
                        <textarea className="w-full bg-slate-700 border border-slate-600 text-white text-xs px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" placeholder="Feedback..." value={phaseFeedback} onChange={(e) => setPhaseFeedback(e.target.value)} />
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingPhase(null); setPhaseFeedback(''); }} className="flex-1 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">Cancel</button>
                          <button onClick={() => handleMarkComplete(phase.phaseNumber, phaseFeedback)} disabled={loading} className="flex-1 text-xs bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50">Complete</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-medium mt-3">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
