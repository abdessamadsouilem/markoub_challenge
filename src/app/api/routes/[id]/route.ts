import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { routes } from '@/lib/db/schema';
import { getAuthenticatedUser, requireRole, AuthenticationError, AuthorizationError } from '@/lib/auth/service';
import { updateRouteSchema } from '@/lib/validations/entities';

export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await getAuthenticatedUser(request);

        const { id } = await params;
        const routeId = parseInt(id);
        if (isNaN(routeId)) {
            return NextResponse.json({ error: 'Invalid route ID' }, { status: 400 });
        }

        const route = await db.select().from(routes).where(eq(routes.id, routeId)).limit(1);

        if (route.length === 0) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        return NextResponse.json({ route: route[0] });
    } catch (error: unknown) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        console.error('Get route error:', error);
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
            return NextResponse.json({ error: 'Invalid route ID' }, { status: 400 });
        }

        const body = await request.json();
        const validatedData = updateRouteSchema.parse(body);

        const updatedRoute = await db
            .update(routes)
            .set(validatedData)
            .where(eq(routes.id, id))
            .returning();

        if (updatedRoute.length === 0) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        return NextResponse.json({
            route: updatedRoute[0],
            message: 'Route updated successfully',
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

        console.error('Update route error:', error);
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
            return NextResponse.json({ error: 'Invalid route ID' }, { status: 400 });
        }

        const deletedRoute = await db
            .delete(routes)
            .where(eq(routes.id, id))
            .returning();

        if (deletedRoute.length === 0) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Route deleted successfully',
        });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('Delete route error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 