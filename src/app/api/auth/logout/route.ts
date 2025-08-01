import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
    const response = NextResponse.json({
        message: 'Logout successful',
    });

    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');

    return response;
} 