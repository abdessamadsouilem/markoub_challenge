import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthenticationError } from '@/lib/auth/service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        return NextResponse.json({
            user: {
                id: user.userId,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        console.error('Get user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 