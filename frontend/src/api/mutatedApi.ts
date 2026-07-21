import axios from 'axios';

const API_BASE_URL = 'https://mutated-backend.onrender.com';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

export const mutatedApi = {
  initSession: async (goal: string, files: File[]) => {
    const formData = new FormData();
    formData.append('goal', goal);
    files.forEach((file) => formData.append('files', file));

    const response = await client.post('/session/init', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getNodeContext: async (sessionId: string, nodeId: string, description: string) => {
    const response = await client.get(`/curriculum/${sessionId}/node/${nodeId}/context`, {
      params: { description },
    });
    return response.data;
  },

  getNodeQuiz: async (sessionId: string, nodeId: string, description: string) => {
    const response = await client.get(`/curriculum/${sessionId}/node/${nodeId}/quiz`, {
      params: { description },
    });
    return response.data;
  },

  submitQuiz: async (sessionId: string, nodeId: string, answers: Record<string, string>, confidence: number) => {
    const response = await client.post(`/curriculum/${sessionId}/node/${nodeId}/submit`, {
      answers,
      confidence,
    });
    return response.data;
  },

  getAgentLogs: async (sessionId: string) => {
    const response = await client.get(`/agent/${sessionId}/log`);
    return response.data;
  },

  forceReplan: async (sessionId: string, targetNodeId: string) => {
    const response = await client.post(`/agent/${sessionId}/replan`, null, {
      params: { target_node_id: targetNodeId },
    });
    return response.data;
  },
};
