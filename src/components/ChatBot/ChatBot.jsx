import React, { useEffect, useRef } from 'react';
import './ChatBot.css';
import ChatWindow from './ChatWindow';
import InputBox from './InputBox';

const ChatBot = ({
  messages,
  inputMessage,
  onInputChange,
  onSend,
  isTyping,
  onRequestClose,
  shouldFocus
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [shouldFocus]);

  return (
    <>
      <div className="chatbot-header">
        <div className="chatbot-header-content">
          <div className="chatbot-avatar">
            <i className="fas fa-robot"></i>
          </div>
          <div className="chatbot-header-text">
            <h3>CCB Assistant</h3>
            <p>We're here to help</p>
          </div>
        </div>
        <button
          className="chatbot-close-btn"
          onClick={onRequestClose}
          aria-label="Close chat"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <ChatWindow messages={messages} isTyping={isTyping} />
      <InputBox
        inputRef={inputRef}
        value={inputMessage}
        onChange={onInputChange}
        onSend={onSend}
        disabled={isTyping}
      />
    </>
  );
};

export default ChatBot;

