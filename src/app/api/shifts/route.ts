import { NextRequest, NextResponse } from 'next/server';
import { eq, and, or, gte, lte, not, ilike } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { shifts, drivers, buses, routes } from '@/lib/db/schema';
import { getAuthenticatedUser, requireRole, AuthenticationError, AuthorizationError } from '@/lib/auth/service';
import { createShiftSchema, paginationSchema, dateFilterSchema, searchSchema } from '@/lib/validations/entities';

export const runtime = 'nodejs';

function hasTimeOverlap(start1: string, duration1: number, start2: string, duration2: number, bufferMinutes: number = 120): boolean {
    const start1Minutes = timeToMinutes(start1);
    const end1Minutes = start1Minutes + duration1;
    const start2Minutes = timeToMinutes(start2);
    const end2Minutes = start2Minutes + duration2;

    const adjustedEnd1 = end1Minutes + bufferMinutes;
    const adjustedEnd2 = end2Minutes + bufferMinutes;

    return start1Minutes < adjustedEnd2 && start2Minutes < adjustedEnd1;
}

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

async function calculateTravelTime(fromCity: string, toCity: string): Promise<number> {
    const exactRoute = await db
        .select({ estimatedDurationMinutes: routes.estimatedDurationMinutes })
        .from(routes)
        .where(
            and(
                eq(routes.origin, fromCity),
                eq(routes.destination, toCity)
            )
        )
        .limit(1);

    if (exactRoute.length > 0) {
        return exactRoute[0].estimatedDurationMinutes;
    }

    const reverseRoute = await db
        .select({ estimatedDurationMinutes: routes.estimatedDurationMinutes })
        .from(routes)
        .where(
            and(
                eq(routes.origin, toCity),
                eq(routes.destination, fromCity)
            )
        )
        .limit(1);

    if (reverseRoute.length > 0) {
        return reverseRoute[0].estimatedDurationMinutes;
    }

    const similarRoutes = await db
        .select({ estimatedDurationMinutes: routes.estimatedDurationMinutes })
        .from(routes)
        .where(
            or(
                eq(routes.origin, fromCity),
                eq(routes.destination, toCity)
            )
        )
        .limit(5);

    if (similarRoutes.length > 0) {
        const avgDuration = similarRoutes.reduce((sum, route) => sum + route.estimatedDurationMinutes, 0) / similarRoutes.length;
        return Math.round(avgDuration);
    }

    return 240;
}

async function checkGeographicConflict(
    existingShift: { routeId: number; shiftTime: string },
    newShiftTime: string,
    newRouteId: number,
    routeDuration: number,
    isDriver: boolean
): Promise<{ hasConflict: boolean; error?: string; details?: unknown }> {
    const existingRouteDetails = await db
        .select({ origin: routes.origin, destination: routes.destination })
        .from(routes)
        .where(eq(routes.id, existingShift.routeId))
        .limit(1);

    const newRouteDetails = await db
        .select({ origin: routes.origin, destination: routes.destination })
        .from(routes)
        .where(eq(routes.id, newRouteId))
        .limit(1);

    if (existingRouteDetails.length > 0 && newRouteDetails.length > 0) {
        const existingRoute = await db
            .select({ estimatedDurationMinutes: routes.estimatedDurationMinutes })
            .from(routes)
            .where(eq(routes.id, existingShift.routeId))
            .limit(1);

        if (existingRoute.length > 0) {
            const existingDuration = existingRoute[0].estimatedDurationMinutes;
            const existingEndTime = timeToMinutes(existingShift.shiftTime) + existingDuration;
            const newStartTime = timeToMinutes(newShiftTime);
            const timeBetween = newStartTime - existingEndTime;

            if (timeBetween > 0) {
                const isSameCity = existingRouteDetails[0].destination === newRouteDetails[0].origin;

                if (!isSameCity) {
                    const travelTime = await calculateTravelTime(
                        existingRouteDetails[0].destination,
                        newRouteDetails[0].origin
                    );

                    if (timeBetween < travelTime) {
                        const entityType = isDriver ? 'Driver' : 'Bus';
                        return {
                            hasConflict: true,
                            error: `${entityType} cannot travel from ${existingRouteDetails[0].destination} to ${newRouteDetails[0].origin} in available time`,
                            details: {
                                type: isDriver ? 'geographic_conflict' : 'bus_geographic_conflict',
                                existingLocation: existingRouteDetails[0].destination,
                                newLocation: newRouteDetails[0].origin,
                                timeAvailable: timeBetween,
                                travelTimeRequired: travelTime
                            }
                        };
                    }
                }
            }
        }
    }

    return { hasConflict: false };
}

