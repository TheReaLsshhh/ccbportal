import React from 'react';

const formatTime = (date) => (
  date?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) || ''
);

const renderMessage = (text) => {
  if (!text) return text;

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'link', text: match[1], url: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'text')) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'link') {
          return (
            <a
              key={index}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#ff8c00',
                textDecoration: 'underline',
                fontWeight: '500'
              }}
              onClick={(e) => {
                if (part.url.startsWith('/')) {
                  e.preventDefault();
                  window.location.href = part.url;
                }
              }}
            >
              {part.text}
            </a>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </>
  );
};

const Message = ({ message }) => (
  <div className={`chatbot-message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}>
    <div className="message-content">
      {renderMessage(message.text)}
    </div>
    <div className="message-time">
      {formatTime(message.timestamp)}
    </div>
  </div>
);

export default Message;

