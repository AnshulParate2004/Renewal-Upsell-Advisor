import { Header } from './Header';
import { motion } from 'framer-motion';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col">
      <Header />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 mt-16 relative bg-background"
      >
        {children}
      </motion.main>
    </div>
  );
}
