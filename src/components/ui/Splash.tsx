import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../lib/ThemeContext';
import logo from '../../assets/logo.png';

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const isLight = theme === 'light';

  // Dynamic styling based on light/dark mode
  const bgClass = isLight ? "bg-[#F8F9FA]" : "bg-black";
  const textClass = isLight ? "text-black" : "text-white";
  const subtextClass = isLight ? "text-black/60" : "text-white/40";
  
  // Panel color configurations:
  // - Light Mode: Panel 1 is Orange, Panel 2 is Black
  // - Dark Mode: Panel 1 is White, Panel 2 is Orange
  const panel1Color = isLight ? "bg-primary-main" : "bg-white";
  const panel2Color = isLight ? "bg-[#111111]" : "bg-primary-main";

  return (
    <div className={`fixed inset-0 ${bgClass} z-[999] flex flex-col items-center justify-center p-6 select-none overflow-hidden transition-colors duration-300`}>
      {/* Dynamic Sliding Panel 1 (Orange in Light, White in Dark) */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: ["-100%", "0%", "100%"] }}
        transition={{
          duration: 1.2,
          times: [0, 0.45, 1],
          ease: [0.76, 0, 0.24, 1]
        }}
        className={`absolute inset-0 ${panel1Color} z-[1001]`}
      />

      {/* Dynamic Sliding Panel 2 (Black in Light, Orange in Dark) */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: ["100%", "0%", "-100%"] }}
        transition={{
          duration: 1.3,
          times: [0, 0.5, 1],
          delay: 0.08,
          ease: [0.76, 0, 0.24, 1]
        }}
        className={`absolute inset-0 ${panel2Color} z-[1002]`}
      />

      {/* Corporate Logo & Branding Revealed behind the passing panels */}
      <div className="flex flex-col items-center max-w-xs space-y-5 z-[1000]">
        {/* Animated Speedometer Fluid Ribbon Logo */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [0.4, 1.1, 1], opacity: 1 }}
          transition={{ 
            delay: 0.55,
            type: "spring",
            stiffness: 140,
            damping: 14,
            duration: 1.0
          }}
          className={`relative w-20 h-20 rounded-[1.8rem] p-3.5 shadow-2xl flex items-center justify-center border ${
            isLight 
              ? "bg-white/80 border-black/5 shadow-black/5" 
              : "bg-gradient-to-tr from-primary-main/20 via-primary-main/5 to-transparent border-primary-main/20"
          }`}
        >
          <img src={logo} alt="PeaceCars Logo" className="w-full h-full object-contain" />
          <motion.div 
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className={`absolute inset-0 rounded-[1.8rem] blur-xl -z-10 ${
              isLight ? "bg-black/5" : "bg-primary-main/10"
            }`}
          />
        </motion.div>

        {/* Pulse Branding Title */}
        <div className="text-center space-y-1.5">
          <motion.h1
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.7 }}
            className={`text-lg font-black tracking-tight ${textClass} uppercase`}
          >
            Peace Cars
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.7 }}
            className={`text-[8.5px] font-bold ${subtextClass} uppercase tracking-[0.25em]`}
          >
            OPERATIONS HUB v2.0
          </motion.p>
        </div>
      </div>
    </div>
  );
}
