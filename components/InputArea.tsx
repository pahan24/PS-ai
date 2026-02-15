import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Image as ImageIcon, X, StopCircle } from 'lucide-react';
import { Attachment } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, onStop, isGenerating, disabled }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || disabled || isGenerating) return;
    onSend(input, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const data = loadEvent.target?.result as string;
          const base64 = data.split(',')[1];
          setAttachments(prev => [...prev, {
            name: file.name,
            mimeType: file.type,
            data: base64
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      // Stop logic usually handled by recognition.onend
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900 border-t border-slate-800">
      
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-4 mb-4 overflow-x-auto p-2">
          {attachments.map((att, i) => (
            <div key={i} className="relative group shrink-0">
              {att.mimeType.startsWith('image/') ? (
                <img 
                  src={`data:${att.mimeType};base64,${att.data}`} 
                  alt="preview" 
                  className="h-20 w-20 object-cover rounded-lg border border-slate-700"
                />
              ) : (
                <div className="h-20 w-20 flex items-center justify-center bg-slate-800 rounded-lg border border-slate-700 text-xs text-center p-1 break-words">
                  {att.name}
                </div>
              )}
              <button 
                onClick={() => removeAttachment(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-end gap-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700 focus-within:border-blue-500/50 focus-within:bg-slate-800 transition-all">
        
        <button 
          className="p-3 text-slate-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-700"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          <Paperclip size={20} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileSelect} 
          multiple
          accept="image/*, application/pdf, text/plain"
        />

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a prompt here"
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none resize-none py-3 max-h-[200px]"
          rows={1}
          disabled={disabled}
        />

        {isGenerating ? (
          <button 
            onClick={onStop}
            className="p-3 text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-all animate-pulse"
            title="Stop generation"
          >
            <StopCircle size={20} />
          </button>
        ) : (
          <>
            <button 
              onClick={toggleVoice}
              className={`p-3 transition-colors rounded-lg hover:bg-slate-700 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-blue-400'}`}
              title="Voice input"
            >
              <Mic size={20} />
            </button>
            <button 
              onClick={handleSend}
              disabled={!input.trim() && attachments.length === 0}
              className={`p-3 rounded-lg transition-all ${
                (input.trim() || attachments.length > 0) 
                  ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20' 
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default InputArea;