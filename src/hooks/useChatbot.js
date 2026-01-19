import { useEffect, useMemo, useState } from 'react';
import { staticEntries, dynamicSources } from '../services/contentRegistry';
import { extractEntries } from '../services/contentExtractor';
import { buildKnowledgeIndex, buildContextItems } from '../services/contentContext';
import { matchQuery } from '../services/queryMatcher';
import { buildLocalResponse, buildQuickReply } from '../services/responseGenerator';
import { formatErrorResponse } from '../utils/contentFormatter';
import { sendChatbotQuery } from '../services/chatbotAPI';
import { loadMessages, saveMessages } from '../services/sessionManager';

const LOCAL_RESPONSE_THRESHOLD = 0.3;
const SOFT_RESPONSE_THRESHOLD = 0.22;
const DYNAMIC_ENTRY_LIMIT = 6;

const createWelcomeMessage = () => ({
  text: "Hello! I'm here to help you with questions about City College of Bayawan. How can I assist you today?",
  sender: 'bot',
  timestamp: new Date()
});

const useChatbot = () => {
  const [messages, setMessages] = useState(() => loadMessages([createWelcomeMessage()]));
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dynamicKnowledge, setDynamicKnowledge] = useState([]);

  const knowledgeIndex = useMemo(
    () => buildKnowledgeIndex([...staticEntries, ...dynamicKnowledge]),
    [dynamicKnowledge]
  );

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    let isMounted = true;
    const loadDynamicKnowledge = async () => {
      const results = await Promise.allSettled(
        dynamicSources.map(async (source) => {
          const data = await source.fetch();
          return extractEntries(source, data, DYNAMIC_ENTRY_LIMIT);
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

  const appendBotMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        text,
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };

  const resetConversation = () => {
    setMessages([createWelcomeMessage()]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = {
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    try {
      const quickReply = buildQuickReply(currentInput);
      if (quickReply) {
        appendBotMessage(quickReply);
        return;
      }

      const { matches, topScore, normalizedMessage } = matchQuery(knowledgeIndex, currentInput);
      const hasSiteIntent = staticEntries.some((entry) =>
        (entry.keywords || []).some((keyword) => normalizedMessage.includes(keyword))
      );

      const shouldAnswerLocally = topScore >= LOCAL_RESPONSE_THRESHOLD
        || (hasSiteIntent && topScore >= SOFT_RESPONSE_THRESHOLD);

      if (shouldAnswerLocally && matches.length > 0) {
        appendBotMessage(buildLocalResponse(currentInput, matches));
        return;
      }

      const historyPayload = [...messages, userMessage]
        .slice(-8)
        .map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      const context = buildContextItems(matches);
      const fallbackReply = await sendChatbotQuery({
        message: currentInput,
        context,
        history: historyPayload
      });
      appendBotMessage(fallbackReply);
    } catch (error) {
      console.error('Chatbot response error:', error);
      appendBotMessage(formatErrorResponse());
    } finally {
      setIsTyping(false);
    }
  };

  return {
    messages,
    inputMessage,
    setInputMessage,
    isTyping,
    sendMessage,
    resetConversation
  };
};

export default useChatbot;

