import { SignJWT, jwtVerify, decodeJwt, type JWTPayload as JoseJWTPayload } from 'jose';
import { User } from '@/lib/db/schema';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be set');
}

if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET must be set');
}

if (JWT_SECRET === JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
}

const ISSUER = 'markoub-challenge';
const AUDIENCE = 'markoub-challenge-users';

export interface JWTPayload {
    userId: number;
    username: string;
    role: 'admin' | 'dispatcher' | 'viewer';
}

export interface TokenVerificationResult {
    payload: JWTPayload | null;
    error?: 'expired' | 'invalid' | 'malformed';
}

// Encode secrets once at module load
const accessSecret = new TextEncoder().encode(JWT_SECRET);
const refreshSecret = new TextEncoder().encode(JWT_REFRESH_SECRET);

export async function generateAccessToken(user: User): Promise<string> {
    const payload = {
        userId: user.id,
        username: user.username,
        role: user.role,
    };

    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .sign(accessSecret);
}

export async function generateRefreshToken(user: User): Promise<string> {
    const payload = {
        userId: user.id,
        username: user.username,
        role: user.role,
    };

    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .sign(refreshSecret);
}

function validatePayload(payload: JoseJWTPayload): JWTPayload | null {
    if (
        typeof payload.userId === 'number' &&
        typeof payload.username === 'string' &&
        typeof payload.role === 'string' &&
        ['admin', 'dispatcher', 'viewer'].includes(payload.role)
    ) {
        return {
            userId: payload.userId,
            username: payload.username,
            role: payload.role as 'admin' | 'dispatcher' | 'viewer'
        };
    }
    return null;
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, accessSecret, {
            issuer: ISSUER,
            audience: AUDIENCE,
        });

        return validatePayload(payload);
    } catch {
        return null;
    }
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, refreshSecret, {
            issuer: ISSUER,
            audience: AUDIENCE,
        });

        return validatePayload(payload);
    } catch {
        return null;
    }
}

export async function verifyAccessTokenDetailed(token: string): Promise<TokenVerificationResult> {
    try {
        const { payload } = await jwtVerify(token, accessSecret, {
            issuer: ISSUER,
            audience: AUDIENCE,
        });

        const validatedPayload = validatePayload(payload);
        if (!validatedPayload) {
            return { payload: null, error: 'invalid' };
        }

        return { payload: validatedPayload };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('expired')) {
                return { payload: null, error: 'expired' };
            } else if (error.message.includes('invalid')) {
                return { payload: null, error: 'invalid' };
            }
        }
        return { payload: null, error: 'malformed' };
    }
}

export function decodeToken(token: string): JWTPayload | null {
    try {
        const decoded = decodeJwt(token);
        return validatePayload(decoded);
    } catch {
        if (process.env.NODE_ENV === 'development') {
            console.error('Token decode failed');
        }
        return null;
    }
}

export function getTokenExpiration(token: string): Date | null {
    try {
        const decoded = decodeJwt(token);
        if (decoded?.exp && typeof decoded.exp === 'number') {
            return new Date(decoded.exp * 1000);
        }
        return null;
    } catch {
        return null;
    }
}

export function isTokenExpired(token: string): boolean {
    const expiration = getTokenExpiration(token);
    if (!expiration) return true;
    return expiration < new Date();
}