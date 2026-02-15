import React, { useState, useRef, useMemo } from 'react';
import { Plus, MessageSquare, Trash2, Settings as SettingsIcon, Search, Download, Upload, LogOut, MoreHorizontal, Sparkles, Zap } from 'lucide-react';
import { ChatSession, User, PLANS } from '../types';
import { groupChatsByDate } from '../utils/dateUtils';

interface SidebarProps {
  sessions: ChatSession[];
  currentId: string | null;
  user: User;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onOpenSettings: () => void;
  onUpgradeClick: () => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentId,
  user,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll,
  onExportData,
  onImportData,
  onOpenSettings,
  onUpgradeClick,
  onLogout,
  isOpen,
  setIsOpen
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter first, then group
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => 
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.messages.some(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sessions, searchTerm]);

  const groupedSessions = useMemo(() => {
    return groupChatsByDate(filteredSessions);
  }, [filteredSessions]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportData(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const categoryOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'Older'];

  const getPlanBadge = () => {
      if (user.plan === 'pro') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30">PRO</span>;
      if (user.plan === 'plus') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">PLUS</span>;
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">FREE</span>;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative
      `}>
        {/* Header */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white">PS</div>
                <span className="font-semibold text-lg tracking-tight">Enterprise</span>
            </div>
            {getPlanBadge()}
          </div>
          
          <button 
            onClick={onNewChat}
            className="w-full flex items-center justify-between px-4 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl transition-all shadow-lg shadow-white/5 group"
          >
            <div className="flex items-center gap-3">
              <Plus size={20} className="text-slate-600 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-medium">New Chat</span>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 mb-2">
            <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search history..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all"
                />
            </div>
        </div>

        {/* Recent Chats List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 custom-scrollbar">
          {categoryOrder.map(category => {
            const categoryChats = groupedSessions[category];
            if (!categoryChats || categoryChats.length === 0) return null;

            return (
              <div key={category}>
                <div className="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10">
                  {category}
                </div>
                <div className="space-y-0.5 mt-1">
                  {categoryChats.map((session: ChatSession) => (
                    <div 
                      key={session.id}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                        currentId === session.id 
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                      }`}
                      onClick={() => {
                        onSelectSession(session.id);
                        if (window.innerWidth < 768) setIsOpen(false);
                      }}
                    >
                      <MessageSquare size={16} className="shrink-0" />
                      <span className="truncate text-sm flex-1">{session.title}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer & User Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
          
          {user.plan !== 'pro' && (
            <button 
                onClick={onUpgradeClick}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 hover:border-purple-500/50 group transition-all"
            >
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={16} className="text-purple-400" />
                    <span className="text-sm font-semibold text-slate-200">Upgrade Plan</span>
                </div>
                <div className="text-xs text-slate-500">Get advanced models & more</div>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
             <button 
                onClick={onExportData}
                className="flex items-center justify-center gap-2 p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 transition-colors"
             >
                <Download size={14} /> Export
             </button>
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 transition-colors"
             >
                <Upload size={14} /> Import
             </button>
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json"
                onChange={handleFileChange} 
             />
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 p-2 hover:bg-slate-900 rounded-xl transition-colors text-left border border-transparent hover:border-slate-800"
            >
                <img 
                    src={user.avatar} 
                    alt="User" 
                    className="w-9 h-9 rounded-full border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{user.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                </div>
                <MoreHorizontal size={16} className="text-slate-500" />
            </button>

            {/* Popover Menu */}
            {showUserMenu && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="px-4 py-2 border-b border-slate-800">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Plan</div>
                        <div className="text-sm font-bold text-white capitalize flex items-center justify-between">
                            {user.plan}
                            {user.plan !== 'pro' && <button onClick={onUpgradeClick} className="text-xs text-blue-400 font-normal hover:underline">Upgrade</button>}
                        </div>
                    </div>
                    <button 
                        onClick={() => { setShowUserMenu(false); onOpenSettings(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <SettingsIcon size={16} /> Settings
                    </button>
                    <div className="h-px bg-slate-800 my-0" />
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;