import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, AlertTriangle, Mail, Copy, Check, Sparkles } from 'lucide-react';
import type { AdvisorInsight } from '@/lib/api';

interface AIInsightPanelProps {
  insight: AdvisorInsight | null;
  isLoading: boolean;
}

export function AIInsightPanel({ insight, isLoading }: AIInsightPanelProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    if (insight?.notification) {
      setDisplayedText('');
      setShowEmail(false);
      let index = 0;
      const text = insight.notification;
      
      const timer = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
          setTimeout(() => setShowEmail(true), 300);
        }
      }, 20);

      return () => clearInterval(timer);
    }
  }, [insight?.notification]);

  const handleCopy = async () => {
    if (insight?.email_draft) {
      await navigator.clipboard.writeText(insight.email_draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!insight && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-6 h-full flex items-center justify-center"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
            <BrainCircuit className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Generate an AI analysis to view insights</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-6 h-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center glow-primary">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI Analysis</h3>
          <p className="text-xs text-muted-foreground">Powered by S-007 Intelligence</p>
        </div>
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">Analyzing account data...</span>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-4 bg-muted/50 rounded animate-pulse"
                  style={{ width: `${100 - i * 20}%` }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {insight && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Alert Box */}
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {displayedText}
                    {displayedText.length < (insight.notification?.length || 0) && (
                      <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse" />
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Draft */}
            <AnimatePresence>
              {showEmail && (
                <motion.div
                  initial={{ opacity: 0, y: 20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Suggested Email Draft</span>
                    </div>
                    <motion.button
                      onClick={handleCopy}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check size={14} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy
                        </>
                      )}
                    </motion.button>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                      {insight.email_draft}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
