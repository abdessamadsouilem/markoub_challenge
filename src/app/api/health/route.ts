import { NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
    const startTime = Date.now();

    try {
        const dbStartTime = Date.now();
        await db.execute('SELECT 1');
        const dbResponseTime = Date.now() - dbStartTime;

        const memoryUsage = process.memoryUsage();

        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            responseTime: Date.now() - startTime,
            services: {
                database: {
                    status: 'healthy',
                    responseTime: dbResponseTime,
                },
            },
            system: {
                memory: {
                    used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    external: Math.round(memoryUsage.external / 1024 / 1024),
                },
                nodeVersion: process.version,
                platform: process.platform,
            },
        };

        return NextResponse.json(healthData);
    } catch (error: unknown) {
        console.error('Health check error:', error);
        if (error instanceof Error && (error as { code?: string }).code === '23505') {
            return NextResponse.json({ error: 'Database constraint violation' }, { status: 409 });
        }
        return NextResponse.json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export async function POST() {
    const startTime = Date.now();
    const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        responseTime: Date.now() - startTime,
    };

    try {
        // Test database connection
        await db.execute(sql`SELECT 1`);
        return NextResponse.json(healthData);
    } catch (error: unknown) {
        console.error('Health check error:', error);
        if (error instanceof Error && (error as { code?: string }).code === '23505') {
            return NextResponse.json({ error: 'Database constraint violation' }, { status: 409 });
        }
        return NextResponse.json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
} 