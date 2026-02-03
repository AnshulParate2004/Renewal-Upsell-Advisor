import { SVGProps } from 'react';

export const RevIQLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="shieldGradient" x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        {/* Outer Shield Stroke */}
        <path
            d="M20 4 C10 4 4 10 4 18 C4 28 12 36 20 39 C28 36 36 28 36 18 C36 10 30 4 20 4 Z"
            stroke="url(#shieldGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
        />

        {/* Inner Core */}
        <path
            d="M20 12 L15 18 L20 28 L25 18 Z"
            fill="url(#shieldGradient)"
            opacity="0.8"
        />

        {/* Tech Nodes */}
        <circle cx="20" cy="12" r="1.5" fill="#60A5FA" />
        <circle cx="15" cy="18" r="1.5" fill="#60A5FA" />
        <circle cx="25" cy="18" r="1.5" fill="#60A5FA" />
        <circle cx="20" cy="28" r="1.5" fill="#60A5FA" />
    </svg>
);

export const EmptyAccountIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="cardGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.4" />
            </linearGradient>
        </defs>

        {/* Background Card */}
        <rect x="20" y="30" width="60" height="40" rx="4" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />

        {/* Foreground Glass Card */}
        <rect x="30" y="20" width="40" height="60" rx="4" fill="url(#cardGradient)" stroke="#94A3B8" strokeWidth="2" opacity="0.9" />

        {/* Profile Lines */}
        <path d="M40 35 H60" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
        <path d="M40 45 H55" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
        <rect x="40" y="55" width="20" height="20" rx="2" fill="#E2E8F0" />

        {/* Magnifying Glass */}
        <circle cx="65" cy="65" r="12" stroke="#3B82F6" strokeWidth="3" fill="white" fillOpacity="0.5" />
        <path d="M74 74 L82 82" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

export const EmptyAnalysisIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="brainGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
        </defs>

        {/* Central Hub */}
        <circle cx="50" cy="50" r="15" stroke="url(#brainGradient)" strokeWidth="3" fill="#EEF2FF" />
        <circle cx="50" cy="50" r="6" fill="#4F46E5" />

        {/* Orbiting Nodes */}
        <circle cx="50" cy="20" r="4" fill="#A5B4FC" />
        <circle cx="80" cy="50" r="4" fill="#A5B4FC" />
        <circle cx="50" cy="80" r="4" fill="#A5B4FC" />
        <circle cx="20" cy="50" r="4" fill="#A5B4FC" />

        {/* Connections */}
        <path d="M50 35 L50 24" stroke="#C7D2FE" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M65 50 L76 50" stroke="#C7D2FE" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M50 65 L50 76" stroke="#C7D2FE" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M35 50 L24 50" stroke="#C7D2FE" strokeWidth="2" strokeDasharray="4 2" />

        {/* Pulse Effect Rings (Decorative) */}
        <circle cx="50" cy="50" r="25" stroke="#6366F1" strokeWidth="1" opacity="0.3" strokeDasharray="8 4" />
        <circle cx="50" cy="50" r="35" stroke="#6366F1" strokeWidth="1" opacity="0.1" />
    </svg>
);
