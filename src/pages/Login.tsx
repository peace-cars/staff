import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import authBg from '../assets/auth-bg.png';

interface LoginProps {
  onTransition?: () => void;
}

export default function Login({ onTransition }: LoginProps) {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await login(email, password);
    if (error) {
      setErrorMsg(error);
      setLoading(false);
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-bg-base font-sans relative overflow-hidden text-text-main transition-colors duration-300">
      {/* Enterprise Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={authBg} 
          alt="Operations Background" 
          className="w-full h-full object-cover opacity-15 brightness-[0.4] dark:brightness-[0.2]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/95 to-transparent" />
      </div>

      {/* Top Margin/Spacer for centering */}
      <div className="h-4" />

      <div className="w-full max-w-sm space-y-8 z-10">
        {/* Branding with Core Speedometer Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-primary-main/20 via-primary-main/5 to-transparent rounded-[2rem] p-4 shadow-xl border border-primary-main/15 backdrop-blur-md relative">
            <img src={logo} alt="PeaceCars Logo" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-primary-main/5 rounded-[2rem] blur-xl -z-10 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-text-main uppercase">Peace Cars</h1>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.25em]">Operations Control</p>
          </div>
        </div>

        {/* Form */}
        <div className="w-full space-y-5 z-10">
          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-[10px] font-bold text-center uppercase tracking-wider animate-shake">
                Access Denied: {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest ml-1">Registry Email</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-main transition-colors" />
                <input
                  type="email"
                  placeholder="name@peacecars.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-base border border-border-subtle p-3.5 pl-11 rounded-xl text-[13px] text-text-main font-medium focus:outline-none focus:border-primary-main transition-all placeholder:text-text-muted"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-main transition-colors" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-base border border-border-subtle p-3.5 pl-11 rounded-xl text-[13px] text-text-main font-medium focus:outline-none focus:border-primary-main transition-all placeholder:text-text-muted pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-main hover:bg-primary-main/90 text-white h-12 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-main/20 active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Authenticate</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle"></div>
              </div>
              <div className="relative bg-bg-base px-3 text-[9px] font-bold tracking-widest uppercase text-text-muted">
                Or
              </div>
            </div>

            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={loading}
              className="w-full bg-white text-gray-800 border border-gray-200 h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>
        </div>

        <div className="text-center">
          <button 
            type="button"
            onClick={() => {
              if (onTransition) onTransition();
              else navigate('/signup');
            }} 
            className="text-[10px] font-bold text-text-secondary hover:text-primary-main transition-all uppercase tracking-wider underline decoration-dotted"
          >
            Need access? Register here
          </button>
        </div>
      </div>

      {/* Corporate Footnote */}
      <p className="text-center text-[8px] text-text-muted font-bold uppercase tracking-[0.2em] z-10">
        © 2026 Peace Cars Inc. • Registry Hub v2.0
      </p>
    </div>
  );
}
