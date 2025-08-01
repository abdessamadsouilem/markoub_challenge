import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { buses } from '@/lib/db/schema';
import { getAuthenticatedUser, requireRole, AuthenticationError, AuthorizationError } from '@/lib/auth/service';
import { updateBusSchema } from '@/lib/validations/entities';

export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await getAuthenticatedUser(request);

        const { id } = await params;
        const busId = parseInt(id);
        if (isNaN(busId)) {
            return NextResponse.json({ error: 'Invalid bus ID' }, { status: 400 });
        }

        const bus = await db.select().from(buses).where(eq(buses.id, busId)).limit(1);

        if (bus.length === 0) {
            return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
        }

        return NextResponse.json({ bus: bus[0] });
    } catch (error: unknown) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        console.error('Get bus error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request);
        requireRole(user.role, ['admin']);
        const { id: idParam } = await params;

        const id = parseInt(idParam);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid bus ID' }, { status: 400 });
        }

        const body = await request.json();
        const validatedData = updateBusSchema.parse(body);

        const updatedBus = await db
            .update(buses)
            .set(validatedData)
            .where(eq(buses.id, id))
            .returning();

        if (updatedBus.length === 0) {
            return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
        }

        return NextResponse.json({
            bus: updatedBus[0],
            message: 'Bus updated successfully',
        });
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

        if (error instanceof Error && (error as { code?: string }).code === '23505') {
            return NextResponse.json({ error: 'Plate number already exists' }, { status: 409 });
        }

        console.error('Update bus error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request);
        requireRole(user.role, ['admin']);
        const { id: idParam } = await params;

        const id = parseInt(idParam);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid bus ID' }, { status: 400 });
        }

        const deletedBus = await db
            .delete(buses)
            .where(eq(buses.id, id))
            .returning();

        if (deletedBus.length === 0) {
            return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Bus deleted successfully',
        });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('Delete bus error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 