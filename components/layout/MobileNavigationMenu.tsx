'use client';

import React from 'react';
import { 
    PenTool, 
    Film, 
    LayoutGrid, 
    CalendarDays, 
    Users, 
    Network, 
    MapPin, 
    X,
    Sparkles
} from 'lucide-react';

interface MobileNavigationMenuProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: string;
    onNavigate: (view: string) => void;
}

export default function MobileNavigationMenu({ 
    isOpen, 
    onClose, 
    currentView, 
    onNavigate 
}: MobileNavigationMenuProps) {
    
    const handleItemClick = (path: string) => {
        onNavigate(path);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    const menuItems = [
        {
            id: 'editor',
            name: 'Editor',
            icon: PenTool,
            color: 'from-[#DC143C] to-[#8B0000]',
            bgColor: 'bg-[#DC143C]/10',
        },
        {
            id: 'storybeats-board',
            name: 'Storybeats',
            icon: LayoutGrid,
            color: 'from-[#00D9FF] to-[#0099CC]',
            bgColor: 'bg-[#00D9FF]/10',
        },
        {
            id: 'timeline',
            name: 'Timeline',
            icon: CalendarDays,
            color: 'from-[#DC143C] to-[#8B0000]',
            bgColor: 'bg-[#DC143C]/10',
        },
        {
            id: 'cast-board',
            name: 'Characters',
            icon: Users,
            color: 'from-[#00D9FF] to-[#0099CC]',
            bgColor: 'bg-[#00D9FF]/10',
        },
        {
            id: 'cast-map',
            name: 'Relationships',
            icon: Network,
            color: 'from-[#FFD700] to-[#FFA500]',
            bgColor: 'bg-[#FFD700]/10',
        },
        {
            id: 'sets',
            name: 'Locations',
            icon: MapPin,
            color: 'from-[#10B981] to-[#059669]',
            bgColor: 'bg-[#10B981]/10',
        },
    ];

    return (
        <>
            {/* Backdrop with blur */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden z-[100]"
                onClick={onClose}
                style={{
                    animation: 'fadeIn 200ms ease-out'
                }}
            />
            
            {/* Side Panel */}
            <div
                className="fixed inset-y-0 left-0 w-80 max-w-[85vw] shadow-2xl md:hidden z-[101] bg-[#141414]"
                style={{
                    animation: 'slideInFromLeft 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                {/* Header with Gradient */}
                <div className="relative bg-gradient-to-br from-[#DC143C] via-[#8B0000] to-[#DC143C] p-6 pb-8">
                    {/* Decorative pattern overlay */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                            backgroundSize: '24px 24px'
                        }} />
                    </div>
                    
                    <div className="relative flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-6 h-6 text-base-content" />
                                <h2 className="text-2xl font-bold text-base-content">
                                    Views
                                </h2>
                            </div>
                            <p className="text-sm text-base-content/80">
                                Switch between editing modes
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/20 transition-all active:scale-95 backdrop-blur-sm"
                        >
                            <X className="w-6 h-6 text-base-content" />
                        </button>
                    </div>
                </div>

                {/* Navigation Content */}
                <div className="p-4 overflow-y-auto bg-[#0A0A0A]" style={{ height: 'calc(100vh - 140px)' }}>
                    <div className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentView === item.id;
                            
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleItemClick(item.id)}
                                    className={`
                                        w-full group relative overflow-hidden
                                        rounded-xl transition-all duration-200
                                        ${isActive 
                                            ? 'shadow-lg scale-[1.02]' 
                                            : 'hover:scale-[1.01] hover:shadow-md active:scale-[0.98]'
                                        }
                                    `}
                                >
                                    {/* Background */}
                                    <div className={`
                                        p-4 flex items-center gap-4
                                        ${isActive 
                                            ? 'bg-gradient-to-r ' + item.color 
                                            : item.bgColor + ' border border-white/10'
                                        }
                                    `}>
                                        {/* Icon Container */}
                                        <div className={`
                                            w-12 h-12 rounded-lg flex items-center justify-center
                                            transition-transform duration-200
                                            ${isActive 
                                                ? 'bg-white/20 backdrop-blur-sm' 
                                                : 'bg-white dark:bg-slate-800 group-hover:scale-110'
                                            }
                                        `}>
                                            <Icon className={`
                                                w-6 h-6
                                                ${isActive 
                                                    ? 'text-base-content' 
                                                    : 'text-slate-700 dark:text-slate-300'
                                                }
                                            `} />
                                        </div>
                                        
                                        {/* Text */}
                                        <div className="flex-1 text-left">
                                            <div className={`
                                                font-semibold text-base
                                                ${isActive 
                                                    ? 'text-base-content' 
                                                    : 'text-slate-900 dark:text-slate-100'
                                                }
                                            `}>
                                                {item.name}
                                            </div>
                                            {isActive && (
                                                <div className="text-xs text-base-content/80 mt-0.5">
                                                    Currently active
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Arrow indicator */}
                                        {isActive && (
                                            <div className="text-base-content">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInFromLeft {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </>
    );
}

