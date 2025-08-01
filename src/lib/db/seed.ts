import { db } from './connection';
import { users, drivers, buses, routes, shifts } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
    try {


        const hashedPassword = await bcrypt.hash('admin123', 10);

        await db.insert(users).values([
            {
                username: 'admin',
                passwordHash: hashedPassword,
                role: 'admin',
            },
            {
                username: 'dispatcher',
                passwordHash: hashedPassword,
                role: 'dispatcher',
            },
            {
                username: 'viewer',
                passwordHash: hashedPassword,
                role: 'viewer',
            },
        ]).returning();



        const seededDrivers = await db.insert(drivers).values([
            {
                name: 'Younes Barrad',
                licenseNumber: 'DL001234',
                available: true,
            },
            {
                name: 'Yassine E.',
                licenseNumber: 'DL001235',
                available: true,
            },
            {
                name: 'ACHRAF ELMARDI',
                licenseNumber: 'DL001236',
                available: true,
            },
            {
                name: 'Omar Chaabi',
                licenseNumber: 'DL001237',
                available: true,
            },
            {
                name: 'EL houssin CHEBLI',
                licenseNumber: 'DL001238',
                available: true,
            },
            {
                name: 'Ibtissam Eljaouhari',
                licenseNumber: 'DL001239',
                available: true,
            },
            {
                name: 'Nouhaïla Amajjad',
                licenseNumber: 'DL001240',
                available: true,
            },
            {
                name: 'Hamza Ait Darhem',
                licenseNumber: 'DL001241',
                available: true,
            },
        ]).returning();



        const seededBuses = await db.insert(buses).values([
            {
                plateNumber: 'BUS001',
                capacity: 50,
            },
            {
                plateNumber: 'BUS002',
                capacity: 45,
            },
            {
                plateNumber: 'BUS003',
                capacity: 40,
            },
            {
                plateNumber: 'BUS004',
                capacity: 35,
            },
            {
                plateNumber: 'BUS005',
                capacity: 30,
            },
            {
                plateNumber: 'BUS006',
                capacity: 25,
            },
            {
                plateNumber: 'BUS007',
                capacity: 30,
            },
        ]).returning();



        const seededRoutes = await db.insert(routes).values([
            {
                origin: 'Casablanca',
                destination: 'Agadir',
                estimatedDurationMinutes: 240,
            },
            {
                origin: 'Rabat',
                destination: 'Oujda',
                estimatedDurationMinutes: 300,
            },
            {
                origin: 'Casablanca',
                destination: 'Oujda',
                estimatedDurationMinutes: 360,
            },
            {
                origin: 'Agadir',
                destination: 'Casablanca',
                estimatedDurationMinutes: 240,
            },
            {
                origin: 'Casablanca',
                destination: 'Inezgane',
                estimatedDurationMinutes: 180,
            },
            {
                origin: 'Oujda',
                destination: 'Casablanca',
                estimatedDurationMinutes: 360,
            },
            {
                origin: 'Agadir',
                destination: 'Marrakech',
                estimatedDurationMinutes: 180,
            },
            {
                origin: 'Rabat',
                destination: 'Agadir',
                estimatedDurationMinutes: 240,
            },
            {
                origin: 'Oujda',
                destination: 'Rabat',
                estimatedDurationMinutes: 300,
            },
            {
                origin: 'Inezgane',
                destination: 'Casablanca',
                estimatedDurationMinutes: 180,
            },
            {
                origin: 'Casablanca',
                destination: 'Fes',
                estimatedDurationMinutes: 120,
            },
            {
                origin: 'Marrakech',
                destination: 'Agadir',
                estimatedDurationMinutes: 180,
            },
        ]).returning();



        await db.insert(shifts).values([
            {
                driverId: seededDrivers[0].id,
                busId: seededBuses[0].id,
                routeId: seededRoutes[0].id,
                shiftTime: '06:00',
                shiftDate: '2024-01-01',
            },
            {
                driverId: seededDrivers[1].id,
                busId: seededBuses[1].id,
                routeId: seededRoutes[1].id,
                shiftTime: '10:00',
                shiftDate: '2024-01-01',
            },
            {
                driverId: seededDrivers[2].id,
                busId: seededBuses[2].id,
                routeId: seededRoutes[2].id,
                shiftTime: '14:00',
                shiftDate: '2024-01-01',
            },
            {
                driverId: seededDrivers[3].id,
                busId: seededBuses[3].id,
                routeId: seededRoutes[3].id,
                shiftTime: '18:00',
                shiftDate: '2024-01-01',
            },
            {
                driverId: seededDrivers[4].id,
                busId: seededBuses[4].id,
                routeId: seededRoutes[4].id,
                shiftTime: '08:00',
                shiftDate: '2024-01-02',
            },
            {
                driverId: seededDrivers[5].id,
                busId: seededBuses[5].id,
                routeId: seededRoutes[5].id,
                shiftTime: '12:00',
                shiftDate: '2024-01-02',
            },
            {
                driverId: seededDrivers[6].id,
                busId: seededBuses[6].id,
                routeId: seededRoutes[6].id,
                shiftTime: '16:00',
                shiftDate: '2024-01-02',
            },
        ]);

        console.log('🌱 Database seeded successfully!');
        console.log(`👤 Created ${seededDrivers.length} drivers`);
        console.log(`🚌 Created ${seededBuses.length} buses`);
        console.log(`🛣️ Created ${seededRoutes.length} routes`);
        console.log(`📅 Created shifts successfully`);


    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}

seed().catch(console.error); 