import { NextRequest } from 'next/server';

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private requests: Map<string, RateLimitEntry> = new Map();
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
        this.startCleanup();
    }

    private getClientIdentifier(request: NextRequest): string {
        const forwardedFor = request.headers.get('x-forwarded-for');
        return forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    }

    private getKey(identifier: string, endpoint: string): string {
        return `${identifier}:${endpoint}`;
    }

    checkLimit(request: NextRequest, endpoint: string): boolean {
        const identifier = this.getClientIdentifier(request);
        const key = this.getKey(identifier, endpoint);
        const now = Date.now();

        const entry = this.requests.get(key);
        if (!entry) {
            this.requests.set(key, { count: 1, resetTime: now + this.config.windowMs });
            return true;
        }

        if (now > entry.resetTime) {
            this.requests.set(key, { count: 1, resetTime: now + this.config.windowMs });
            return true;
        }

        if (entry.count >= this.config.maxRequests) {
            return false;
        }

        entry.count++;
        return true;
    }

    private startCleanup(): void {
        setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.requests.entries()) {
                if (now > entry.resetTime) {
                    this.requests.delete(key);
                }
            }
        }, 60000);
    }

    cleanup(): void {
        this.requests.clear();
    }
}

export const authRateLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
});

export const apiRateLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
}); 