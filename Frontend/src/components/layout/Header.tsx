import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BrainCircuit,
    Settings,
    BarChart2
} from 'lucide-react';
import { RevIQLogo } from '@/components/ui/CustomIcons';

interface NavItem {
    name: string;
    path: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart2 size={16} /> },
    { name: 'Clients', path: '/clients', icon: <Users size={16} /> },
    { name: 'Advisors', path: '/advisor', icon: <BrainCircuit size={16} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={16} /> },
];

export function Header() {
    const location = useLocation();

    return (
        <div className="h-14 bg-white border-b-2 border-black flex items-stretch fixed top-0 w-full z-50">
            {/* Logo Section - Keeping it white/clean but bordered */}
            <div className="w-64 flex items-center gap-3 px-6 border-r-2 border-black bg-white shrink-0">
                <div className="w-6 h-6 flex items-center justify-center text-black">
                    <RevIQLogo className="w-full h-full" />
                </div>
                <div>
                    <h1 className="font-bold text-black tracking-tight text-sm leading-none">RevIQ</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Strategic Advisor</p>
                </div>
            </div>

            {/* Navigation Tabs - The NBA Style Strip */}
            <nav className="flex-1 flex items-stretch">
                <ul className="flex items-stretch w-full divide-x-2 divide-black border-r-2 border-black">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <li key={item.path} className="flex-1">
                                <Link
                                    to={item.path}
                                    className={`
                                        flex items-center justify-center gap-2 w-full h-full text-sm font-bold uppercase tracking-wider transition-all
                                        ${isActive
                                            ? 'bg-black text-white'
                                            : 'bg-white text-black hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <span className={isActive ? 'text-white' : 'text-black'}>
                                        {item.icon}
                                    </span>
                                    <span>{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Status Section - Right aligned cell */}
            <div className="w-48 flex items-center justify-center bg-white px-6 shrink-0">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black/10 bg-gray-50">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">System Online</span>
                </div>
            </div>
        </div>
    );
}
