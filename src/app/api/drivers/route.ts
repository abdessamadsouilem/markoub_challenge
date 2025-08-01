import { NextRequest, NextResponse } from 'next/server';
import { and, ilike, or, count } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { drivers } from '@/lib/db/schema';
import { getAuthenticatedUser, requireRole, AuthenticationError, AuthorizationError } from '@/lib/auth/service';
import { createDriverSchema, paginationSchema, searchSchema } from '@/lib/validations/entities';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        await getAuthenticatedUser(request);

        const { searchParams } = new URL(request.url);
        const { page, limit } = paginationSchema.parse(Object.fromEntries(searchParams));
        const { search } = searchSchema.parse(Object.fromEntries(searchParams));

        const offset = (page - 1) * limit;

        const conditions = [];

        if (search) {
            conditions.push(or(
                ilike(drivers.name, `%${search}%`),
                ilike(drivers.licenseNumber, `%${search}%`)
            ));
        }

        // Get total count
        const totalCount = await db
            .select({ count: count() })
            .from(drivers)
            .where(conditions.length > 0 ? and(...conditions) : undefined);

        // Get results
        const results = conditions.length > 0
            ? await db.select().from(drivers).where(and(...conditions)).limit(limit).offset(offset)
            : await db.select().from(drivers).limit(limit).offset(offset);

        const response = {
            drivers: results,
            pagination: {
                page,
                limit,
                total: totalCount[0]?.count || 0,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        console.error('Get drivers error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        requireRole(user.role, ['admin', 'dispatcher']);

        const body = await request.json();
        const validatedData = createDriverSchema.parse(body);

        const newDriver = await db.insert(drivers).values(validatedData).returning();

        return NextResponse.json({
            driver: newDriver[0],
            message: 'Driver created successfully',
        }, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        if (error instanceof Error && (error as { code?: string }).code === '23505') {
            return NextResponse.json({ error: 'License number already exists' }, { status: 409 });
        }

        console.error('Create driver error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 