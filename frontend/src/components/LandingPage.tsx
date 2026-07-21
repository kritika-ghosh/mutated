import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { mutatedApi } from '../api/mutatedApi';

export const LandingPage: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { setSessionData } = useSession();
  const [goal, setGoal] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Initializing agentic workflow...');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || files.length === 0) return alert('Please enter a goal and select at least one .pdf or .md file.');

    setLoading(true);
    const intervals = [
      'Slicing reference materials into semantic overlapping nodes...',
      'Mapping vectors to ChromaDB memory layers...',
      'Groq inference engine constructing optimized study path pipelines...'
    ];
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % intervals.length;
      setLoadingText(intervals[idx]);
    }, 3000);

    try {
      const data = await mutatedApi.initSession(goal, files);
      clearInterval(timer);
      setSessionData(data.session_id, data.goal, data.curriculum, data.agent_log);
      onComplete();
    } catch (err) {
      clearInterval(timer);
      console.error(err);
      alert('Error initializing session. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-emerald-400 font-mono flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-lg font-bold">MUTATED AGENT RUNTIME ACTIVE</h2>
          </div>
          <p className="text-sm text-slate-300">{loadingText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Stop studying static calendars. Learn with a curriculum that <span className="text-indigo-500">mutates</span> to your needs.
          </h1>
          <p className="text-sm text-slate-400">
            mutatED uses localized Retrieval-Augmented Generation (RAG) and autonomous AI planning loops to continuously analyze your quiz accuracy and confidence metrics, re-engineering your study tree roadmap live as you learn.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Learning Path Goal</label>
            <input
              type="text"
              placeholder="e.g., Master Transformers in 4 Weeks"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Reference Documents (.pdf, .md)</label>
            <input
              type="file"
              multiple
              accept=".pdf,.md"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-slate-800 file:text-indigo-400 hover:file:bg-slate-700 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            Generate Agentic Study Blueprint
          </button>
        </form>
      </div>
    </div>
  );
};
