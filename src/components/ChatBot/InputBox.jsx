import React from 'react';

const InputBox = ({ inputRef, value, onChange, onSend, disabled }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chatbot-input-container">
      <input
        ref={inputRef}
        type="text"
        className="chatbot-input"
        placeholder="Type your message..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
      />
      <button
        className="chatbot-send-btn"
        onClick={onSend}
        disabled={!value.trim() || disabled}
        aria-label="Send message"
      >
        <i className="fas fa-paper-plane"></i>
      </button>
    </div>
  );
};

export default InputBox;

