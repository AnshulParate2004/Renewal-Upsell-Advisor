import { motion } from 'framer-motion';
import { BrainCircuit, Loader2 } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
  size?: 'default' | 'sm';
}


export function GenerateButton({ onClick, isLoading, disabled, size = 'default' }: GenerateButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      className={`
        relative ${size === 'default' ? 'w-full py-4 px-8 text-lg' : 'px-6 py-2.5 text-sm'}
        font-bold uppercase tracking-widest border-2 border-black
        bg-black text-white
        transition-all duration-300
        hover:bg-white hover:text-black
        ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-300 border-gray-400' : 'cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'}
        ${isLoading ? 'animate-none' : ''}
      `}
    >
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className={`${size === 'default' ? 'w-6 h-6' : 'w-4 h-4'} animate-spin`} />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <BrainCircuit className={`${size === 'default' ? 'w-6 h-6' : 'w-4 h-4'}`} />
            <span>Generate AI Analysis</span>
          </>
        )}
      </span>
    </motion.button>
  );
}
