import React, { createContext, useContext, useState } from 'react';

export interface CurriculumNode {
  id: string;
  title: string;
  description: string;
  estimated_hours: number;
  dependencies: string[];
  mastery_score: number;
  status: 'unlocked' | 'locked' | 'mastered' | 'shaky' | 'blocked';
  child_nodes?: CurriculumNode[];
  retrieved_chunk_ids?: string[];
}

export interface AgentLog {
  timestamp: string;
  message: string;
}

interface SessionContextType {
  sessionId: string | null;
  goal: string;
  curriculum: CurriculumNode[];
  selectedNode: CurriculumNode | null;
  agentLogs: AgentLog[];
  setSessionData: (id: string, goal: string, curriculum: CurriculumNode[], logs: AgentLog[]) => void;
  setSelectedNode: (node: CurriculumNode | null) => void;
  updateSessionState: (curriculum: CurriculumNode[], logs?: AgentLog[]) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [goal, setGoal] = useState<string>('');
  const [curriculum, setCurriculum] = useState<CurriculumNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);

  const setSessionData = (id: string, goalText: string, newCurriculum: CurriculumNode[], newLogs: AgentLog[]) => {
    setSessionId(id);
    setGoal(goalText);
    setCurriculum(newCurriculum);
    setAgentLogs(newLogs);
    if (newCurriculum.length > 0) {
      setSelectedNode(newCurriculum[0]);
    }
  };

  const updateSessionState = (newCurriculum: CurriculumNode[], newLogs?: AgentLog[]) => {
    setCurriculum(newCurriculum);
    if (newLogs) setAgentLogs(newLogs);
  };

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        goal,
        curriculum,
        selectedNode,
        agentLogs,
        setSessionData,
        setSelectedNode,
        updateSessionState,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
};
