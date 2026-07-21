import React from 'react';
import { useSession, CurriculumNode } from '../context/SessionContext';

const statusStyles: Record<string, string> = {
  unlocked: 'border-indigo-500 bg-indigo-950/20 text-indigo-300',
  locked: 'border-slate-800 bg-slate-900/40 text-slate-500 opacity-50 cursor-not-allowed',
  mastered: 'border-emerald-500 bg-emerald-950/20 text-emerald-300',
  shaky: 'border-amber-500 bg-amber-950/20 text-amber-300',
  blocked: 'border-rose-500 bg-rose-950/20 text-rose-300',
};

export const RoadmapPanel: React.FC = () => {
  const { curriculum, selectedNode, setSelectedNode } = useSession();

  const renderNode = (node: CurriculumNode) => {
    const isSelected = selectedNode?.id === node.id;
    const style = statusStyles[node.status] || statusStyles.locked;

    return (
      <div key={node.id} className="space-y-2">
        <div
          onClick={() => node.status !== 'locked' && setSelectedNode(node)}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${style} ${
            isSelected ? 'ring-2 ring-indigo-500 shadow-lg' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold">{node.title}</h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border border-current">
              {node.status}
            </span>
          </div>
          <p className="text-xs line-clamp-2 opacity-80">{node.description}</p>
        </div>

        {node.child_nodes && node.child_nodes.length > 0 && (
          <div className="ml-6 pl-4 border-l-2 border-indigo-500/30 space-y-2">
            <span className="text-[10px] text-indigo-400 font-mono font-semibold uppercase">⚡ Remediation Injected</span>
            {node.child_nodes.map(renderNode)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-100">Evolving Study Roadmap</h2>
      <div className="space-y-3">{curriculum.map(renderNode)}</div>
    </div>
  );
};
