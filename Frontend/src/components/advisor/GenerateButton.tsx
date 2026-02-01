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
        relative ${size === 'default' ? 'w-full py-5 px-8 rounded-2xl text-lg' : 'px-4 py-2.5 rounded-xl text-sm'}
        font-semibold
        bg-gradient-to-r from-primary via-blue-500 to-primary
        bg-[length:200%_100%]
        text-white
        transition-all duration-500
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer pulse-glow'}
        ${isLoading ? 'animate-none' : 'hover:bg-[position:100%_0]'}
      `}
      style={{
        boxShadow: !disabled && !isLoading ?
          '0 0 30px hsl(217 91% 60% / 0.4), 0 0 60px hsl(217 91% 60% / 0.2), inset 0 1px 0 hsl(217 91% 70% / 0.3)' :
          'none'
      }}
    >
      {/* Animated background */}
      {!disabled && !isLoading && (
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-50"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, hsl(217 91% 70% / 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, hsl(217 91% 70% / 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, hsl(217 91% 70% / 0.3) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}

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

      {/* Ripple effect on hover */}
      {!disabled && !isLoading && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          initial={false}
          whileHover={{
            boxShadow: '0 0 40px hsl(217 91% 60% / 0.5)',
          }}
        />
      )}
    </motion.button>
  );
}
