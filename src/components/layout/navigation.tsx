'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { getRoleDisplayName } from '@/lib/utils';
import { User, Bus, Route, Calendar, LogOut, Menu } from 'lucide-react';

export default function Navigation() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigationItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: Calendar,
            show: true,
        },
        {
            name: 'Drivers',
            href: '/dashboard/drivers',
            icon: User,
            show: true,
        },
        {
            name: 'Buses',
            href: '/dashboard/buses',
            icon: Bus,
            show: true,
        },
        {
            name: 'Routes',
            href: '/dashboard/routes',
            icon: Route,
            show: true,
        },
        {
            name: 'Shifts',
            href: '/dashboard/shifts',
            icon: Calendar,
            show: true,
        },
    ];

    return (
        <nav className="bg-white shadow-sm border-b border-orange-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link
                                href="/dashboard"
                                className="text-xl font-bold text-orange-600 hover:text-orange-700 transition-colors"
                            >
                                🚌 Bus Scheduler
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navigationItems
                                .filter((item) => item.show)
                                .map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive
                                                    ? 'border-orange-500 text-orange-600'
                                                    : 'border-transparent text-gray-500 hover:border-orange-300 hover:text-orange-600'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4 mr-2" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                        </div>
                    </div>

                    <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                        {user && (
                            <div className="text-sm text-gray-700">
                                <span className="font-medium">{user.username}</span>
                                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                                    {getRoleDisplayName(user.role)}
                                </span>
                            </div>
                        )}
                        <Button
                            onClick={logout}
                            variant="outline"
                            size="sm"
                            className="flex items-center border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="sm:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        {navigationItems
                            .filter((item) => item.show)
                            .map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${isActive
                                                ? 'bg-orange-50 border-orange-500 text-orange-700'
                                                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <Icon className="w-5 h-5 mr-3" />
                                            {item.name}
                                        </div>
                                    </Link>
                                );
                            })}
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-200">
                        {user && (
                            <div className="px-4 py-2">
                                <div className="text-sm text-gray-700">
                                    <span className="font-medium">{user.username}</span>
                                    <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                                        {getRoleDisplayName(user.role)}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="px-4">
                            <Button
                                onClick={logout}
                                variant="outline"
                                size="sm"
                                className="w-full flex items-center justify-center border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
} 