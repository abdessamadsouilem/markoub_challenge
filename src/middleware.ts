import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';

const publicRoutes = ['/login', '/api/auth/login', '/api/auth/refresh'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect API routes, let pages handle their own auth
    if (!pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // Allow public API routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Extract token from authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('access_token')?.value;

    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else if (cookieToken) {
        token = cookieToken;
    }

    if (process.env.NODE_ENV === 'development') {
        console.log('Middleware - Token extracted:', token ? 'present' : 'missing');
    }

    if (!token) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }

    try {
        const payload = await verifyAccessToken(token);

        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('Middleware - Token verified successfully for user:', payload.username);
        }

        // Add user info to request headers for downstream handlers
        const response = NextResponse.next();
        response.headers.set('x-user-id', payload.userId.toString());
        response.headers.set('x-user-role', payload.role);
        response.headers.set('x-username', payload.username);

        return response;

    } catch (error) {
        console.error('Middleware - Unexpected token verification error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 401 }
        );
    }
}

export const config = {
    matcher: [
        '/api/:path*',
        // Exclude specific paths if needed
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};