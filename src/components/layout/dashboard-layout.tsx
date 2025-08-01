'use client';

import Navigation from './navigation';
import { Toaster } from 'react-hot-toast';
import AuthGuard from '../auth-guard';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <AuthGuard>
            <Toaster position="top-right" />
            <div className="min-h-screen bg-orange-50">
                <Navigation />
                <main className="py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
} 