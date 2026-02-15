import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, RotateCw, Volume2, Square } from 'lucide-react';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isLast: boolean;
  onRegenerate?: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isLast, onRegenerate }) => {
  const isModel = message.role === 'model';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Cleanup speech on unmount
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.content);
    // Attempt to select a better voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang === 'en-US');
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className={`group w-full text-slate-100 border-b border-transparent hover:bg-slate-800/20 py-8 ${isModel ? 'bg-slate-900/30' : ''}`}>
      <div className="max-w-4xl mx-auto px-4 flex gap-4 md:gap-6">
        
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isModel ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-slate-700'}`}>
          {isModel ? <Bot size={18} className="text-white" /> : <User size={18} className="text-slate-300" />}
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-slate-300">{isModel ? 'Gemini' : 'You'}</span>
            <span className="text-xs text-slate-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
             <div className="flex gap-2 mb-4 overflow-x-auto">
               {message.attachments.map((att, i) => (
                 att.mimeType.startsWith('image/') ? (
                   <img key={i} src={`data:${att.mimeType};base64,${att.data}`} className="h-32 rounded-md border border-slate-700" alt="attachment" />
                 ) : (
                    <div key={i} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs">{att.name}</div>
                 )
               ))}
             </div>
          )}

          <div className="prose prose-invert max-w-none text-slate-200 leading-7">
            {message.isError ? (
                <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                    {message.content}
                </div>
            ) : (
                <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({node, inline, className, children, ...props}: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                        <div className="relative group/code my-4">
                        <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                            <button
                            onClick={() => handleCopy(String(children))}
                            className="p-1 bg-slate-700 rounded hover:bg-slate-600 text-slate-300"
                            title="Copy code"
                            >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                        <SyntaxHighlighter
                            {...props}
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg !bg-[#1e1e1e] !p-4 text-sm border border-slate-700"
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                        </div>
                    ) : (
                        <code {...props} className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded text-sm font-mono">
                        {children}
                        </code>
                    );
                    },
                    table({children}) {
                        return <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-slate-700 border border-slate-700 rounded-lg">{children}</table></div>
                    },
                    th({children}) {
                        return <th className="px-3 py-2 bg-slate-800 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{children}</th>
                    },
                    td({children}) {
                        return <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300 border-t border-slate-700">{children}</td>
                    }
                }}
                >
                {message.content}
                </ReactMarkdown>
            )}
          </div>
          
          {/* Message Actions */}
          <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={() => handleCopy(message.content)} 
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
                title="Copy text"
            >
                {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            
            <button 
                onClick={handleSpeak}
                className={`p-1.5 rounded transition-colors ${isSpeaking ? 'text-blue-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                title={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
                {isSpeaking ? <Square size={14} fill="currentColor" /> : <Volume2 size={14} />}
            </button>

            {isModel && isLast && onRegenerate && (
                <button 
                    onClick={onRegenerate}
                    className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
                    title="Regenerate response"
                >
                    <RotateCw size={14} />
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;