'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from 'react-hot-toast';

export default function LoginPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const { user, loading, login } = useAuth();
    const router = useRouter();

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(formData.username, formData.password);
    };

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    // Don't render login form if already authenticated
    if (user) {
        return null;
    }

    return (
        <>
            <Toaster position="top-right" />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <Card className="border-orange-200 shadow-lg">
                        <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                            <CardTitle className="text-3xl font-extrabold">Bus Scheduler</CardTitle>
                            <CardDescription className="text-orange-100">
                                Sign in to manage the bus scheduling system
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="username" className="text-gray-700">Username</Label>
                                        <Input
                                            id="username"
                                            name="username"
                                            type="text"
                                            required
                                            value={formData.username}
                                            onChange={(e) =>
                                                setFormData({ ...formData, username: e.target.value })
                                            }
                                            placeholder="Enter your username"
                                            className="border-orange-200 "
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="password" className="text-gray-700">Password</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) =>
                                                setFormData({ ...formData, password: e.target.value })
                                            }
                                            placeholder="Enter your password"
                                            className="border-orange-200 outline-none focus:outline-none focus:ring-0"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                                    disabled={loading}
                                >
                                    {loading ? 'Signing in...' : 'Sign in'}
                                </Button>
                            </form>

                            <div className="mt-6 p-4 bg-orange-50  border border-orange-200">
                                <h4 className="text-sm font-medium text-orange-900 mb-2">Test Credentials:</h4>
                                <div className="text-xs text-orange-700 space-y-1">
                                    <div><strong>Admin:</strong> admin / admin123</div>
                                    <div><strong>Dispatcher:</strong> dispatcher / dispatch123</div>
                                    <div><strong>Viewer:</strong> viewer / view123</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
} 