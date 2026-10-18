import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { MarkdownRenderer } from '../components/MarkdownRenderer.tsx';
import { STANDARD_SUBJECTS } from '../constants/index.ts';
import {
  Sparkles,
  Send,
  Plus,
  History,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export const TutorView: React.FC = () => {
  const {
    chats,
    activeChat,
    setActiveChatId,
    createNewChat,
    deleteChat,
    addChatMessage,
    updateLastMessageContent,
    profile,
    consumeUsage,
    canUse,
    recordActivity,
    addToast,
    setTabWithArg,
  } = useApp();

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>(
    activeChat?.subject || 'Mathematics'
  );
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.messages, isStreaming]);

  // Keep selected subject synced with active chat
  useEffect(() => {
    if (activeChat?.subject) {
      setSelectedSubject(activeChat.subject);
    }
  }, [activeChat?.id]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isStreaming) return;

    if (!canUse('tutorMsgs', 1)) {
      addToast('Daily AI Tutor limit reached! Upgrade to Plus or Pro for more questions.', 'warning');
      return;
    }

    let chat = activeChat;
    if (!chat) {
      chat = createNewChat(selectedSubject);
    }

    const userMessageId = `msg_${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      role: 'user' as const,
      content: textToSend,
      timestamp: Date.now(),
    };

    addChatMessage(chat.id, userMessage);
    setInput('');
    setIsStreaming(true);

    // Consume 1 quota and record activity
    consumeUsage('tutorMsgs', 1);
    recordActivity('tutorMsgs', 1, 1);

    // Placeholder for AI streaming reply
    const aiMessageId = `msg_ai_${Date.now()}`;
    addChatMessage(chat.id, {
      id: aiMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
    });

    try {
      const historyToSend = chat.messages
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));
      historyToSend.push({ role: 'user', content: textToSend });

      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyToSend,
          subject: selectedSubject,
          level: profile.level,
          country: profile.country,
          curriculum: profile.curriculum,
          language: profile.language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reach AI Tutor.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                updateLastMessageContent(chat.id, parsed.text);
              } else if (parsed.error) {
                updateLastMessageContent(chat.id, `\n\n*(Error: ${parsed.error})*`);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      updateLastMessageContent(
        chat.id,
        `\n\n⚠️ **Unable to complete response:** ${err.message || 'Please check your connection and try again.'}`
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    'Explain simpler (ELI5)',
    'Give a real-world example in ' + profile.country,
    'Give me 2 practice questions',
    'Summarize key takeaways in bullet points',
    'Show step-by-step formula derivation',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] sm:h-[calc(100vh-7.5rem)] max-w-5xl mx-auto pb-4">
      {/* Top Controls: Subject Chips & History / New Chat */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        {/* Subject Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full sm:max-w-2xl no-scrollbar">
          {['General', ...STANDARD_SUBJECTS.slice(0, 6)].map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedSubject === subj
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
            title="Chat History"
          >
            <History className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">History ({chats.length})</span>
          </button>

          <button
            onClick={() => createNewChat(selectedSubject)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4 px-1 sm:px-2">
        {!activeChat || activeChat.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="max-w-md space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                How can I help you study today?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Ask any question from your {profile.level} syllabus. I will explain step by step and help you truly master the topic.
              </p>
            </div>

            {/* Suggested Starter Questions */}
            <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {[
                { label: 'Quadratic formula derivation step by step', subject: 'Mathematics' },
                { label: 'Explain the 1948 Accra Riots in simple terms', subject: 'Social Studies' },
                { label: 'Difference between Mitosis and Meiosis', subject: 'Integrated Science' },
                { label: 'How does supply and demand set market price?', subject: 'Economics' },
              ].map((sug, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedSubject(sug.subject);
                    handleSend(sug.label);
                  }}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-xs group"
                >
                  <div className="text-[10px] uppercase font-bold text-indigo-500 mb-0.5">
                    {sug.subject}
                  </div>
                  <div className="line-clamp-2">{sug.label}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          activeChat.messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative p-4 rounded-2xl max-w-[88%] sm:max-w-[80%] text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                  ) : (
                    <>
                      {msg.content ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        <div className="flex items-center gap-2 py-1 text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                          <span className="text-xs font-medium ml-1">StudyBuddy is thinking...</span>
                        </div>
                      )}

                      {/* Bubble Action Bar for AI replies */}
                      {msg.content && !isStreaming && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                          <div className="text-[11px]">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                              title="Copy Answer"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-500">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() =>
                                setTabWithArg('quiz', {
                                  subject: selectedSubject,
                                  topic: activeChat.title,
                                })
                              }
                              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                              title="Test on this topic"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Quiz Me</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    {profile.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Follow-up Chips (only visible when there are messages) */}
      {activeChat && activeChat.messages.length > 0 && !isStreaming && (
        <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 shrink-0 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Composer Input Form */}
      <div className="pt-2 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 rounded-2xl shadow-md p-1.5 transition-all"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Ask StudyBuddy in ${selectedSubject}... (e.g. "Explain photosynthesis like I'm 14")`}
            rows={1}
            disabled={isStreaming}
            className="w-full resize-none bg-transparent px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none min-h-[42px] max-h-32"
          />

          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className={`p-2.5 rounded-xl font-bold transition-all shrink-0 ${
              input.trim() && !isStreaming
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isStreaming ? (
              <div className="w-5 h-5 border-2 border-indigo-300 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {/* Chat History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Chat History ({chats.length})
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {chats.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No chat history yet.</div>
              ) : (
                chats.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveChatId(c.id);
                      setShowHistoryModal(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      activeChat?.id === c.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{c.subject}</span>
                        <span>·</span>
                        <span>{c.messages.length} msgs</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(c.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
