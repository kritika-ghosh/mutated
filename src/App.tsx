import React, { useState } from 'react';
import { 
  BookOpen, 
  BrainCircuit, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  Zap 
} from 'lucide-react';

const BACKEND_URL = "https://mutated-backend.onrender.com";

export default function App() {
  const [learningGoal, setLearningGoal] = useState("Master Transformers in 4 Weeks");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'context' | 'quiz' | 'logs'>('context');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "System initialized.",
    `Connected to backend at ${BACKEND_URL}`
  ]);

  const handleGenerateBlueprint = async () => {
    setLoading(true);
    setLogs((prev) => [...prev, `Initializing session for: "${learningGoal}"...`]);

    try {
      const newSessionId = "sess_" + Math.random().toString(36).substring(2, 9);
      setSessionId(newSessionId);
      setLogs((prev) => [
        ...prev,
        `[Agent Reasoning] Decomposition complete for goal: "${learningGoal}"`,
        `[Session] Active Session ID generated: ${newSessionId}`
      ]);
    } catch (err) {
      setLogs((prev) => [...prev, `[Error] Failed to connect to backend service.`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/30">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              mutatED <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono border border-indigo-500/30">v1.0 React</span>
            </h1>
            <p className="text-xs text-slate-400">Adaptive Agentic Learning Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Connected: {BACKEND_URL}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Zap className="w-4 h-4" /> Step 1: Initialize Study Session
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Learning Goal</label>
              <input 
                type="text" 
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Source Material (PDF/Markdown)</label>
              <input 
                type="file" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-slate-800 file:text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <button 
              onClick={handleGenerateBlueprint}
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg font-medium text-sm transition"
            >
              {loading ? "Generating..." : "Generate Blueprint Map"}
            </button>

            <div className="text-xs font-mono text-slate-400">
              Active Session ID: <span className="text-indigo-400 font-bold">{sessionId || "None"}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
