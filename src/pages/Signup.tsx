import { useState } from 'react';
import { Shield, ArrowRight, Eye, EyeOff, Mail, Phone, User, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import authBg from '../assets/auth-bg.png';

interface SignupProps {
  onTransition?: () => void;
}

export default function Signup({ onTransition }: SignupProps) {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await signup(email, password, fullName, phone);
    if (error) {
      setErrorMsg(error);
      setLoading(false);
      return;
    }
    navigate('/');
  };

  const InputField = ({ label, icon: Icon, ...props }: any) => (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-main transition-colors" />}
        <input
          {...props}
          className="w-full bg-bg-base border border-border-subtle p-3 pl-11 rounded-xl text-[13px] text-text-main font-medium focus:outline-none focus:border-primary-main transition-all placeholder:text-text-muted"
        />
      </div>
    </div>
  );

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

      <div className="w-full max-w-sm space-y-6 z-10">
        {/* Branding with Core Speedometer Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-primary-main/20 via-primary-main/5 to-transparent rounded-[1.6rem] p-3 shadow-xl border border-primary-main/15 backdrop-blur-md relative">
            <img src={logo} alt="PeaceCars Logo" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-primary-main/5 rounded-[1.6rem] blur-xl -z-10 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black tracking-tight text-text-main uppercase leading-none">Register Associate</h1>
            <p className="text-[9px] text-text-secondary font-bold uppercase tracking-[0.25em] mt-1">Staff Provisioning Hub</p>
          </div>
        </div>

        {/* Native Form Frame */}
        <div className="bg-surface-card border border-border-subtle rounded-3xl p-5 shadow-2xl relative">
          <form onSubmit={handleSignup} className="space-y-4">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-[10px] font-bold text-center uppercase tracking-wider animate-shake">
                {errorMsg}
              </div>
            )}

            <InputField
              label="Legal Name"
              type="text"
              icon={User}
              placeholder="Dawit Abraham"
              value={fullName}
              onChange={(e: any) => setFullName(e.target.value)}
              required
            />
            <InputField
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="name@peacecars.com"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
            />
            <InputField
              label="Phone Number"
              type="tel"
              icon={Phone}
              placeholder="+251 ..."
              value={phone}
              onChange={(e: any) => setPhone(e.target.value)}
              required
            />
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-main transition-colors" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-base border border-border-subtle p-3 pl-11 rounded-xl text-[13px] text-text-main font-medium focus:outline-none focus:border-primary-main transition-all placeholder:text-text-muted pr-11"
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
              className="w-full bg-primary-main hover:bg-primary-main/90 text-white h-12 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-main/20 active:scale-[0.98] mt-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              if (onTransition) onTransition();
              else navigate('/login');
            }}
            className="text-[10px] font-bold text-text-secondary hover:text-primary-main transition-all uppercase tracking-wider underline decoration-dotted"
          >
            Already registered? Sign In
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