async function checkTimeConflict(
    existingShift: { routeId: number; shiftTime: string },
    newShiftTime: string,
    newRouteId: number,
    routeDuration: number,
    isDriver: boolean
): Promise<{ hasConflict: boolean; error?: string; details?: unknown }> {
    const existingRoute = await db
        .select({ estimatedDurationMinutes: routes.estimatedDurationMinutes })
        .from(routes)
        .where(eq(routes.id, existingShift.routeId))
        .limit(1);

    if (existingRoute.length > 0) {
        const existingDuration = existingRoute[0].estimatedDurationMinutes;

        if (hasTimeOverlap(newShiftTime, routeDuration, existingShift.shiftTime, existingDuration)) {
            const entityType = isDriver ? 'Driver' : 'Bus';
            const conflictType = isDriver ? 'time_overlap' : 'bus_time_overlap';

            return {
                hasConflict: true,
                error: `${entityType} has a conflicting shift at this time`,
                details: {
                    type: conflictType,
                    existingShift: {
                        time: existingShift.shiftTime,
                        duration: existingDuration
                    },
                    newShift: {
                        time: newShiftTime,
                        duration: routeDuration
                    }
                }
            };
        }
    }

    return { hasConflict: false };
}

async function checkShiftConflicts(
    driverId: number,
    busId: number,
    shiftDate: string,
    shiftTime: string,
    routeId: number,
    routeDuration: number
): Promise<{ hasConflict: boolean; error?: string; details?: unknown }> {
    const existingShifts = await db
        .select({
            id: shifts.id,
            shiftTime: shifts.shiftTime,
            driverId: shifts.driverId,
            busId: shifts.busId,
            routeId: shifts.routeId,
        })
        .from(shifts)
        .where(eq(shifts.shiftDate, shiftDate));

    const driverShifts = existingShifts.filter(shift => shift.driverId === driverId);
    for (const existingShift of driverShifts) {
        const timeConflict = await checkTimeConflict(existingShift, shiftTime, routeId, routeDuration, true);
        if (timeConflict.hasConflict) return timeConflict;

        const geoConflict = await checkGeographicConflict(existingShift, shiftTime, routeId, routeDuration, true);
        if (geoConflict.hasConflict) return geoConflict;
    }

    const busShifts = existingShifts.filter(shift => shift.busId === busId);
    for (const existingShift of busShifts) {
        const timeConflict = await checkTimeConflict(existingShift, shiftTime, routeId, routeDuration, false);
        if (timeConflict.hasConflict) return timeConflict;

        const geoConflict = await checkGeographicConflict(existingShift, shiftTime, routeId, routeDuration, false);
        if (geoConflict.hasConflict) return geoConflict;
    }

    return { hasConflict: false };
}

async function checkShiftConflictsForUpdate(
    shiftId: number,
    driverId: number,
    busId: number,
    shiftDate: string,
    shiftTime: string,
    routeId: number,
    routeDuration: number
): Promise<{ hasConflict: boolean; error?: string; details?: unknown }> {
    const existingShifts = await db
        .select({
            id: shifts.id,
            shiftTime: shifts.shiftTime,
            driverId: shifts.driverId,
            busId: shifts.busId,
            routeId: shifts.routeId,
        })
        .from(shifts)
        .where(
            and(
                eq(shifts.shiftDate, shiftDate),
                not(eq(shifts.id, shiftId))
            )
        );

    const driverShifts = existingShifts.filter(shift => shift.driverId === driverId);
    for (const existingShift of driverShifts) {
        const timeConflict = await checkTimeConflict(existingShift, shiftTime, routeId, routeDuration, true);
        if (timeConflict.hasConflict) return timeConflict;

        const geoConflict = await checkGeographicConflict(existingShift, shiftTime, routeId, routeDuration, true);
        if (geoConflict.hasConflict) return geoConflict;
    }

    const busShifts = existingShifts.filter(shift => shift.busId === busId);
    for (const existingShift of busShifts) {
        const timeConflict = await checkTimeConflict(existingShift, shiftTime, routeId, routeDuration, false);
        if (timeConflict.hasConflict) return timeConflict;

        const geoConflict = await checkGeographicConflict(existingShift, shiftTime, routeId, routeDuration, false);
        if (geoConflict.hasConflict) return geoConflict;
    }

    return { hasConflict: false };
}

