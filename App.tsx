import React, { useState, useEffect, useRef } from 'react';
import { Menu, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MessageItem from './components/MessageItem';
import InputArea from './components/InputArea';
import SettingsModal from './components/SettingsModal';
import PricingModal from './components/PricingModal';
import AuthPage from './components/AuthPage';
import { generateContentStream } from './services/geminiService';
import { initDB, getUserChats, saveChat, deleteChat, clearAllChats, importChats, saveUser, getUser } from './services/db';
import { ChatSession, Message, Settings, DEFAULT_SETTINGS, Attachment, MODELS, User, Plan } from './types';
import { STORAGE_KEYS, EXAMPLE_PROMPTS, APP_VERSION } from './constants';

function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // App State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Initialization ---

  // 1. Check Auth
  useEffect(() => {
    const checkAuth = async () => {
        await initDB();
        try {
            const lastUserId = localStorage.getItem('ps_ai_last_user_id');
            if (lastUserId) {
                const dbUser = await getUser(lastUserId);
                if (dbUser) {
                    setUser(dbUser);
                }
            } else {
                const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
                if (storedUser) setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error("Auth Load Error", e);
        } finally {
            setAuthChecked(true);
        }
    };
    checkAuth();
  }, []);

  // 2. Load Settings with Sanitation
  useEffect(() => {
    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (storedSettings) {
        try {
            const parsed = JSON.parse(storedSettings);
            // Ensure defaults for new fields and remove old junk
            const merged = { ...DEFAULT_SETTINGS, ...parsed };
            
            // Validate Model: Force Gemini default if old model is found
            if (!MODELS.some(m => m.id === merged.model)) {
                merged.model = DEFAULT_SETTINGS.model;
            }
            
            // Clean legacy keys to prevent issues
            if ((merged as any).openaiApiKey !== undefined) delete (merged as any).openaiApiKey;

            setSettings(merged);
        } catch (e) {
            console.error("Settings parse error", e);
            setSettings(DEFAULT_SETTINGS);
        }
    }
  }, []);

  // 3. Load Chats (Only when User changes)
  useEffect(() => {
    const loadUserChats = async () => {
        if (!user) {
            setSessions([]);
            setCurrentId(null);
            return;
        }

        try {
            const chats = await getUserChats(user.id);
            // Sort by update time
            const sorted = chats.sort((a, b) => b.updatedAt - a.updatedAt);
            setSessions(sorted);
            
            // Try to restore last active chat for this user
            const storedCurrentId = localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT_ID + '_' + user.id);
            if (storedCurrentId && sorted.some(c => c.id === storedCurrentId)) {
                setCurrentId(storedCurrentId);
            }
        } catch (error) {
            console.error("Failed to load user chats", error);
        }
    };

    if (authChecked) {
        loadUserChats();
    }
  }, [user, authChecked]);

  // --- Persistence ---

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (user && currentId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID + '_' + user.id, currentId);
    }
  }, [currentId, user]);

  // --- Logic ---

  const handleLogin = async (userData: User) => {
    setUser(userData);
    localStorage.setItem('ps_ai_last_user_id', userData.id);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData)); 
    await saveUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem('ps_ai_last_user_id');
  };

  const handleUpgrade = async (plan: Plan) => {
      if (user) {
          const updatedUser = { ...user, plan };
          setUser(updatedUser);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
          await saveUser(updatedUser); 
      }
  };

  const getCurrentSession = () => sessions.find(s => s.id === currentId);

  const createNewChat = async () => {
    if (!user) return '';

    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      userId: user.id, 
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: settings.model
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentId(newSession.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
    await saveChat(newSession);
    return newSession.id;
  };

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    if (!user) return;

    let activeId = currentId;
    if (!activeId) {
      activeId = await createNewChat();
    }

    const currentSess = sessions.find(s => s.id === activeId);
    let updatedTitle = currentSess?.title || 'New Chat';
    
    if (currentSess && currentSess.messages.length === 0) {
        updatedTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
    }

    const newUserMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments
    };

    const newModelMsg: Message = {
      id: crypto.randomUUID(),
      role: 'model',
      content: '', 
      timestamp: Date.now() + 1
    };

    const updateSessionState = (sessionId: string, updater: (s: ChatSession) => ChatSession) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                const updated = updater(s);
                return updated;
            }
            return s;
        }));
    };

    updateSessionState(activeId, (s) => ({
        ...s,
        title: updatedTitle,
        messages: [...s.messages, newUserMsg, newModelMsg],
        updatedAt: Date.now()
    }));

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    const contextMessages = currentSess 
        ? [...currentSess.messages, newUserMsg] 
        : [newUserMsg];

    await generateContentStream(
      contextMessages,
      settings,
      (textChunk) => {
        setSessions(prev => prev.map(s => {
          if (s.id === activeId) {
            const msgs = [...s.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.role === 'model') {
                lastMsg.content += textChunk;
            }
            return { ...s, messages: msgs };
          }
          return s;
        }));
      },
      async () => {
        setIsGenerating(false);
        abortControllerRef.current = null;
        setSessions(currentSessions => {
            const sessionToSave = currentSessions.find(s => s.id === activeId);
            if (sessionToSave) {
                saveChat(sessionToSave);
            }
            return currentSessions;
        });
      },
      async (error) => {
        setIsGenerating(false);
        setSessions(prev => {
            const newSessions = prev.map(s => {
                if (s.id === activeId) {
                    const msgs = [...s.messages];
                    const lastMsg = msgs[msgs.length - 1];
                    if (lastMsg.role === 'model') {
                        lastMsg.content = `Error: ${error}`;
                        lastMsg.isError = true;
                    }
                    return { ...s, messages: msgs };
                }
                return s;
            });
            const sessionToSave = newSessions.find(s => s.id === activeId);
            if (sessionToSave) saveChat(sessionToSave);
            return newSessions;
        });
      },
      abortControllerRef.current.signal
    );
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      const s = sessions.find(s => s.id === currentId);
      if (s) saveChat(s);
    }
  };

  const handleDeleteSession = async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentId === id) setCurrentId(null);
    await deleteChat(id);
  };

  const handleClearAll = async () => {
      const idsToDelete = sessions.map(s => s.id);
      setSessions([]);
      setCurrentId(null);
      for (const id of idsToDelete) {
          await deleteChat(id);
      }
  };

  const handleExportData = () => {
    const data = JSON.stringify(sessions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ps-ai-chats-${user?.name}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    if (!user) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
           const claimedChats = imported.map((c: any) => ({...c, userId: user.id}));
           
           setSessions(prev => {
             const existingIds = new Set(prev.map(s => s.id));
             const newSessions = claimedChats.filter((s: any) => !existingIds.has(s.id));
             return [...newSessions, ...prev];
           });
           await importChats(claimedChats);
           alert(`Imported ${claimedChats.length} chats successfully.`);
        }
      } catch (err) {
        alert("Failed to import file. Invalid JSON.");
      }
    };
    reader.readAsText(file);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentId, isGenerating]);


  if (!authChecked) return null; 

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const currentSession = getCurrentSession();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      <Sidebar 
        sessions={sessions}
        currentId={currentId}
        user={user}
        onSelectSession={setCurrentId}
        onNewChat={createNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onUpgradeClick={() => setIsPricingOpen(true)}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col relative h-full w-full min-w-0 bg-slate-950">
        
        {/* Header (Mobile) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur z-20">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-400">
            <Menu size={24} />
          </button>
          <span className="font-medium">PS AI v{APP_VERSION}</span>
          <div className="w-8" />
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20 ring-1 ring-white/10">
                <Sparkles size={40} className="text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-white mb-6 tracking-tight">
                Hello, {user.name.split(' ')[0]}
              </h1>
              <p className="text-slate-400 max-w-lg mb-10 text-lg leading-relaxed">
                How can I help you today? I'm equipped with the latest Gemini 2.0 and 3.0 multimodal models.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
                {EXAMPLE_PROMPTS.map((prompt, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSendMessage(prompt, [])}
                    className="p-5 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/30 rounded-2xl text-left text-sm text-slate-300 transition-all hover:scale-[1.01] hover:shadow-xl group"
                  >
                    <span className="group-hover:text-white transition-colors">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pb-40 pt-6">
              {currentSession.messages.map((msg, idx) => (
                <MessageItem 
                  key={msg.id} 
                  message={msg} 
                  isLast={idx === currentSession.messages.length - 1} 
                />
              ))}
              {isGenerating && (
                 <div className="w-full py-6">
                    <div className="max-w-4xl mx-auto px-4 flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles size={16} className="text-white animate-spin-slow" />
                        </div>
                        <div className="flex items-center gap-1.5 h-8 p-2 bg-slate-900 rounded-full px-4 border border-slate-800">
                             <div className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot" />
                             <div className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot" />
                             <div className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot" />
                        </div>
                    </div>
                 </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area (Sticky) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-20 pb-6 px-4 z-10">
          <InputArea 
            onSend={handleSendMessage} 
            onStop={handleStop}
            isGenerating={isGenerating}
            disabled={isGenerating}
          />
          <div className="text-center text-[10px] text-slate-600 mt-3 font-medium tracking-wide uppercase">
            PS AI Enterprise Environment • {settings.model} • v{APP_VERSION}
          </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        user={user}
        onSave={(newSettings) => setSettings(newSettings)}
        onUpgradeClick={() => { setIsSettingsOpen(false); setIsPricingOpen(true); }}
      />
      
      <PricingModal 
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        currentPlan={user.plan}
        onUpgrade={handleUpgrade}
      />

    </div>
  );
}

export default App;