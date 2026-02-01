import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { motion } from 'framer-motion';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="ml-[260px] min-h-screen relative"
      >
        <div className="sticky top-0 z-40 w-full h-16 px-8 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">RevIQ</span>
            <span>/</span>
            <span>Strategic Advisor</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-400 border border-white/10" />
          </div>
        </div>
        <div className="p-8">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