async function getRouteDuration(routeId: number): Promise<number> {
    const routeDetails = await db
        .select({ estimatedDurationMinutes: routes.estimatedDurationMinutes })
        .from(routes)
        .where(eq(routes.id, routeId))
        .limit(1);

    if (routeDetails.length === 0) {
        throw new Error('Route not found');
    }

    return routeDetails[0].estimatedDurationMinutes;
}

async function validateShiftData(data: unknown): Promise<{ routeDuration: number; validatedData: { driverId: number; busId: number; routeId: number; shiftDate: string; shiftTime: string } }> {
    const validatedData = createShiftSchema.parse(data);
    const routeDuration = await getRouteDuration(validatedData.routeId);
    return { routeDuration, validatedData };
}

async function handleShiftConflict(conflictCheck: { hasConflict: boolean; error?: string; details?: unknown }): Promise<NextResponse> {
    return NextResponse.json({
        error: conflictCheck.error || 'Shift conflict detected',
        details: conflictCheck.details
    }, { status: 409 });
}

async function handleShiftError(error: unknown): Promise<NextResponse> {
    console.error('Shift operation error:', error);

    if (error instanceof AuthenticationError) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }

    if (error instanceof AuthorizationError) {
        return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
        );
    }

    if (error instanceof Error && error.message === 'Route not found') {
        return NextResponse.json(
            { error: 'Route not found' },
            { status: 404 }
        );
    }

    return NextResponse.json(
        { error: 'Failed to process shift operation' },
        { status: 500 }
    );
}

