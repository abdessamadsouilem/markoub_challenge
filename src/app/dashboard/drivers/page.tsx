'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDrivers } from '@/hooks/useDrivers';
import { useAuth } from '@/hooks/useAuth';
import { canUserPerformAction } from '@/lib/utils';
import { Plus, Edit, Trash2, Search, UserCheck, UserX } from 'lucide-react';
import { Driver, NewDriver } from '@/lib/db/schema';

interface DriverFormData {
    name: string;
    licenseNumber: string;
    available: boolean;
}

export default function DriversPage() {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const { drivers, loading, createDriver, updateDriver, deleteDriver } = useDrivers({
        search: debouncedSearchTerm,
        limit: 50,
    });

    const [showForm, setShowForm] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
    const [formData, setFormData] = useState<DriverFormData>({
        name: '',
        licenseNumber: '',
        available: true,
    });

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const canCreate = user && canUserPerformAction(user.role, 'create', 'drivers');
    const canEdit = user && canUserPerformAction(user.role, 'edit', 'drivers');
    const canDelete = user && canUserPerformAction(user.role, 'delete', 'drivers');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingDriver) {
            const result = await updateDriver(editingDriver.id, formData);
            if (result.success) {
                resetForm();
            }
        } else {
            const result = await createDriver(formData as NewDriver);
            if (result.success) {
                resetForm();
            }
        }
    };

    const handleEdit = (driver: Driver) => {
        setEditingDriver(driver);
        setFormData({
            name: driver.name,
            licenseNumber: driver.licenseNumber,
            available: driver.available,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this driver?')) {
            await deleteDriver(id);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            licenseNumber: '',
            available: true,
        });
        setEditingDriver(null);
        setShowForm(false);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
                        <p className="mt-2 text-gray-600">
                            Manage bus drivers and their information
                        </p>
                    </div>
                    {canCreate && (
                        <Button
                            onClick={() => setShowForm(true)}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Driver
                        </Button>
                    )}
                </div>

                <Card className="border-orange-200">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Search className="w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search drivers by name or license number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {showForm && (
                    <Card className="border-orange-200">
                        <CardHeader>
                            <CardTitle className="text-orange-600">
                                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
                            </CardTitle>
                            <CardDescription>
                                {editingDriver ? 'Update driver information' : 'Create a new driver record'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter driver's full name"
                                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="licenseNumber">License Number</Label>
                                        <Input
                                            id="licenseNumber"
                                            type="text"
                                            required
                                            value={formData.licenseNumber}
                                            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                            placeholder="Enter license number"
                                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            id="available"
                                            type="checkbox"
                                            checked={formData.available}
                                            onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                                            className=" border-orange-300 text-orange-600 focus:ring-orange-500"
                                        />
                                        <Label htmlFor="available">Driver is available for shifts</Label>
                                    </div>
                                </div>
                                <div className="flex space-x-4">
                                    <Button
                                        type="submit"
                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                        {editingDriver ? 'Update Driver' : 'Create Driver'}
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
                    <CardHeader>
                        <CardTitle className="text-orange-600">All Drivers</CardTitle>
                        <CardDescription>
                            Total: {drivers.length} drivers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                                <p className="mt-2 text-gray-600">Loading drivers...</p>
                            </div>
                        ) : drivers.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No drivers found.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>License Number</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {drivers.map((driver) => (
                                        <TableRow key={driver.id}>
                                            <TableCell className="font-medium">{driver.name}</TableCell>
                                            <TableCell>{driver.licenseNumber}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    {driver.available ? (
                                                        <>
                                                            <UserCheck className="w-4 h-4 text-green-600" />
                                                            <span className="text-green-600">Available</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserX className="w-4 h-4 text-red-600" />
                                                            <span className="text-red-600">Unavailable</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(driver.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-2">
                                                    {canEdit && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(driver)}
                                                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {canDelete && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(driver.id)}
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