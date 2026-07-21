import React, { useEffect, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { mutatedApi } from '../api/mutatedApi';

export const ContextTab: React.FC = () => {
  const { sessionId, selectedNode } = useSession();
  const [contextText, setContextText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!sessionId || !selectedNode) return;

    setLoading(true);
    mutatedApi
      .getNodeContext(sessionId, selectedNode.id, selectedNode.description)
      .then((res) => setContextText(res.retrieved_context))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId, selectedNode]);

  if (!selectedNode) return <div className="p-6 text-slate-500">Select a node to view context.</div>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-100">{selectedNode.title}</h2>
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 font-mono leading-relaxed max-h-[500px] overflow-y-auto">
        {loading ? 'Retrieving grounded RAG chunks from ChromaDB...' : contextText || 'No context returned for this node.'}
      </div>
    </div>
  );
};
