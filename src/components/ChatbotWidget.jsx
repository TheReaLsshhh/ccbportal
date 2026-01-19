import React, { useEffect, useState } from 'react';
import ChatBot from './ChatBot/ChatBot';
import ChatbotIcon from './ChatbotIcon';
import useChatbot from '../hooks/useChatbot';
import { clearSession, loadIsOpen, saveIsOpen } from '../services/sessionManager';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(loadIsOpen());
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const {
    messages,
    inputMessage,
    setInputMessage,
    isTyping,
    sendMessage,
    resetConversation
  } = useChatbot();

  useEffect(() => {
    saveIsOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (!showCloseConfirm) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowCloseConfirm(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showCloseConfirm]);

  const handleCloseClick = () => {
    if (isOpen) {
      setShowCloseConfirm(true);
    } else {
      setIsOpen(true);
    }
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    setIsOpen(false);
    clearSession();
    resetConversation();
  };

  const cancelClose = () => {
    setShowCloseConfirm(false);
  };

  const toggleChatbot = () => {
    if (isOpen) {
      setShowCloseConfirm(true);
    } else {
      setIsOpen(true);
    }
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <ChatBot
            messages={messages}
            inputMessage={inputMessage}
            onInputChange={setInputMessage}
            onSend={sendMessage}
            isTyping={isTyping}
            onRequestClose={handleCloseClick}
            shouldFocus={isOpen}
          />
        </div>
      )}

      <ChatbotIcon isOpen={isOpen} onToggle={toggleChatbot} />

      {showCloseConfirm && (
        <div className="chatbot-confirm-overlay" onClick={cancelClose}>
          <div className="chatbot-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="chatbot-confirm-header">
              <h3>Close Chat?</h3>
            </div>
            <div className="chatbot-confirm-body">
              <p>Closing the chat will clear all message history and you won't be able to restore it.</p>
              <p>Are you sure you want to close?</p>
            </div>
            <div className="chatbot-confirm-actions">
              <button
                className="chatbot-confirm-btn chatbot-confirm-cancel"
                onClick={cancelClose}
              >
                Cancel
              </button>
              <button
                className="chatbot-confirm-btn chatbot-confirm-close"
                onClick={confirmClose}
              >
                Close Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;

