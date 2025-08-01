import { NextRequest, NextResponse } from 'next/server';
import { eq, and, not } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { shifts, drivers, buses, routes } from '@/lib/db/schema';
import { getAuthenticatedUser, requireRole, AuthenticationError, AuthorizationError } from '@/lib/auth/service';
import { updateShiftSchema } from '@/lib/validations/entities';

export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await getAuthenticatedUser(request);

        const { id } = await params;
        const shiftId = parseInt(id);
        if (isNaN(shiftId)) {
            return NextResponse.json({ error: 'Invalid shift ID' }, { status: 400 });
        }

        const shift = await db
            .select({
                id: shifts.id,
                shiftDate: shifts.shiftDate,
                shiftTime: shifts.shiftTime,
                createdAt: shifts.createdAt,
                driver: {
                    id: drivers.id,
                    name: drivers.name,
                    licenseNumber: drivers.licenseNumber,
                    available: drivers.available,
                },
                bus: {
                    id: buses.id,
                    plateNumber: buses.plateNumber,
                    capacity: buses.capacity,
                },
                route: {
                    id: routes.id,
                    origin: routes.origin,
                    destination: routes.destination,
                    estimatedDurationMinutes: routes.estimatedDurationMinutes,
                },
            })
            .from(shifts)
            .leftJoin(drivers, eq(shifts.driverId, drivers.id))
            .leftJoin(buses, eq(shifts.busId, buses.id))
            .leftJoin(routes, eq(shifts.routeId, routes.id))
            .where(eq(shifts.id, shiftId))
            .limit(1);

        if (shift.length === 0) {
            return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
        }

        return NextResponse.json({ shift: shift[0] });
    } catch (error: unknown) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        console.error('Get shift error:', error);
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
            return NextResponse.json({ error: 'Invalid shift ID' }, { status: 400 });
        }

        const body = await request.json();
        const validatedData = updateShiftSchema.parse(body);

        if (validatedData.driverId && validatedData.shiftDate && validatedData.shiftTime) {
            const existingShifts = await db
                .select()
                .from(shifts)
                .where(
                    and(
                        eq(shifts.driverId, validatedData.driverId),
                        eq(shifts.shiftDate, validatedData.shiftDate),
                        eq(shifts.shiftTime, validatedData.shiftTime),
                        // Exclude current shift from conflict check
                        not(eq(shifts.id, id))
                    )
                );

            if (existingShifts.length > 0) {
                return NextResponse.json(
                    { error: 'Driver already has a shift at this date and time' },
                    { status: 409 }
                );
            }
        }

        if (validatedData.busId && validatedData.shiftDate && validatedData.shiftTime) {
            const busConflict = await db
                .select()
                .from(shifts)
                .where(
                    and(
                        eq(shifts.busId, validatedData.busId),
                        eq(shifts.shiftDate, validatedData.shiftDate),
                        eq(shifts.shiftTime, validatedData.shiftTime),
                        // Exclude current shift from conflict check
                        not(eq(shifts.id, id))
                    )
                );

            if (busConflict.length > 0) {
                return NextResponse.json(
                    { error: 'Bus is already assigned at this date and time' },
                    { status: 409 }
                );
            }
        }

        const updatedShift = await db
            .update(shifts)
            .set(validatedData)
            .where(eq(shifts.id, id))
            .returning();

        if (updatedShift.length === 0) {
            return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
        }

        return NextResponse.json({
            shift: updatedShift[0],
            message: 'Shift updated successfully',
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
            return NextResponse.json({ error: 'Shift constraint violation' }, { status: 409 });
        }

        console.error('Update shift error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request);
        requireRole(user.role, ['admin', 'dispatcher']);
        const { id: idParam } = await params;

        const id = parseInt(idParam);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid shift ID' }, { status: 400 });
        }

        const deletedShift = await db
            .delete(shifts)
            .where(eq(shifts.id, id))
            .returning();

        if (deletedShift.length === 0) {
            return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Shift deleted successfully',
        });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('Delete shift error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 