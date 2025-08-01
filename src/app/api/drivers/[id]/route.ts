import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { drivers } from '@/lib/db/schema';
import { getAuthenticatedUser, requireRole, AuthenticationError, AuthorizationError } from '@/lib/auth/service';
import { updateDriverSchema } from '@/lib/validations/entities';

export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await getAuthenticatedUser(request);

        const { id } = await params;
        const driverId = parseInt(id);
        if (isNaN(driverId)) {
            return NextResponse.json({ error: 'Invalid driver ID' }, { status: 400 });
        }

        const driver = await db.select().from(drivers).where(eq(drivers.id, driverId)).limit(1);

        if (driver.length === 0) {
            return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }

        return NextResponse.json({ driver: driver[0] });
    } catch (error: unknown) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        console.error('Get driver error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request);
        requireRole(user.role, ['admin', 'dispatcher']);
        const { id: idParam } = await params;

        const id = parseInt(idParam);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid driver ID' }, { status: 400 });
        }

        const body = await request.json();
        const validatedData = updateDriverSchema.parse(body);

        const updatedDriver = await db
            .update(drivers)
            .set(validatedData)
            .where(eq(drivers.id, id))
            .returning();

        if (updatedDriver.length === 0) {
            return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }

        return NextResponse.json({
            driver: updatedDriver[0],
            message: 'Driver updated successfully',
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
            return NextResponse.json({ error: 'License number already exists' }, { status: 409 });
        }

        console.error('Update driver error:', error);
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
            return NextResponse.json({ error: 'Invalid driver ID' }, { status: 400 });
        }

        const deletedDriver = await db
            .delete(drivers)
            .where(eq(drivers.id, id))
            .returning();

        if (deletedDriver.length === 0) {
            return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Driver deleted successfully',
        });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('Delete driver error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 