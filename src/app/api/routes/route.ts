import { NextRequest, NextResponse } from 'next/server';
import { ilike, or } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { routes } from '@/lib/db/schema';
import { getAuthenticatedUser, requireRole, AuthenticationError, AuthorizationError } from '@/lib/auth/service';
import { createRouteSchema, paginationSchema, searchSchema } from '@/lib/validations/entities';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        await getAuthenticatedUser(request);

        const { searchParams } = new URL(request.url);
        const { page, limit } = paginationSchema.parse(Object.fromEntries(searchParams));
        const { search } = searchSchema.parse(Object.fromEntries(searchParams));

        const offset = (page - 1) * limit;

        let whereCondition = undefined;
        if (search) {
            whereCondition = or(
                ilike(routes.origin, `%${search}%`),
                ilike(routes.destination, `%${search}%`)
            );
        }

        const results = whereCondition
            ? await db.select().from(routes).where(whereCondition).limit(limit).offset(offset)
            : await db.select().from(routes).limit(limit).offset(offset);

        return NextResponse.json({
            routes: results,
            pagination: {
                page,
                limit,
                total: results.length,
            },
        });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        console.error('Get routes error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        requireRole(user.role, ['admin', 'dispatcher']);

        const body = await request.json();
        const validatedData = createRouteSchema.parse(body);

        const newRoute = await db.insert(routes).values(validatedData).returning();

        return NextResponse.json({
            route: newRoute[0],
            message: 'Route created successfully',
        }, { status: 201 });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        console.error('Create route error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 