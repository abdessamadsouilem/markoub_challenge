import { NextRequest, NextResponse } from 'next/server';
import { ilike } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { buses } from '@/lib/db/schema';
import { getAuthenticatedUser, requireRole, AuthenticationError, AuthorizationError } from '@/lib/auth/service';
import { createBusSchema, paginationSchema, searchSchema } from '@/lib/validations/entities';

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
            whereCondition = ilike(buses.plateNumber, `%${search}%`);
        }

        const results = whereCondition
            ? await db.select().from(buses).where(whereCondition).limit(limit).offset(offset)
            : await db.select().from(buses).limit(limit).offset(offset);

        return NextResponse.json({
            buses: results,
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

        console.error('Get buses error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        requireRole(user.role, ['admin']);

        const body = await request.json();
        const validatedData = createBusSchema.parse(body);

        const newBus = await db.insert(buses).values(validatedData).returning();

        return NextResponse.json({
            bus: newBus[0],
            message: 'Bus created successfully',
        }, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        if (error instanceof Error && (error as { code?: string }).code === '23505') {
            return NextResponse.json({ error: 'Plate number already exists' }, { status: 409 });
        }

        console.error('Create bus error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 