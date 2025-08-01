import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, AuthenticationError } from '@/lib/auth/service';
import { loginSchema } from '@/lib/validations/auth';
import { authRateLimiter } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const rateLimitAllowed = authRateLimiter.checkLimit(request, 'login');
        if (!rateLimitAllowed) {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const validatedData = loginSchema.parse(body);

        const { user, accessToken, refreshToken } = await authenticateUser(
            validatedData.username,
            validatedData.password
        );

        const response = NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
            message: 'Login successful',
        });

        response.cookies.set('access_token', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60,
        });

        response.cookies.set('refresh_token', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
        });

        return response;
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid input data' },
                { status: 400 }
            );
        }

        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 