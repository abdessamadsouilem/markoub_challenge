import { z } from 'zod';

export const createDriverSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    licenseNumber: z.string().min(1, 'License number is required'),
    available: z.boolean().optional().default(true),
});

export const updateDriverSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    licenseNumber: z.string().min(1, 'License number is required').optional(),
    available: z.boolean().optional(),
});

export const createBusSchema = z.object({
    plateNumber: z.string().min(1, 'Plate number is required'),
    capacity: z.number().min(1, 'Capacity must be at least 1'),
});

export const updateBusSchema = z.object({
    plateNumber: z.string().min(1, 'Plate number is required').optional(),
    capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
});

export const createRouteSchema = z.object({
    origin: z.string().min(1, 'Origin is required'),
    destination: z.string().min(1, 'Destination is required'),
    estimatedDurationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
});

export const updateRouteSchema = z.object({
    origin: z.string().min(1, 'Origin is required').optional(),
    destination: z.string().min(1, 'Destination is required').optional(),
    estimatedDurationMinutes: z.number().min(1, 'Duration must be at least 1 minute').optional(),
});

export const createShiftSchema = z.object({
    driverId: z.number().min(1, 'Driver is required'),
    busId: z.number().min(1, 'Bus is required'),
    routeId: z.number().min(1, 'Route is required'),
    shiftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    shiftTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
});

export const updateShiftSchema = z.object({
    driverId: z.number().min(1, 'Driver is required').optional(),
    busId: z.number().min(1, 'Bus is required').optional(),
    routeId: z.number().min(1, 'Route is required').optional(),
    shiftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    shiftTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('10'),
});

export const searchSchema = z.object({
    search: z.string().optional(),
});

export const dateFilterSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type CreateBusInput = z.infer<typeof createBusSchema>;
export type UpdateBusInput = z.infer<typeof updateBusSchema>;
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>; 