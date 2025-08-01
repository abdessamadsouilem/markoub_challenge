'use client';

import { useMemo } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useShifts } from '@/hooks/useShifts';
import { useDrivers } from '@/hooks/useDrivers';
import { useBuses } from '@/hooks/useBuses';
import { useRoutes } from '@/hooks/useRoutes';
import { Users, Bus, Route, Calendar } from 'lucide-react';

export default function DashboardPage() {
    const { shifts } = useShifts();
    const { drivers } = useDrivers();
    const { buses } = useBuses();
    const { routes } = useRoutes();

    const statsCards = useMemo(() => [
        {
            title: 'Total Drivers',
            value: drivers.length,
            description: 'Active drivers in the system',
            icon: Users,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
            loading: false, // Changed to false as per new_code
        },
        {
            title: 'Total Buses',
            value: buses.length,
            description: 'Available buses in fleet',
            icon: Bus,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
            loading: false, // Changed to false as per new_code
        },
        {
            title: 'Total Routes',
            value: routes.length,
            description: 'Configured bus routes',
            icon: Route,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
            loading: false, // Changed to false as per new_code
        },
        {
            title: "Today's Shifts",
            value: shifts.length,
            description: 'Scheduled shifts for today',
            icon: Calendar,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
            loading: false, // Changed to false as per new_code
        },
    ], [drivers.length, buses.length, routes.length, shifts.length]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-2 text-gray-600">
                        Welcome to the Bus Scheduler management system
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsCards.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.title} className="border-orange-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center">
                                        <div className={`p-2 ${stat.bgColor}`}>
                                            <Icon className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-600">
                                                {stat.title}
                                            </p>
                                            {stat.loading ? (
                                                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                                            ) : (
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {stat.value}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    <Card className="border-orange-200">
                        <CardHeader>
                            <CardTitle className="text-orange-600">Recent Activity</CardTitle>
                            <CardDescription>
                                Latest updates and changes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">System Ready</p>
                                        <p className="text-xs text-gray-600">All services operational</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Database Connected</p>
                                        <p className="text-xs text-gray-600">PostgreSQL running smoothly</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Authentication Active</p>
                                        <p className="text-xs text-gray-600">JWT tokens working</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
} 