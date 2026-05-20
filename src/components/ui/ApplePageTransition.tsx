import { motion } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ApplePageTransitionProps {
  children: React.ReactNode;
  backPath?: string;
}

export function ApplePageTransition({ children, backPath }: ApplePageTransitionProps) {
  const navigate = useNavigate();

  const handleDragEnd = (event: any, info: PanInfo) => {
    // Navigate back if swiped right by more than 120px with sufficient velocity
    if (info.offset.x > 120 && backPath) {
      navigate(backPath);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0.95 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0.95 }}
      transition={{ 
        type: "spring",
        stiffness: 380,
        damping: 34,
        mass: 0.9
      }}
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.4 }}
      onDragEnd={handleDragEnd}
      className="min-h-screen bg-bg-base relative touch-pan-y overflow-x-hidden flex flex-col"
    >
      {children}
    </motion.div>
  );
}
