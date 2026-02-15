import React, { useState } from 'react';
import { X, Save, Lock, Zap, Brain, Sparkles, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Settings, MODELS, User, DEFAULT_SETTINGS } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  user: User;
  onSave: (settings: Settings) => void;
  onUpgradeClick: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, user, onSave, onUpgradeClick }) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);

  if (!isOpen) return null;

  const handleChange = (key: keyof Settings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };
  
  const handleReset = () => {
      if (confirm("Are you sure you want to reset all settings to default?")) {
          setLocalSettings(DEFAULT_SETTINGS);
      }
  };

  const isModelLocked = (modelTier: string) => {
    if (modelTier === 'free') return false;
    if (modelTier === 'plus' && user.plan === 'free') return true;
    if (modelTier === 'pro' && (user.plan === 'free' || user.plan === 'plus')) return true;
    return false;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Fast': return <Zap size={14} className="text-yellow-400" />;
      case 'Reasoning': return <Brain size={14} className="text-purple-400" />;
      case 'Complex': return <Sparkles size={14} className="text-blue-400" />;
      default: return <Sparkles size={14} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-white">Settings</h2>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
               Plan: {user.plan}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* API Keys Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">API Credentials</h3>
            
            <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 ml-1">Custom API Key (Optional)</label>
                <div className="relative">
                    <input 
                        type={showApiKey ? "text" : "password"}
                        value={localSettings.apiKey}
                        onChange={(e) => handleChange('apiKey', e.target.value)}
                        placeholder="sk-..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
                    />
                    <button 
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <p className="text-[10px] text-slate-500 ml-1">
                    Leave blank to use the system default key.
                </p>
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Model Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">Select Model</label>
            
            <div className="grid grid-cols-1 gap-2">
                {MODELS.map(m => {
                    const locked = isModelLocked(m.tier || 'free');
                    const isSelected = localSettings.model === m.id;
                    
                    return (
                        <div 
                            key={m.id}
                            onClick={() => !locked && handleChange('model', m.id)}
                            className={`relative group flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                                isSelected 
                                    ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/50' 
                                    : locked 
                                        ? 'bg-slate-950/30 border-slate-800 opacity-60'
                                        : 'bg-slate-950 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                            }`}
                        >
                            <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500' : 'border-slate-600'}`}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>{m.name}</span>
                                    <div className="flex items-center gap-1 bg-slate-800 rounded px-1.5 py-0.5">
                                        {getCategoryIcon(m.category || '')}
                                        <span className="text-[10px] text-slate-400">{m.category}</span>
                                    </div>
                                    {locked && (
                                            <span className="ml-auto text-[10px] uppercase font-bold tracking-wider text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
                                            <Lock size={10} /> {m.tier}
                                            </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">{m.description}</p>
                            </div>

                            {locked && (
                                <div className="absolute inset-0 z-10" onClick={(e) => { e.stopPropagation(); onUpgradeClick(); }} />
                            )}
                        </div>
                    );
                })}
            </div>
            
            {user.plan === 'free' && (
                <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                             <Sparkles size={18} className="text-purple-400" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-white">Unlock Pro Models</div>
                            <div className="text-xs text-slate-400">Get access to GPT-4o & more</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => { onClose(); onUpgradeClick(); }}
                        className="text-xs bg-white text-slate-950 font-bold px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Upgrade
                    </button>
                </div>
            )}
          </div>

          {/* System Instructions */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <label className="block text-sm font-medium text-slate-300">System Instruction</label>
            <textarea 
                value={localSettings.systemInstruction}
                onChange={(e) => handleChange('systemInstruction', e.target.value)}
                placeholder="You are a helpful assistant..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 resize-none text-sm"
            />
          </div>

          {/* Parameters */}
          <div className="space-y-6 pt-4 border-t border-slate-800">
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Creativity (Temperature)</label>
                    <span className="text-xs text-slate-500">{localSettings.temperature}</span>
                </div>
                <input 
                    type="range" 
                    min="0" max="2" step="0.1" 
                    value={localSettings.temperature}
                    onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Precise</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                </div>
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-between bg-slate-900 rounded-b-2xl">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-2"
            title="Reset to default settings"
          >
             <RotateCcw size={14} /> <span className="hidden sm:inline">Reset Defaults</span>
          </button>
          
          <div className="flex gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 text-sm"
            >
                <Save size={16} />
                Confirm Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;