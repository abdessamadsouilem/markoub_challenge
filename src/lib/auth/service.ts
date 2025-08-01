import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { users, type User } from '@/lib/db/schema';
import { hashPassword, verifyPassword } from './password';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, type JWTPayload } from './jwt';
import { NextRequest } from 'next/server';

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

export async function authenticateUser(username: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (user.length === 0) {
        throw new AuthenticationError('Invalid credentials');
    }

    const foundUser = user[0];
    const isValidPassword = await verifyPassword(password, foundUser.passwordHash);

    if (!isValidPassword) {
        throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = await generateAccessToken(foundUser);
    const refreshToken = await generateRefreshToken(foundUser);

    return {
        user: foundUser,
        accessToken,
        refreshToken,
    };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
        throw new AuthenticationError('Invalid refresh token');
    }

    // Verify user still exists
    const user = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

    if (user.length === 0) {
        throw new AuthenticationError('User no longer exists');
    }

    const foundUser = user[0];
    const newAccessToken = await generateAccessToken(foundUser);
    const newRefreshToken = await generateRefreshToken(foundUser);

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
}

export async function getAuthenticatedUser(request: NextRequest): Promise<JWTPayload> {
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('access_token')?.value;




    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {

        throw new AuthenticationError('No authentication token provided');
    }

    const payload = await verifyAccessToken(token);

    if (!payload) {

        throw new AuthenticationError('Invalid or expired token');
    }


    return payload;
}

export async function createUser(username: string, password: string, role: 'admin' | 'dispatcher' | 'viewer'): Promise<User> {
    const hashedPassword = await hashPassword(password);

    try {
        const newUser = await db.insert(users).values({
            username,
            passwordHash: hashedPassword,
            role,
        }).returning();

        return newUser[0];
    } catch (error: unknown) {
        console.error('Authentication error:', error);
        throw new AuthenticationError('Invalid credentials');
    }
}

export function requireRole(userRole: string, allowedRoles: string[]): void {
    if (!allowedRoles.includes(userRole)) {
        throw new AuthorizationError('Insufficient permissions');
    }
} 