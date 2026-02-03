import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'Clients', path: '/clients', icon: <Users size={20} /> },
  { name: 'RevIQ Advisor', path: '/advisor', icon: <BrainCircuit size={20} /> },
  { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-[260px] h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-foreground tracking-tight text-base leading-tight">RevIQ</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Strategic Advisor</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-0 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 border-l-[3px]
                    ${isActive
                      ? 'bg-primary/5 text-primary border-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent'
                    }
                  `}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Status Footer */}
      <div className="border-t border-border bg-muted/10 p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/10" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">System Online</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last Sync:</span>
          <span className="font-mono text-foreground">Just now</span>
        </div>
      </div>
    </div>
  );
}
