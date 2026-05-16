import { useState } from 'react';
import { Shield, Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { Link } from 'react-router-dom';
import authBg from '../assets/auth-bg.png';

export default function Login() {
  const { login } = useAuth();
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

    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 font-sans relative overflow-hidden">
      {/* Enterprise Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={authBg} 
          alt="Operations Background" 
          className="w-full h-full object-cover opacity-20 brightness-[0.5]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent" />
      </div>

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl p-3 mb-2">
            <Shield size={32} className="text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">Staff Portal</h1>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">Operations Hub</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-xs font-bold text-center">
                Access Denied: {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  placeholder="name@peacecars.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 p-4 pl-12 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 p-4 pl-12 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white h-14 rounded-xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] mt-2 flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link to="/signup" className="text-xs font-bold text-slate-500 hover:text-blue-500 transition-all uppercase tracking-wider">
            Need an account? Request access
          </Link>
        </div>

        <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          © 2026 Peace Market Operations
        </p>
      </div>
    </div>
  );
}
