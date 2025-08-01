'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBuses } from '@/hooks/useBuses';
import { useAuth } from '@/hooks/useAuth';
import { canUserPerformAction } from '@/lib/utils';
import { Plus, Edit, Trash2, Search, Bus as BusIcon } from 'lucide-react';
import { Bus, NewBus } from '@/lib/db/schema';

interface BusFormData {
    plateNumber: string;
    capacity: number;
}

export default function BusesPage() {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const { buses, loading, createBus, updateBus, deleteBus } = useBuses({
        search: searchTerm,
        limit: 50,
    });

    const [showForm, setShowForm] = useState(false);
    const [editingBus, setEditingBus] = useState<Bus | null>(null);
    const [formData, setFormData] = useState<BusFormData>({
        plateNumber: '',
        capacity: 0,
    });

    const canCreate = user && canUserPerformAction(user.role, 'create', 'buses');
    const canEdit = user && canUserPerformAction(user.role, 'edit', 'buses');
    const canDelete = user && canUserPerformAction(user.role, 'delete', 'buses');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingBus) {
            const result = await updateBus(editingBus.id, formData);
            if (result.success) {
                resetForm();
            }
        } else {
            const result = await createBus(formData as NewBus);
            if (result.success) {
                resetForm();
            }
        }
    };

    const handleEdit = (bus: Bus) => {
        setEditingBus(bus);
        setFormData({
            plateNumber: bus.plateNumber,
            capacity: bus.capacity,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this bus?')) {
            await deleteBus(id);
        }
    };

    const resetForm = () => {
        setFormData({
            plateNumber: '',
            capacity: 0,
        });
        setEditingBus(null);
        setShowForm(false);
    };

    const totalCapacity = buses.reduce((sum, bus) => sum + bus.capacity, 0);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Buses</h1>
                        <p className="mt-2 text-gray-600">
                            Manage the bus fleet and capacity
                        </p>
                    </div>
                    {canCreate && (
                        <Button
                            onClick={() => setShowForm(true)}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Bus
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-orange-200">
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <BusIcon className="w-8 h-8 text-orange-600 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{buses.length}</p>
                                    <p className="text-sm text-gray-600">Total Buses</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-orange-200">
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <BusIcon className="w-8 h-8 text-orange-600 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{totalCapacity}</p>
                                    <p className="text-sm text-gray-600">Total Capacity</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-orange-200">
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <BusIcon className="w-8 h-8 text-orange-600 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {buses.length > 0 ? Math.round(totalCapacity / buses.length) : 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Avg Capacity</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {showForm && (
                    <Card className="border-orange-200">
                        <CardHeader>
                            <CardTitle className="text-orange-600">
                                {editingBus ? 'Edit Bus' : 'Add New Bus'}
                            </CardTitle>
                            <CardDescription>
                                {editingBus ? 'Update bus information' : 'Add a new bus to the fleet'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="plateNumber">Plate Number</Label>
                                        <Input
                                            id="plateNumber"
                                            type="text"
                                            required
                                            value={formData.plateNumber}
                                            onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                                            placeholder="Enter plate number (e.g., BUS001)"
                                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="capacity">Seating Capacity</Label>
                                        <Input
                                            id="capacity"
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                            placeholder="Enter seating capacity"
                                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex space-x-4">
                                    <Button
                                        type="submit"
                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                        {editingBus ? 'Update Bus' : 'Add Bus'}
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
                                placeholder="Search buses by plate number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-200">
                    <CardHeader>
                        <CardTitle className="text-orange-600">Fleet Overview</CardTitle>
                        <CardDescription>
                            Manage your bus fleet and track capacity
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
                                        <TableHead>Plate Number</TableHead>
                                        <TableHead>Capacity</TableHead>
                                        <TableHead>Added</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {buses.map((bus) => (
                                        <TableRow key={bus.id}>
                                            <TableCell className="font-medium">{bus.plateNumber}</TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 bg-orange-100 text-orange-800 -full text-sm">
                                                    {bus.capacity} seats
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(bus.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    {canEdit && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(bus)}
                                                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {canDelete && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(bus.id)}
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