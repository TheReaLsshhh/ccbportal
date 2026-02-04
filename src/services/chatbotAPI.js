import { getOrCreateSessionId } from './sessionManager';

// Get backend URL and construct full API path
const getApiBase = () => {
  // In development, prefer localhost to ensure local testing works
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }

  const backendUrl = process.env.REACT_APP_API_URL;
  if (backendUrl) {
    return `${backendUrl.replace(/\/$/, '')}/api`;
  }
  return '/api';
};

const API_BASE = getApiBase();
const CHATBOT_ENDPOINT = `${API_BASE}/chatbot/query/`;

const sendChatbotQuery = async ({ message, context, history }) => {
  const payload = {
    message,
    context,
    history,
    session_id: getOrCreateSessionId()
  };

  const response = await fetch(CHATBOT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Chatbot request failed');
  }
  return data?.reply || data?.message || "I'm sorry, I couldn't generate a response right now.";
};

export {
  sendChatbotQuery
};
