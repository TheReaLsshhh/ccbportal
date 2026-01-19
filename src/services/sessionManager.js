const STORAGE_KEYS = {
  messages: 'chatbot_messages',
  isOpen: 'chatbot_is_open',
  sessionId: 'chatbot_session_id'
};

const loadMessages = (fallback = []) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.messages);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    return fallback;
  }
};

const saveMessages = (messages) => {
  try {
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
  } catch (error) {
    // ignore storage failures
  }
};

const loadIsOpen = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.isOpen);
    return saved === 'true';
  } catch (error) {
    return false;
  }
};

const saveIsOpen = (isOpen) => {
  try {
    localStorage.setItem(STORAGE_KEYS.isOpen, String(isOpen));
  } catch (error) {
    // ignore storage failures
  }
};

const getOrCreateSessionId = () => {
  try {
    let sessionId = localStorage.getItem(STORAGE_KEYS.sessionId);
    if (!sessionId) {
      sessionId = `ccb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(STORAGE_KEYS.sessionId, sessionId);
    }
    return sessionId;
  } catch (error) {
    return null;
  }
};

const clearSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.messages);
    localStorage.removeItem(STORAGE_KEYS.isOpen);
  } catch (error) {
    // ignore storage failures
  }
};

export {
  loadMessages,
  saveMessages,
  loadIsOpen,
  saveIsOpen,
  getOrCreateSessionId,
  clearSession
};