export async function GET(request: NextRequest) {
    try {
        await getAuthenticatedUser(request);

        const { searchParams } = new URL(request.url);
        const { page, limit } = paginationSchema.parse(Object.fromEntries(searchParams));
        const { date, startDate, endDate } = dateFilterSchema.parse(Object.fromEntries(searchParams));
        const { search } = searchSchema.parse(Object.fromEntries(searchParams));

        const driverId = searchParams.get('driverId');
        const busId = searchParams.get('busId');



        const offset = (page - 1) * limit;

        const conditions = [];

        if (date) {
            const formattedDate = new Date(date).toISOString().split('T')[0];
            conditions.push(eq(shifts.shiftDate, formattedDate));
        } else if (startDate && endDate) {
            const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
            const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
            conditions.push(and(
                gte(shifts.shiftDate, formattedStartDate),
                lte(shifts.shiftDate, formattedEndDate)
            ));
        }

        if (driverId) {
            conditions.push(eq(shifts.driverId, parseInt(driverId)));
        }

        if (busId) {
            conditions.push(eq(shifts.busId, parseInt(busId)));
        }





        const baseQuery = db
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
            .leftJoin(routes, eq(shifts.routeId, routes.id));

        let results;
        if (search) {
            // Add search conditions
            const searchConditions = or(
                ilike(drivers.name, `%${search}%`),
                ilike(buses.plateNumber, `%${search}%`),
                ilike(routes.origin, `%${search}%`),
                ilike(routes.destination, `%${search}%`)
            );

            if (conditions.length > 0) {
                results = await baseQuery.where(and(...conditions, searchConditions)).limit(limit).offset(offset);
            } else {
                results = await baseQuery.where(searchConditions).limit(limit).offset(offset);
            }

        } else {
            results = conditions.length > 0
                ? await baseQuery.where(and(...conditions)).limit(limit).offset(offset)
                : await baseQuery.limit(limit).offset(offset);
        }



        return NextResponse.json({
            shifts: results,
            pagination: {
                page,
                limit,
                total: results.length,
            },
        });

    } catch (error) {
        console.error('❌ GET /api/shifts error:', error);
        return handleShiftError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        requireRole(user.role, ['admin', 'dispatcher']);

        const body = await request.json();
        const { routeDuration, validatedData } = await validateShiftData(body);

        const conflictCheck = await checkShiftConflicts(
            validatedData.driverId,
            validatedData.busId,
            validatedData.shiftDate,
            validatedData.shiftTime,
            validatedData.routeId,
            routeDuration
        );

        if (conflictCheck.hasConflict) {
            return handleShiftConflict(conflictCheck);
        }

        const createdShift = await db.insert(shifts).values({
            driverId: validatedData.driverId,
            busId: validatedData.busId,
            routeId: validatedData.routeId,
            shiftDate: validatedData.shiftDate,
            shiftTime: validatedData.shiftTime,
        }).returning();

        return NextResponse.json({
            message: 'Shift created successfully',
            shift: createdShift[0],
        }, { status: 201 });

    } catch (error) {
        return handleShiftError(error);
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        requireRole(user.role, ['admin', 'dispatcher']);

        const { searchParams } = new URL(request.url);
        const shiftId = searchParams.get('id');

        if (!shiftId) {
            return NextResponse.json(
                { error: 'Shift ID is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { routeDuration, validatedData } = await validateShiftData(body);

        const existingShift = await db
            .select()
            .from(shifts)
            .where(eq(shifts.id, parseInt(shiftId)))
            .limit(1);

        if (existingShift.length === 0) {
            return NextResponse.json(
                { error: 'Shift not found' },
                { status: 404 }
            );
        }

        const conflictCheck = await checkShiftConflictsForUpdate(
            parseInt(shiftId),
            validatedData.driverId,
            validatedData.busId,
            validatedData.shiftDate,
            validatedData.shiftTime,
            validatedData.routeId,
            routeDuration
        );

        if (conflictCheck.hasConflict) {
            return handleShiftConflict(conflictCheck);
        }

        const updatedShift = await db
            .update(shifts)
            .set({
                driverId: validatedData.driverId,
                busId: validatedData.busId,
                routeId: validatedData.routeId,
                shiftDate: validatedData.shiftDate,
                shiftTime: validatedData.shiftTime,
            })
            .where(eq(shifts.id, parseInt(shiftId)))
            .returning();

        return NextResponse.json({
            message: 'Shift updated successfully',
            shift: updatedShift[0],
        });

    } catch (error) {
        return handleShiftError(error);
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        requireRole(user.role, ['admin', 'dispatcher']);

        const { searchParams } = new URL(request.url);
        const shiftId = searchParams.get('id');

        if (!shiftId) {
            return NextResponse.json(
                { error: 'Shift ID is required' },
                { status: 400 }
            );
        }

        const body = await request.json();

        const existingShift = await db
            .select()
            .from(shifts)
            .where(eq(shifts.id, parseInt(shiftId)))
            .limit(1);

        if (existingShift.length === 0) {
            return NextResponse.json(
                { error: 'Shift not found' },
                { status: 404 }
            );
        }

        const updateData = {
            ...existingShift[0],
            ...body,
        };

        const { routeDuration, validatedData } = await validateShiftData(updateData);

        const conflictCheck = await checkShiftConflictsForUpdate(
            parseInt(shiftId),
            validatedData.driverId,
            validatedData.busId,
            validatedData.shiftDate,
            validatedData.shiftTime,
            validatedData.routeId,
            routeDuration
        );

        if (conflictCheck.hasConflict) {
            return handleShiftConflict(conflictCheck);
        }

        const updatedShift = await db
            .update(shifts)
            .set({
                driverId: validatedData.driverId,
                busId: validatedData.busId,
                routeId: validatedData.routeId,
                shiftDate: validatedData.shiftDate,
                shiftTime: validatedData.shiftTime,
            })
            .where(eq(shifts.id, parseInt(shiftId)))
            .returning();

        return NextResponse.json({
            message: 'Shift updated successfully',
            shift: updatedShift[0],
        });

    } catch (error) {
        return handleShiftError(error);
    }
} 