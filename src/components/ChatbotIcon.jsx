import React from 'react';

const ChatbotIcon = ({ isOpen, onToggle }) => (
  <button
    className={`chatbot-toggle-btn ${isOpen ? 'open' : ''}`}
    onClick={onToggle}
    aria-label={isOpen ? 'Close chat' : 'Open chat'}
    aria-expanded={isOpen}
  >
    {isOpen ? (
      <i className="fas fa-times"></i>
    ) : (
      <i className="fas fa-comments"></i>
    )}
  </button>
);

export default ChatbotIcon;

