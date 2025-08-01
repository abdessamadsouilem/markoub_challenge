'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useShifts } from '@/hooks/useShifts';
import { useDrivers } from '@/hooks/useDrivers';
import { useBuses } from '@/hooks/useBuses';
import { useRoutes } from '@/hooks/useRoutes';
import { useAuth } from '@/hooks/useAuth';
import { canUserPerformAction, formatDate, formatTime } from '@/lib/utils';
import { Plus, Edit, Trash2, Search, Calendar, Clock, User, Bus, Route } from 'lucide-react';
import { NewShift, ShiftWithDetails } from '@/lib/db/schema';

interface ShiftFormData {
    driverId: number;
    busId: number;
    routeId: number;
    shiftDate: string;
    shiftTime: string;
}

export default function ShiftsPage() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const { shifts, loading, createShift, updateShift, deleteShift } = useShifts({
        date: selectedDate,
        search: searchTerm,
        limit: 100,
    });

    const { drivers } = useDrivers({ limit: 100 });
    const { buses } = useBuses({ limit: 100 });
    const { routes } = useRoutes({ limit: 100 });

    const [showForm, setShowForm] = useState(false);
    const [editingShift, setEditingShift] = useState<ShiftWithDetails | null>(null);
    const [formData, setFormData] = useState<ShiftFormData>({
        driverId: 0,
        busId: 0,
        routeId: 0,
        shiftDate: new Date().toISOString().split('T')[0],
        shiftTime: '09:00',
    });

    const canCreate = user && canUserPerformAction(user.role, 'create', 'shifts');
    const canEdit = user && canUserPerformAction(user.role, 'edit', 'shifts');
    const canDelete = user && canUserPerformAction(user.role, 'delete', 'shifts');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingShift) {
            const result = await updateShift(editingShift.id, formData);
            if (result.success) {
                resetForm();
            }
        } else {
            const result = await createShift(formData as NewShift);
            if (result.success) {
                resetForm();
            }
        }
    };

    const handleEdit = (shift: ShiftWithDetails) => {
        setEditingShift(shift);
        setFormData({
            driverId: shift.driver.id,
            busId: shift.bus.id,
            routeId: shift.route.id,
            shiftDate: shift.shiftDate,
            shiftTime: shift.shiftTime,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this shift?')) {
            await deleteShift(id);
        }
    };

    const resetForm = () => {
        setFormData({
            driverId: 0,
            busId: 0,
            routeId: 0,
            shiftDate: new Date().toISOString().split('T')[0],
            shiftTime: '09:00',
        });
        setEditingShift(null);
        setShowForm(false);
    };

    const availableDrivers = drivers.filter(driver => driver.available);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Shifts</h1>
                        <p className="mt-2 text-gray-600">
                            Schedule and manage driver shifts
                        </p>
                    </div>
                    {canCreate && (
                        <Button
                            onClick={() => setShowForm(true)}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Schedule Shift
                        </Button>
                    )}
                </div>
                {showForm && (
                    <Card className="border-orange-200">
                        <CardHeader>
                            <CardTitle className="text-orange-600">
                                {editingShift ? 'Edit Shift' : 'Schedule New Shift'}
                            </CardTitle>
                            <CardDescription>
                                {editingShift ? 'Update shift details' : 'Assign a driver to a bus and route'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="shiftDate">Date</Label>
                                        <Input
                                            id="shiftDate"
                                            type="date"
                                            required
                                            value={formData.shiftDate}
                                            onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
                                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="shiftTime">Time</Label>
                                        <Input
                                            id="shiftTime"
                                            type="time"
                                            required
                                            value={formData.shiftTime}
                                            onChange={(e) => setFormData({ ...formData, shiftTime: e.target.value })}
                                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="driverId">Driver</Label>
                                    <select
                                        id="driverId"
                                        required
                                        value={formData.driverId}
                                        onChange={(e) => setFormData({ ...formData, driverId: parseInt(e.target.value) })}
                                        className="w-full  border border-orange-200 bg-background px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                                    >
                                        <option value="">Select a driver</option>
                                        {availableDrivers.map((driver) => (
                                            <option key={driver.id} value={driver.id}>
                                                {driver.name} ({driver.licenseNumber})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="busId">Bus</Label>
                                    <select
                                        id="busId"
                                        required
                                        value={formData.busId}
                                        onChange={(e) => setFormData({ ...formData, busId: parseInt(e.target.value) })}
                                        className="w-full  border border-orange-200 bg-background px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                                    >
                                        <option value="">Select a bus</option>
                                        {buses.map((bus) => (
                                            <option key={bus.id} value={bus.id}>
                                                {bus.plateNumber} ({bus.capacity} seats)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="routeId">Route</Label>
                                    <select
                                        id="routeId"
                                        required
                                        value={formData.routeId}
                                        onChange={(e) => setFormData({ ...formData, routeId: parseInt(e.target.value) })}
                                        className="w-full  border border-orange-200 bg-background px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                                    >
                                        <option value="">Select a route</option>
                                        {routes.map((route) => (
                                            <option key={route.id} value={route.id}>
                                                {route.origin} → {route.destination} ({route.estimatedDurationMinutes}m)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex space-x-4">
                                    <Button
                                        type="submit"
                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                        {editingShift ? 'Update Shift' : 'Schedule Shift'}
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
                        <div className="flex items-center space-x-4">
                            <Calendar className="w-5 h-5 text-orange-600" />
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="shiftDate" className="text-sm font-medium">View shifts for:</Label>
                                <Input
                                    id="shiftDate"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-auto border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                />
                            </div>
                            <div className="text-sm text-gray-600">
                                {shifts.length} shifts scheduled
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-200">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Search className="w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search shifts by driver, bus, or route..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-200">
                    <CardHeader>
                        <CardTitle className="text-orange-600">
                            Shifts for {formatDate(selectedDate)}
                        </CardTitle>
                        <CardDescription>
                            All scheduled shifts for the selected date
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin -full h-8 w-8 border-b-2 border-orange-600"></div>
                            </div>
                        ) : shifts.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No shifts scheduled for this date</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Driver</TableHead>
                                        <TableHead>Bus</TableHead>
                                        <TableHead>Route</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shifts
                                        .sort((a, b) => a.shiftTime.localeCompare(b.shiftTime))
                                        .map((shift) => (
                                            <TableRow key={shift.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Clock className="w-4 h-4 text-orange-600" />
                                                        <span className="font-medium">{formatTime(shift.shiftTime)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <User className="w-4 h-4 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium">{shift.driver.name}</p>
                                                            <p className="text-sm text-gray-500">{shift.driver.licenseNumber}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Bus className="w-4 h-4 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium">{shift.bus.plateNumber}</p>
                                                            <p className="text-sm text-gray-500">{shift.bus.capacity} seats</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Route className="w-4 h-4 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium">{shift.route.origin}</p>
                                                            <p className="text-sm text-gray-500">to {shift.route.destination}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 -full text-sm">
                                                        {shift.route.estimatedDurationMinutes}m
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        {canEdit && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleEdit(shift)}
                                                                className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {canDelete && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDelete(shift.id)}
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