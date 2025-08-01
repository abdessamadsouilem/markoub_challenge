'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRoutes } from '@/hooks/useRoutes';
import { useAuth } from '@/hooks/useAuth';
import { canUserPerformAction } from '@/lib/utils';
import { Plus, Edit, Trash2, Search, Route as RouteIcon, Clock, MapPin } from 'lucide-react';
import { Route, NewRoute } from '@/lib/db/schema';

interface RouteFormData {
    origin: string;
    destination: string;
    estimatedDurationMinutes: number;
}

export default function RoutesPage() {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const { routes, loading, createRoute, updateRoute, deleteRoute } = useRoutes({
        search: searchTerm,
        limit: 50,
    });

    const [showForm, setShowForm] = useState(false);
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);
    const [formData, setFormData] = useState<RouteFormData>({
        origin: '',
        destination: '',
        estimatedDurationMinutes: 0,
    });

    const canCreate = user && canUserPerformAction(user.role, 'create', 'routes');
    const canEdit = user && canUserPerformAction(user.role, 'edit', 'routes');
    const canDelete = user && canUserPerformAction(user.role, 'delete', 'routes');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingRoute) {
            const result = await updateRoute(editingRoute.id, formData);
            if (result.success) {
                resetForm();
            }
        } else {
            const result = await createRoute(formData as NewRoute);
            if (result.success) {
                resetForm();
            }
        }
    };

    const handleEdit = (route: Route) => {
        setEditingRoute(route);
        setFormData({
            origin: route.origin,
            destination: route.destination,
            estimatedDurationMinutes: route.estimatedDurationMinutes,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this route?')) {
            await deleteRoute(id);
        }
    };

    const resetForm = () => {
        setFormData({
            origin: '',
            destination: '',
            estimatedDurationMinutes: 0,
        });
        setEditingRoute(null);
        setShowForm(false);
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const totalDuration = routes.reduce((sum, route) => sum + route.estimatedDurationMinutes, 0);
    const avgDuration = routes.length > 0 ? Math.round(totalDuration / routes.length) : 0;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Routes</h1>
                        <p className="mt-2 text-gray-600">
                            Manage bus routes and estimated travel times
                        </p>
                    </div>
                    {canCreate && (
                        <Button
                            onClick={() => setShowForm(true)}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Route
                        </Button>
                    )}
                </div>



                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-orange-200">
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <RouteIcon className="w-8 h-8 text-orange-600 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
                                    <p className="text-sm text-gray-600">Total Routes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-orange-200">
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <Clock className="w-8 h-8 text-orange-600 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{formatDuration(totalDuration)}</p>
                                    <p className="text-sm text-gray-600">Total Duration</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-orange-200">
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <Clock className="w-8 h-8 text-orange-600 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{formatDuration(avgDuration)}</p>
                                    <p className="text-sm text-gray-600">Avg Duration</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {showForm && (
                    <Card className="border-orange-200">
                        <CardHeader>
                            <CardTitle className="text-orange-600">
                                {editingRoute ? 'Edit Route' : 'Add New Route'}
                            </CardTitle>
                            <CardDescription>
                                {editingRoute ? 'Update route information' : 'Create a new bus route'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="origin">Origin</Label>
                                        <Input
                                            id="origin"
                                            type="text"
                                            required
                                            value={formData.origin}
                                            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                            placeholder="Starting location (e.g., Downtown Terminal)"
                                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="destination">Destination</Label>
                                        <Input
                                            id="destination"
                                            type="text"
                                            required
                                            value={formData.destination}
                                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                            placeholder="Ending location (e.g., Airport)"
                                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.estimatedDurationMinutes}
                                        onChange={(e) => setFormData({ ...formData, estimatedDurationMinutes: parseInt(e.target.value) || 0 })}
                                        placeholder="Travel time in minutes"
                                        className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                    />
                                </div>
                                <div className="flex space-x-4">
                                    <Button
                                        type="submit"
                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                        {editingRoute ? 'Update Route' : 'Create Route'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={resetForm}
                                        className="border-gray-300"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
                <Card className="border-orange-200">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Search className="w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search routes by origin or destination..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-200">
                    <CardHeader>
                        <CardTitle className="text-orange-600">All Routes</CardTitle>
                        <CardDescription>
                            Manage bus routes and their travel times
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin -full h-8 w-8 border-b-2 border-orange-600"></div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Route</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {routes.map((route) => (
                                        <TableRow key={route.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <MapPin className="w-4 h-4 text-orange-600" />
                                                    <div>
                                                        <p className="font-medium">{route.origin}</p>
                                                        <p className="text-sm text-gray-500">to {route.destination}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm">{formatDuration(route.estimatedDurationMinutes)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(route.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    {canEdit && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(route)}
                                                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {canDelete && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(route.id)}
                                                            className="border-red-300 text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>


            </div>
        </DashboardLayout>
    );
} 