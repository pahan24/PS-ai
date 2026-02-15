import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle2, Shield, Globe, Lock } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthPageProps {
  onLogin: (user: UserType) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authStage, setAuthStage] = useState<'idle' | 'popup' | 'verifying' | 'success'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const simulatePopupLogin = (provider: 'google' | 'facebook' | 'apple') => {
    setIsLoading(true);
    setAuthStage('popup');

    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
        'about:blank', 
        'Auth', 
        `width=${width},height=${height},top=${top},left=${left}`
    );

    if (popup) {
        let title = "Sign In";
        let color = "#333";
        if (provider === 'google') { title = "Google"; color="#4285F4"; }
        if (provider === 'facebook') { title = "Facebook"; color="#1877F2"; }
        if (provider === 'apple') { title = "Apple ID"; color="#000"; }

        popup.document.write(`
            <html>
                <head><title>Sign in with ${title}</title></head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fff;">
                    <h2 style="color: #333; margin-bottom: 20px;">Continue with ${title}</h2>
                    <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top-color: ${color}; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">Authenticating securely...</p>
                    <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
                    <script>
                        setTimeout(() => {
                            window.close();
                        }, 1800);
                    </script>
                </body>
            </html>
        `);
    }

    setTimeout(() => {
        setAuthStage('verifying');
        setTimeout(() => {
            setAuthStage('success');
            setTimeout(() => {
                const id = `${provider}-${Date.now()}`;
                let userData: UserType = {
                    id: id,
                    name: 'Guest User',
                    email: 'user@example.com',
                    plan: 'free',
                    provider: provider as any
                };

                if (provider === 'google') {
                    userData = { ...userData, name: 'Alex Johnson', email: 'alex.j@gmail.com', avatar: 'https://lh3.googleusercontent.com/a/ACg8ocIq8d1-123=s96-c' };
                } else if (provider === 'facebook') {
                    userData = { ...userData, name: 'Alex Johnson', email: 'alex.j@facebook.com', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/2048px-2021_Facebook_icon.svg.png' };
                } else {
                     userData = { ...userData, name: 'Alex J.', email: 'alex@icloud.com', avatar: `https://ui-avatars.com/api/?name=Alex+J&background=000&color=fff` };
                }

                onLogin(userData);
            }, 800);
        }, 1500);
    }, 2000);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthStage('verifying');

    setTimeout(() => {
      setAuthStage('success');
      setTimeout(() => {
        onLogin({
            id: 'email-' + Date.now(),
            name: isLogin ? (formData.email.split('@')[0]) : formData.name,
            email: formData.email,
            avatar: `https://ui-avatars.com/api/?name=${isLogin ? formData.email : formData.name}&background=3b82f6&color=fff`,
            plan: 'free',
            provider: 'email'
        });
      }, 800);
    }, 1500);
  };

  if (authStage === 'verifying' || authStage === 'success') {
      return (
          <div className="min-h-screen bg-[#050505] flex items-center justify-center font-sans">
              <div className="text-center animate-in fade-in zoom-in duration-300">
                  {authStage === 'verifying' ? (
                      <>
                        <div className="relative w-16 h-16 mx-auto mb-6">
                            <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <h2 className="text-xl text-white font-medium tracking-wide">Authenticating...</h2>
                        <p className="text-slate-500 mt-2 text-sm">Establishing secure connection</p>
                      </>
                  ) : (
                      <>
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={32} className="text-green-500" />
                        </div>
                        <h2 className="text-xl text-white font-medium tracking-wide">Access Granted</h2>
                        <p className="text-slate-500 mt-2 text-sm">Welcome back to PS AI Enterprise</p>
                      </>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* Left Panel - Branding */}
      <div className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-[#0a0a0a] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,_rgba(59,130,246,0.1),_transparent_40%)]"></div>
          
          <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-black">PS</div>
                  <span className="font-semibold text-white text-lg tracking-tight">Enterprise</span>
              </div>
              <h1 className="text-5xl font-bold text-white leading-tight mb-6">
                  Build the future<br />with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Superintelligence</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-md">
                  Access the world's most capable AI models including GPT-4o and Gemini 1.5 Pro in a secure, enterprise-grade environment.
              </p>
          </div>

          <div className="relative z-10 flex gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                  <Shield size={16} /> SOC2 Compliant
              </div>
              <div className="flex items-center gap-2">
                  <Globe size={16} /> Global Edge Network
              </div>
          </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-[#050505] relative">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.05),_transparent_70%)] pointer-events-none"></div>

         <div className="w-full max-w-md z-10">
            <div className="text-center md:text-left mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">{isLogin ? 'Welcome back' : 'Create an account'}</h2>
                <p className="text-slate-500">Enter your credentials to access the workspace</p>
            </div>

            <div className="space-y-4 mb-8">
                <button 
                    onClick={() => simulatePopupLogin('google')}
                    className="w-full flex items-center justify-center gap-3 bg-[#151515] hover:bg-[#202020] border border-[#252525] text-white py-3 rounded-xl transition-all font-medium text-sm group"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path></svg>
                    Continue with Google
                </button>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => simulatePopupLogin('facebook')}
                        className="flex items-center justify-center gap-2 bg-[#151515] hover:bg-[#202020] border border-[#252525] text-white py-3 rounded-xl transition-all font-medium text-sm"
                    >
                         <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.956-2.971 3.059v.912h5.28w.207 3.667h-5.082v7.981z"></path></svg>
                         Facebook
                    </button>
                    <button 
                        onClick={() => simulatePopupLogin('apple')}
                        className="flex items-center justify-center gap-2 bg-[#151515] hover:bg-[#202020] border border-[#252525] text-white py-3 rounded-xl transition-all font-medium text-sm"
                    >
                         <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.64 3.61-1.64 3.14.33 4.14 1.43 4.14 1.43-.07.03-3.06 1.76-3.06 5.51 0 3.81 3.16 5.4 3.16 5.4-2.83 5.4-4.57 6.42-6.66 6.42M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.18 2.26-1.66 4.18-3.74 4.25"/></svg>
                         Apple
                    </button>
                </div>
            </div>

            <div className="relative flex items-center py-2 mb-8">
                <div className="flex-grow border-t border-[#252525]"></div>
                <span className="flex-shrink-0 mx-4 text-xs text-[#555] uppercase tracking-wide font-medium">Or continue with email</span>
                <div className="flex-grow border-t border-[#252525]"></div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-5">
                {!isLogin && (
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 ml-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-[#101010] border border-[#252525] focus:border-blue-500/50 focus:bg-[#151515] rounded-xl px-4 py-3 text-white focus:outline-none transition-all placeholder-[#444] text-sm"
                            placeholder="John Doe"
                        />
                    </div>
                )}
                
                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400 ml-1">Email Address</label>
                    <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-[#101010] border border-[#252525] focus:border-blue-500/50 focus:bg-[#151515] rounded-xl px-4 py-3 text-white focus:outline-none transition-all placeholder-[#444] text-sm"
                        placeholder="name@company.com"
                    />
                </div>

                <div className="space-y-1 relative">
                    <label className="text-xs font-medium text-slate-400 ml-1">Password</label>
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-[#101010] border border-[#252525] focus:border-blue-500/50 focus:bg-[#151515] rounded-xl px-4 py-3 text-white focus:outline-none transition-all placeholder-[#444] text-sm"
                        placeholder="••••••••"
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-8 text-[#555] hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => setIsLogin(!isLogin)} className="text-blue-500 hover:underline font-medium">
                    {isLogin ? 'Sign up' : 'Log in'}
                </button>
            </p>
         </div>
      </div>
    </div>
  );
};

export default AuthPage;