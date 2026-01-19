import React, { useState, useEffect, useRef, useMemo } from 'react';
import './Chatbot.css';
import chatbotKnowledge from '../utils/chatbotKnowledge';
import apiService from '../services/api';

const Chatbot = () => {
  const createWelcomeMessage = () => ({
    text: "Hello! I'm here to help you with questions about City College of Bayawan. How can I assist you today?",
    sender: 'bot',
    timestamp: new Date()
  });

  const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'i', 'in', 'is', 'it', 'of',
    'on', 'or', 'that', 'the', 'this', 'to', 'what', 'when', 'where', 'who', 'why', 'with', 'you', 'your'
  ]);

  const normalizeText = (text) => (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );

  const tokenize = (text) => {
    if (!text) return [];
    return normalizeText(text)
      .split(' ')
      .filter((token) => token && !STOP_WORDS.has(token));
  };

  const buildEntryText = (entry) => {
    const detailText = Array.isArray(entry.details) ? entry.details.join(' ') : '';
    const actionText = Array.isArray(entry.actions) ? entry.actions.join(' ') : '';
    return `${entry.title} ${entry.summary} ${(entry.keywords || []).join(' ')} ${detailText} ${actionText} ${entry.extra || ''}`;
  };

  const buildKnowledgeIndex = (entries) => (
    entries.map((entry) => ({
      ...entry,
      tokens: new Set(tokenize(buildEntryText(entry)))
    }))
  );

  const LOCAL_RESPONSE_THRESHOLD = 0.3;
  const SOFT_RESPONSE_THRESHOLD = 0.22;
  const DYNAMIC_ENTRY_LIMIT = 6;
  const SITE_INTENT_KEYWORDS = [
    'admissions', 'apply', 'enroll', 'enrollment', 'program', 'programs', 'academics', 'courses',
    'faculty', 'staff', 'news', 'events', 'announcements', 'downloads', 'forms', 'contact', 'about',
    'mission', 'vision', 'history', 'students', 'logo'
  ];

  const scoreEntry = (entry, userTokens, normalizedMessage) => {
    if (!userTokens.length) return 0;
    let overlap = 0;
    userTokens.forEach((token) => {
      if (entry.tokens.has(token)) overlap += 1;
    });
    let score = overlap / Math.max(userTokens.length, 4);
    const titleNormalized = normalizeText(entry.title);
    if (titleNormalized && normalizedMessage.includes(titleNormalized)) {
      score += 0.15;
    }
    (entry.keywords || []).forEach((keyword) => {
      const keywordNormalized = normalizeText(keyword);
      if (keywordNormalized && normalizedMessage.includes(keywordNormalized)) {
        score += 0.08;
      }
    });
    return Math.min(score, 1);
  };

  const buildLocalResponse = (message, matches) => {
    const lowerMessage = normalizeText(message);
    const wantsLatest = ['latest', 'recent', 'new', 'updates'].some((word) => lowerMessage.includes(word));
    const hasDynamic = matches.some(({ entry }) => entry.sourceType === 'dynamic');

    let intro = "Here’s the most relevant page for your request:";
    if (lowerMessage.includes('where') || lowerMessage.includes('find')) {
      intro = "You can find that here:";
    } else if (hasDynamic && wantsLatest) {
      intro = "Here are the latest updates that match your request:";
    } else if (hasDynamic) {
      intro = "Here are the most relevant updates I found:";
    }

    const lines = matches.flatMap(({ entry }) => {
      const details = Array.isArray(entry.details) ? entry.details.filter(Boolean) : [];
      const actions = Array.isArray(entry.actions) ? entry.actions.filter(Boolean) : [];
      const block = [
        `- [${entry.title}](${entry.url}): ${entry.summary}`
      ];
      if (details.length) {
        block.push('  Details:');
        details.forEach((detail) => block.push(`  - ${detail}`));
      }
      if (actions.length) {
        block.push('  What you can do:');
        actions.forEach((action) => block.push(`  - ${action}`));
      }
      return block;
    });

    return `${intro}\n\n${lines.join('\n')}\n\nIf you want, tell me exactly what detail you’re looking for and I’ll narrow it down.`;
  };

  const hasSiteIntent = (normalizedMessage) => (
    SITE_INTENT_KEYWORDS.some((keyword) => normalizedMessage.includes(keyword))
  );

  const getLocalResponse = (message, knowledgeIndex) => {
    const normalizedMessage = normalizeText(message);
    const userTokens = tokenize(message);
    if (!userTokens.length) {
      return { localReply: null, context: [], confidence: 0 };
    }

    const scored = knowledgeIndex
      .map((entry) => ({ entry, score: scoreEntry(entry, userTokens, normalizedMessage) }))
      .sort((a, b) => b.score - a.score);

    const topScore = scored[0]?.score || 0;
    const topMatches = scored
      .filter((item) => item.score >= Math.max(0.18, topScore * 0.6))
      .slice(0, 3);

    const context = topMatches.map(({ entry }) => ({
      title: entry.title,
      url: entry.url,
      summary: entry.summary
    }));

    const shouldAnswerLocally = topScore >= LOCAL_RESPONSE_THRESHOLD
      || (hasSiteIntent(normalizedMessage) && topScore >= SOFT_RESPONSE_THRESHOLD);

    if (!shouldAnswerLocally) {
      return { localReply: null, context, confidence: topScore };
    }

    return {
      localReply: buildLocalResponse(message, topMatches),
      context,
      confidence: topScore
    };
  };

  const getQuickReply = (message) => {
    const normalized = normalizeText(message);
    if (!normalized) return null;
    if (['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'].some((greet) => normalized.includes(greet))) {
      return "Hi! I’m here to help with anything about City College of Bayawan. What would you like to explore?";
    }
    if (['thank', 'thanks', 'appreciate'].some((word) => normalized.includes(word))) {
      return "You’re welcome! If you need anything else, just ask.";
    }
    if (['bye', 'goodbye', 'see you'].some((word) => normalized.includes(word))) {
      return "Goodbye! Take care, and come back anytime if you have more questions.";
    }
    return null;
  };

  const extractTextFromValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === 'string' && item.trim()).join(' ');
    }
    return '';
  };

  const buildSummaryFromItem = (item, fallback = '') => {
    if (!item || typeof item !== 'object') return fallback;
    const fields = [
      'description', 'summary', 'details', 'body', 'content', 'overview',
      'program_overview', 'career_prospects', 'requirement_text', 'text',
      'title', 'name', 'department_name', 'position', 'role', 'goals', 'core_values',
      'mission', 'vision', 'duration_text', 'units_text', 'enhancements_text'
    ];
    const parts = [];
    fields.forEach((field) => {
      const value = extractTextFromValue(item[field]);
      if (value) {
        parts.push(value);
      }
    });
    if (item.core_courses) {
      parts.push(extractTextFromValue(item.core_courses));
    }
    if (item.specializations) {
      parts.push(extractTextFromValue(item.specializations));
    }
    return parts.join(' ').trim() || fallback;
  };

  const buildTitleFromItem = (item, fallback = 'Update') => {
    if (!item || typeof item !== 'object') return fallback;
    return (
      item.title ||
      item.name ||
      item.department_name ||
      item.position ||
      item.role ||
      item.short_title ||
      fallback
    );
  };

  const resolveItems = (data, keys = []) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      for (const key of keys) {
        if (Array.isArray(data[key])) return data[key];
      }
    }
    return [];
  };

  const buildDynamicEntry = ({ baseId, baseTitle, baseUrl, baseKeywords }, item, index) => {
    const title = buildTitleFromItem(item, baseTitle);
    const summary = buildSummaryFromItem(item, baseTitle);
    const keywords = Array.from(new Set([...(baseKeywords || []), ...tokenize(title)]));
    return {
      id: `${baseId}-${index}`,
      title: `${baseTitle}: ${title}`,
      url: baseUrl,
      summary: summary.slice(0, 260) || baseTitle,
      keywords,
      extra: baseTitle,
      sourceType: 'dynamic'
    };
  };

  const buildAdmissionsEntries = (data) => {
    const entries = [];
    const requirementsByCategory = data?.requirements_by_category || {};
    const stepsByCategory = data?.process_steps_by_category || {};

    Object.entries(requirementsByCategory).forEach(([category, items]) => {
      if (!Array.isArray(items)) return;
      items.slice(0, DYNAMIC_ENTRY_LIMIT).forEach((item, index) => {
        entries.push({
          id: `admissions-req-${category}-${index}`,
          title: `Admissions Requirement: ${item.text || category}`,
          url: '/admissions',
          summary: item.text || `Requirements for ${category}`,
          keywords: ['admissions', 'requirements', category.toLowerCase()],
          extra: 'Admissions requirements',
          sourceType: 'dynamic'
        });
      });
    });

    Object.entries(stepsByCategory).forEach(([category, items]) => {
      if (!Array.isArray(items)) return;
      items.slice(0, DYNAMIC_ENTRY_LIMIT).forEach((item, index) => {
        const stepTitle = item.title || `Step ${item.step_number || index + 1}`;
        entries.push({
          id: `admissions-step-${category}-${index}`,
          title: `Enrollment Step: ${stepTitle}`,
          url: '/admissions',
          summary: item.description || stepTitle,
          keywords: ['admissions', 'enrollment', 'steps', category.toLowerCase()],
          extra: 'Enrollment process',
          sourceType: 'dynamic'
        });
      });
    });

    return entries;
  };

  const getChatbotSessionId = () => {
    try {
      let sessionId = localStorage.getItem('chatbot_session_id');
      if (!sessionId) {
        sessionId = `ccb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem('chatbot_session_id', sessionId);
      }
      return sessionId;
    } catch (error) {
      return null;
    }
  };

  const buildHistoryPayload = (chatMessages) => (
    chatMessages
      .slice(-8)
      .map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))
  );

  const requestBackendReply = async ({ message, context, history }) => {
    const payload = {
      message,
      context,
      history,
      session_id: getChatbotSessionId()
    };

    const response = await fetch('/api/chatbot/ask/', {
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

  const [dynamicKnowledge, setDynamicKnowledge] = useState([]);

  const knowledgeIndex = useMemo(
    () => buildKnowledgeIndex([...chatbotKnowledge, ...dynamicKnowledge]),
    [dynamicKnowledge]
  );
  // Initialize messages from localStorage or use default
  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = localStorage.getItem('chatbot_messages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        return parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
    return [createWelcomeMessage()];
  });

  // Initialize isOpen from localStorage
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const savedState = localStorage.getItem('chatbot_is_open');
      return savedState === 'true';
    } catch (error) {
      return false;
    }
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('chatbot_messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat messages:', error);
    }
  }, [messages]);

  // Save isOpen state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chatbot_is_open', isOpen.toString());
    } catch (error) {
      console.error('Error saving chatbot state:', error);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    let isMounted = true;
    const loadDynamicKnowledge = async () => {
      const sources = [
        {
          id: 'academic-programs',
          title: 'Academic Programs',
          url: '/academics',
          keywords: ['academics', 'programs', 'courses'],
          fetch: () => apiService.getAcademicPrograms(),
          keys: ['programs']
        },
        {
          id: 'news-events',
          title: 'News & Events',
          url: '/news',
          keywords: ['news', 'events', 'updates'],
          fetch: () => apiService.getNewsEvents(),
          keys: ['news_items', 'news', 'events']
        },
        {
          id: 'announcements',
          title: 'Announcements',
          url: '/news',
          keywords: ['announcements', 'updates', 'notices'],
          fetch: () => apiService.getAnnouncements(),
          keys: ['announcements']
        },
        {
          id: 'events',
          title: 'Events',
          url: '/news',
          keywords: ['events', 'calendar', 'activities'],
          fetch: () => apiService.getEvents(),
          keys: ['events']
        },
        {
          id: 'achievements',
          title: 'Achievements',
          url: '/news',
          keywords: ['achievements', 'awards', 'recognition'],
          fetch: () => apiService.getAchievements(),
          keys: ['achievements']
        },
        {
          id: 'news',
          title: 'News',
          url: '/news',
          keywords: ['news', 'announcements', 'latest'],
          fetch: () => apiService.getNews(),
          keys: ['news']
        },
        {
          id: 'downloads',
          title: 'Downloads',
          url: '/downloads',
          keywords: ['downloads', 'forms', 'documents'],
          fetch: () => apiService.getDownloads(),
          keys: ['downloads']
        },
        {
          id: 'departments',
          title: 'Departments',
          url: '/faculty',
          keywords: ['departments', 'faculty', 'staff'],
          fetch: () => apiService.getDepartments(),
          keys: ['departments']
        },
        {
          id: 'personnel',
          title: 'Faculty & Staff',
          url: '/faculty',
          keywords: ['faculty', 'staff', 'personnel'],
          fetch: () => apiService.getPersonnel(),
          keys: ['personnel']
        },
        {
          id: 'institutional-info',
          title: 'Institutional Info',
          url: '/about',
          keywords: ['mission', 'vision', 'goals', 'core values', 'about'],
          fetch: () => apiService.getInstitutionalInfo(),
          keys: ['institutional_info']
        },
        {
          id: 'admissions-info',
          title: 'Admissions',
          url: '/admissions',
          keywords: ['admissions', 'requirements', 'enrollment'],
          fetch: () => apiService.getAdmissionsInfo(),
          keys: []
        }
      ];

      const results = await Promise.allSettled(
        sources.map(async (source) => {
          const data = await source.fetch();
          if (source.id === 'admissions-info') {
            return buildAdmissionsEntries(data);
          }
          if (source.id === 'institutional-info') {
            const info = data?.institutional_info || data;
            const summary = buildSummaryFromItem(info, 'Institutional information');
            return [
              {
                id: 'institutional-info',
                title: 'Institutional Information',
                url: '/about',
                summary: summary || 'Institutional mission, vision, goals, and core values.',
                keywords: ['mission', 'vision', 'goals', 'core values', 'about'],
                extra: 'Institutional information',
                sourceType: 'dynamic'
              }
            ];
          }
          const items = resolveItems(data, source.keys);
          return items.slice(0, DYNAMIC_ENTRY_LIMIT).map((item, index) =>
            buildDynamicEntry({
              baseId: source.id,
              baseTitle: source.title,
              baseUrl: source.url,
              baseKeywords: source.keywords
            }, item, index)
          );
        })
      );

      if (!isMounted) return;
      const entries = results
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value)
        .filter(Boolean);

      setDynamicKnowledge(entries);
    };

    loadDynamicKnowledge().catch((error) => {
      console.error('Failed to load dynamic chatbot knowledge:', error);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle Escape key to close confirmation dialog
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = {
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    const appendBotMessage = (text) => {
      setMessages(prev => [
        ...prev,
        {
          text,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    };

    try {
      const quickReply = getQuickReply(currentInput);
      if (quickReply) {
        appendBotMessage(quickReply);
        return;
      }

      const localResult = getLocalResponse(currentInput, knowledgeIndex);
      if (localResult.localReply) {
        appendBotMessage(localResult.localReply);
        return;
      }

      const historyPayload = buildHistoryPayload([...messages, userMessage]);
      const fallbackReply = await requestBackendReply({
        message: currentInput,
        context: localResult.context,
        history: historyPayload
      });
      appendBotMessage(fallbackReply);
    } catch (error) {
      console.error('Chatbot response error:', error);
      appendBotMessage("Sorry, I ran into a problem while fetching a response. Please try again in a moment.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCloseClick = () => {
    // Only show confirmation when closing (not opening)
    if (isOpen) {
      setShowCloseConfirm(true);
    } else {
      setIsOpen(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    setIsOpen(false);
    // Clear messages from localStorage when user confirms closing
    try {
      localStorage.removeItem('chatbot_messages');
      localStorage.removeItem('chatbot_is_open');
      // Reset to default welcome message
      setMessages([createWelcomeMessage()]);
    } catch (error) {
      console.error('Error clearing chat messages:', error);
    }
  };

  const cancelClose = () => {
    setShowCloseConfirm(false);
  };

  const toggleChatbot = () => {
    if (isOpen) {
      // When closing via toggle button, also show confirmation
      setShowCloseConfirm(true);
    } else {
      setIsOpen(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Parse markdown-style links and render as HTML
  const renderMessage = (text) => {
    if (!text) return text;
    
    // Simple regex to match [text](url) pattern
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      // Add the link
      parts.push({ type: 'link', text: match[1], url: match[2] });
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }
    
    // If no links found, return original text
    if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'text')) {
      return <>{text}</>;
    }
    
    // Render with links
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
                  // Handle relative URLs
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

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
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
              onClick={handleCloseClick}
              aria-label="Close chat"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`chatbot-message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-content">
                  {renderMessage(msg.text)}
                </div>
                <div className="message-time">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chatbot-message bot-message">
                <div className="message-content typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chatbot-input-container">
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
            />
            <button 
              className="chatbot-send-btn"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              aria-label="Send message"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
      
      <button 
        className={`chatbot-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={toggleChatbot}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <i className="fas fa-times"></i>
        ) : (
          <i className="fas fa-comments"></i>
        )}
      </button>
      
      {/* Close Confirmation Dialog */}
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

export default Chatbot;
