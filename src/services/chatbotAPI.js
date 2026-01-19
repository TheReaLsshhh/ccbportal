import { getOrCreateSessionId } from './sessionManager';

const CHATBOT_ENDPOINT = '/api/chatbot/query/';

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

