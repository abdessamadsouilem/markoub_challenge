import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatTime(time: string): string {
    return time;
}

export function formatDateTime(date: string, time: string): string {
    return `${formatDate(date)} at ${formatTime(time)}`;
}

export function getRoleDisplayName(role: string): string {
    switch (role) {
        case 'admin':
            return 'Administrator';
        case 'dispatcher':
            return 'Dispatcher';
        case 'viewer':
            return 'Viewer';
        default:
            return role;
    }
}

export function canUserPerformAction(userRole: string, action: 'create' | 'edit' | 'delete', resource: string): boolean {
    if (userRole === 'admin') return true;
    if (userRole === 'viewer') return false;

    if (userRole === 'dispatcher') {
        if (action === 'delete' && (resource === 'users' || resource === 'buses')) {
            return false;
        }
        return action !== 'delete';
    }

    return false;
} 